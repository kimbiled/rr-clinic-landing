// Receives the surgeon page popup lead and forwards it to the clinic's webhook.
// The popup shows success only after { ok: true }, so answer it only once the webhook confirmed.
const MAX_BODY = 2000;
const WEBHOOK_TIMEOUT = 8000;

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
  };
  if (!lead.name || !lead.doctor || !/^\+7\d{10}$/.test(lead.phone) || !/^\/(?!\/)/.test(lead.page)) return null;
  return lead;
}

export async function POST(request) {
  const lead = parseLead(await request.text());
  if (!lead) return Response.json({ ok: false }, { status: 400 });
  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (!webhook) {
    console.error('LEAD_WEBHOOK_URL is not set');
    return Response.json({ ok: false }, { status: 503 });
  }
  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lead, createdAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT),
    });
    if (!response.ok) throw new Error(`webhook answered ${response.status}`);
  } catch (error) {
    // The lead itself is personal data: keep it out of the logs.
    console.error('Lead webhook failed:', error.message);
    return Response.json({ ok: false }, { status: 502 });
  }
  return Response.json({ ok: true });
}
