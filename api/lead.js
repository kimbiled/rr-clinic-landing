// Receives the surgeon page popup lead and creates a lead in the clinic's Bitrix24 CRM.
// The popup shows success only after { ok: true }, so answer it only once Bitrix24 returned the new lead id.
const MAX_BODY = 2000;
const CRM_TIMEOUT = 8000;
const UTM_KEYS = ['source', 'medium', 'campaign', 'content', 'term'];

function text(value, limit) {
  if (typeof value !== 'string') return '';
  const trimmed = value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  return trimmed.length <= limit ? trimmed : '';
}

function parseLead(body) {
  if (body.length > MAX_BODY) return null;
  let input;
  try { input = JSON.parse(body); } catch { return null; }
  const lead = {
    name: text(input?.name, 80),
    phone: text(input?.phone, 12),
    doctor: text(input?.doctor, 80),
    page: text(input?.page, 200),
    utm: {},
  };
  if (!lead.name || !lead.doctor || !/^\+7\d{10}$/.test(lead.phone) || !/^\/(?!\/)/.test(lead.page)) return null;
  // UTM tags only help the managers: a malformed one is dropped, never a reason to lose the lead.
  for (const key of UTM_KEYS) {
    const value = text(input?.utm?.[key], 200);
    if (value) lead.utm[key] = value;
  }
  return lead;
}

// The clinic's Bitrix24 has a "Сайт доктор …" source per doctor; the rest go to the general "Сайт" source.
const SITE_SOURCE = 'UC_EUES3Y';
const DOCTOR_SOURCES = {
  'kurmanbayev-rustam': 'UC_SRZAY8',
  'temirkhanov-amir': 'UC_RDY76A',
  'mussa-baurzhan': 'UC_B6PNAN',
  'savelyev-evgeniy': 'UC_4HW3DS',
  'tulepbergenova-tomiris': 'UC_AU1VXW',
  'chatinyan-garik': 'UC_9Z060F',
  'kodzoeva-leila': 'UC_L4WCH5',
  'ulagasheva-alina': 'UC_I2WVSE',
};

// The service is the address's last part (/kurmanbayev-rustam/abdominoplasty/); a doctor's own page names none.
const SERVICES = {
  mammoplasty: 'Маммопластика',
  abdominoplasty: 'Абдоминопластика',
  blepharoplasty: 'Блефаропластика',
  rhinoplasty: 'Ринопластика',
  facelift: 'Фейслифтинг',
  otoplasty: 'Отопластика',
  'intimate-surgery': 'Интимная пластика',
};

export function serviceOf(page) {
  const slug = page.split('/')[2] || '';
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return 'консультация (страница врача)';
  return SERVICES[slug] ? `${SERVICES[slug]} (${slug})` : slug;
}

// Managers see the doctor and the service in the lead title and comment; the page address stays in the source.
export function crmLead(lead, host) {
  const url = `https://${/^[a-z0-9.-]+(:\d+)?$/i.test(host || '') ? host : 'rr-clinic.kz'}${lead.page}`;
  const service = serviceOf(lead.page);
  const fields = {
    TITLE: `Заявка с сайта: ${lead.doctor} — ${service}`,
    NAME: lead.name,
    PHONE: [{ VALUE: lead.phone, VALUE_TYPE: 'WORK' }],
    SOURCE_ID: DOCTOR_SOURCES[lead.page.split('/')[1]] || SITE_SOURCE,
    SOURCE_DESCRIPTION: url,
    COMMENTS: `Врач: ${lead.doctor}\nУслуга: ${service}\nПопап «Консультация + 3 PDF в подарок»`,
  };
  for (const [key, value] of Object.entries(lead.utm)) fields[`UTM_${key.toUpperCase()}`] = value;
  return { fields, params: { REGISTER_SONET_EVENT: 'Y' } };
}

export async function POST(request) {
  const lead = parseLead(await request.text());
  if (!lead) return Response.json({ ok: false }, { status: 400 });
  const webhook = process.env.BITRIX_WEBHOOK_URL;
  if (!webhook) {
    console.error('BITRIX_WEBHOOK_URL is not set');
    return Response.json({ ok: false }, { status: 503 });
  }
  try {
    const response = await fetch(`${webhook.replace(/\/+$/, '')}/crm.lead.add.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(crmLead(lead, request.headers.get('host'))),
      signal: AbortSignal.timeout(CRM_TIMEOUT),
    });
    const answer = await response.json().catch(() => ({}));
    if (!response.ok || !(Number(answer.result) > 0)) throw new Error(`Bitrix24 answered ${response.status} ${answer.error || ''}`);
  } catch (error) {
    // The lead itself is personal data: keep it out of the logs.
    console.error('Bitrix24 lead failed:', error.message);
    return Response.json({ ok: false }, { status: 502 });
  }
  return Response.json({ ok: true });
}
