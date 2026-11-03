<?php
// PHP twin of api/lead.js for shared hosting: creates a lead in the clinic's Bitrix24 CRM.
// The popup shows success only after {"ok":true}, so answer it only once Bitrix24 returned the new lead id.
// The Bitrix24 webhook address lives one level above the site folder, in lead-config.php (see hosting/README.md).
const MAX_BODY = 2000;
const CRM_TIMEOUT = 8;
const UTM_KEYS = ['source', 'medium', 'campaign', 'content', 'term'];
// The clinic's Bitrix24 has a "Сайт доктор …" source per doctor; the rest go to the general "Сайт" source.
const SITE_SOURCE = 'UC_EUES3Y';
const DOCTOR_SOURCES = [
  'kurmanbayev-rustam' => 'UC_SRZAY8',
  'temirkhanov-amir' => 'UC_RDY76A',
  'mussa-baurzhan' => 'UC_B6PNAN',
  'savelyev-evgeniy' => 'UC_4HW3DS',
  'tulepbergenova-tomiris' => 'UC_AU1VXW',
  'chatinyan-garik' => 'UC_9Z060F',
  'kodzoeva-leila' => 'UC_L4WCH5',
  'ulagasheva-alina' => 'UC_I2WVSE',
];
// The service is the address's last part (/kurmanbayev-rustam/abdominoplasty/); a doctor's own page names none.
const SERVICES = [
  'mammoplasty' => 'Маммопластика',
  'abdominoplasty' => 'Абдоминопластика',
  'blepharoplasty' => 'Блефаропластика',
  'rhinoplasty' => 'Ринопластика',
  'facelift' => 'Фейслифтинг',
  'otoplasty' => 'Отопластика',
  'intimate-surgery' => 'Интимная пластика',
];

function service_of($page) {
  $slug = explode('/', $page)[2] ?? '';
  if (!preg_match('/^[a-z0-9-]{1,60}$/', $slug)) return 'консультация (страница врача)';
  return isset(SERVICES[$slug]) ? SERVICES[$slug] . " ($slug)" : $slug;
}

function respond($status, $ok) {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['ok' => $ok]);
  exit;
}

function text($value, $limit) {
  if (!is_string($value)) return '';
  $trimmed = trim((string) preg_replace('/[\x00-\x1f\x7f]/u', ' ', $value));
  return preg_match('/^.{0,' . $limit . '}$/su', $trimmed) ? $trimmed : '';
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, false);

$body = file_get_contents('php://input');
if ($body === false || strlen($body) > MAX_BODY) respond(400, false);
$input = json_decode($body, true);
if (!is_array($input)) respond(400, false);

$lead = [
  'name' => text($input['name'] ?? null, 80),
  'phone' => text($input['phone'] ?? null, 12),
  'doctor' => text($input['doctor'] ?? null, 80),
  'page' => text($input['page'] ?? null, 200),
];
if ($lead['name'] === '' || $lead['doctor'] === '' || !preg_match('/^\+7\d{10}$/', $lead['phone']) || !preg_match('#^/(?!/)#', $lead['page'])) {
  respond(400, false);
}

$config = dirname(__DIR__, 2) . '/lead-config.php';
$webhook = is_file($config) ? require $config : '';
if (!is_string($webhook) || $webhook === '') {
  error_log('lead-config.php is missing or empty');
  respond(503, false);
}

// Managers see the doctor and the service in the lead title and comment; the page address stays in the source.
$host = $_SERVER['HTTP_HOST'] ?? '';
$url = 'https://' . (preg_match('/^[a-z0-9.-]+(:\d+)?$/i', $host) ? $host : 'rr-clinic.kz') . $lead['page'];
$service = service_of($lead['page']);
$fields = [
  'TITLE' => 'Заявка с сайта: ' . $lead['doctor'] . ' — ' . $service,
  'NAME' => $lead['name'],
  'PHONE' => [['VALUE' => $lead['phone'], 'VALUE_TYPE' => 'WORK']],
  'SOURCE_ID' => DOCTOR_SOURCES[explode('/', $lead['page'])[1]] ?? SITE_SOURCE,
  'SOURCE_DESCRIPTION' => $url,
  'COMMENTS' => "Врач: {$lead['doctor']}\nУслуга: {$service}\nПопап «Консультация + 3 PDF в подарок»",
];
// UTM tags only help the managers: a malformed one is dropped, never a reason to lose the lead.
$utm = is_array($input['utm'] ?? null) ? $input['utm'] : [];
foreach (UTM_KEYS as $key) {
  $value = text($utm[$key] ?? null, 200);
  if ($value !== '') $fields['UTM_' . strtoupper($key)] = $value;
}

$curl = curl_init(rtrim($webhook, '/') . '/crm.lead.add.json');
curl_setopt_array($curl, [
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => json_encode(['fields' => $fields, 'params' => ['REGISTER_SONET_EVENT' => 'Y']], JSON_UNESCAPED_UNICODE),
  CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => CRM_TIMEOUT,
]);
$sent = curl_exec($curl);
$status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
curl_close($curl);
$answer = is_string($sent) ? json_decode($sent, true) : null;
if ($status < 200 || $status >= 300 || !is_array($answer) || (int) ($answer['result'] ?? 0) <= 0) {
  // The lead itself is personal data: keep it out of the logs.
  error_log('Bitrix24 lead failed: HTTP ' . $status . ' ' . (is_array($answer) ? (string) ($answer['error'] ?? '') : ''));
  respond(502, false);
}
respond(200, true);
