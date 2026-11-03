import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { test } from 'node:test';
import { POST } from '../api/lead.js';
import { SURGEONS, SURGEON_ROUTES, consultationLink, decodeAttribute, isConsultationLink } from '../scripts/surgeon-pages.mjs';

const publicRoot = new URL('../public/', import.meta.url);

test('all 24 requested pages contain complete SSR, the shared offer, and their own consultation links', async () => {
  assert.equal(SURGEON_ROUTES.length, 24);
  assert.equal(Object.keys(SURGEONS).length, 10);
  for (const route of SURGEON_ROUTES) {
    const html = await readFile(new URL(`${route}/index.html`, publicRoot), 'utf8');
    assert.ok(html.includes('data-framer-root'), `${route}: empty Framer shell`);
    assert.ok(html.includes('<html lang="ru"'), route);
    assert.equal((html.match(/src="\/assets\/surgeon-pages.js"/g) || []).length, 1, route);
    assert.ok(html.includes('w < 810 ? 393 : 1440'), `${route}: inconsistent mobile breakpoint`);
    const expected = consultationLink(html, route);
    const configured = decodeAttribute(/data-consultation="([^"]+)"/.exec(html)[1]);
    assert.equal(configured, expected, route);
    const links = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((m) => m[1]).filter(isConsultationLink);
    assert.ok(links.length >= 10, `${route}: consultation links missing`);
    for (const link of links) assert.equal(decodeAttribute(link), expected, `${route}: a button books another doctor`);
    if (route.includes('/')) {
      const parent = await readFile(new URL(`${route.split('/')[0]}/index.html`, publicRoot), 'utf8');
      assert.equal(consultationLink(parent, route), expected, `${route}: procedure and profile must book the same doctor`);
    }
  }
});

test('inline scripts parse: a syntax error here keeps the page hidden until the 4 s guard', async () => {
  for (const route of [...SURGEON_ROUTES, 'privacy-policy']) {
    const html = await readFile(new URL(`${route}/index.html`, publicRoot), 'utf8');
    for (const [, attrs, code] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (/\bsrc=|type="(?:application|framer|importmap)/.test(attrs) || !code.trim()) continue;
      assert.doesNotThrow(() => new Function(code), `${route}: broken inline script`);
    }
  }
});

test('unrelated pages have no surgeon offer and its local assets exist', async () => {
  for (const page of ['../index.html', 'privacy-policy/index.html']) {
    const html = await readFile(new URL(page, publicRoot), 'utf8');
    assert.ok(!html.includes('/assets/surgeon-pages.js'), page);
  }
  for (const asset of ['assets/surgeon-pages.js', 'assets/surgeon-pages.css', 'assets/img/web/consultation-books.webp', 'assets/icons/offer-pattern.svg']) {
    await access(new URL(asset, publicRoot));
  }
});

test('sync refuses another doctor or a non-WhatsApp lookalike as the consultation destination', () => {
  const wrong = '<a href="https://api.whatsapp.com/send/?phone=77475696969&amp;text=консультацию+к+доктору+Рустаму+Курманбаеву">Записаться</a>';
  assert.throws(() => consultationLink(wrong, 'mussa-baurzhan'), /consultation URL is missing/);
  assert.throws(() => consultationLink(wrong, 'not-a-surgeon'), /Unknown surgeon/);
  assert.equal(isConsultationLink('https://api.whatsapp.com.example.org/send/?text=консультацию'), false);
});

test('every page loads its patched Framer bundles and shows the approved FAQ', async () => {
  const faq = JSON.parse(await readFile(new URL('../scripts/surgeon-faq.json', import.meta.url), 'utf8'));
  assert.equal(Object.keys(faq).length, 24);
  const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  for (const route of SURGEON_ROUTES) {
    const html = await readFile(new URL(`${route}/index.html`, publicRoot), 'utf8');
    const head = html.indexOf('<script type="importmap"');
    assert.ok(head > -1 && head < html.search(/<script\b(?! type="importmap")/), `${route}: import map must come before other scripts`);
    const { imports } = JSON.parse(/<script type="importmap" data-rr-bundles>(.*?)<\/script>/s.exec(html)[1]);
    for (const local of Object.values(imports)) {
      const code = await readFile(new URL(local.slice(1), publicRoot), 'utf8');
      assert.ok(!/from\s*"\.\//.test(code), `${local}: relative import would miss Framer's CDN`);
    }
    assert.equal(faq[route].length, 10, route);
    for (const { question, answer } of faq[route]) {
      assert.ok(html.includes(escape(question)) && html.includes(escape(answer)), `${route}: ${question}`);
    }
    assert.ok(html.includes('href="/privacy-policy/"'), `${route}: consent link`);
  }
});

test('only Rustam\'s three pages show the new consultation photo, and the interview poster stays', async () => {
  await access(new URL('assets/img/web/rustam-consultation.webp', publicRoot));
  for (const route of SURGEON_ROUTES) {
    const html = await readFile(new URL(`${route}/index.html`, publicRoot), 'utf8');
    const rustam = route.startsWith('kurmanbayev-rustam');
    assert.equal(html.includes('rustam-consultation.webp'), rustam, route);
    assert.ok(!/EZ8nQCefTwlnonYzZWp8lEl7eM|Zp8naUxdXneV8OgCywoaV1IpffI/.test(html), route);
    if (rustam) assert.ok(html.includes('25NYFA5OiMlnrcSG1193S4gdxuM'), `${route}: interview poster`);
  }
});

const lead = { name: ' Айгерим ', phone: '+77475696969', doctor: 'Рустам Курманбаев', page: '/kurmanbayev-rustam/' };

function submit(body) {
  return POST(new Request('https://rr.test/api/lead', {
    method: 'POST',
    headers: { host: 'rr.test' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }));
}

const created = () => Response.json({ result: 7 });

async function withBitrix(respond, run) {
  const realFetch = globalThis.fetch;
  const realError = console.error;
  const calls = [];
  process.env.BITRIX_WEBHOOK_URL = 'https://crm.test/rest/1/key/';
  console.error = () => {};
  globalThis.fetch = async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return respond(); };
  try { await run(calls); } finally {
    globalThis.fetch = realFetch;
    console.error = realError;
    delete process.env.BITRIX_WEBHOOK_URL;
  }
}

test('a lead succeeds only after Bitrix24 creates it, and names the doctor and page', async () => {
  await withBitrix(created, async (calls) => {
    const response = await submit({ ...lead, utm: { source: 'instagram', campaign: 'breast', medium: 'x'.repeat(300) } });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(calls[0].url, 'https://crm.test/rest/1/key/crm.lead.add.json');
    const { fields } = calls[0].body;
    assert.equal(fields.NAME, 'Айгерим');
    assert.deepEqual(fields.PHONE, [{ VALUE: '+77475696969', VALUE_TYPE: 'WORK' }]);
    assert.equal(fields.TITLE, 'Заявка с сайта: Рустам Курманбаев');
    assert.equal(fields.SOURCE_DESCRIPTION, 'https://rr.test/kurmanbayev-rustam/');
    assert.match(fields.COMMENTS, /Врач: Рустам Курманбаев\nСтраница: https:\/\/rr\.test\/kurmanbayev-rustam\//);
    assert.equal(fields.UTM_SOURCE, 'instagram');
    assert.equal(fields.UTM_CAMPAIGN, 'breast');
    assert.ok(!('UTM_MEDIUM' in fields), 'an oversized UTM tag is dropped, not the lead');
  });
  for (const respond of [
    () => Response.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 }),
    () => Response.json({ error: 'QUERY_LIMIT_EXCEEDED' }),
    () => new Response('<html>down</html>', { status: 500 }),
    () => { throw new Error('offline'); },
  ]) {
    await withBitrix(respond, async () => assert.equal((await submit(lead)).status, 502));
  }
});

test('a lead fails without a configured webhook, and bad input never reaches it', async () => {
  assert.equal((await submit(lead)).status, 503);
  await withBitrix(created, async (calls) => {
    for (const body of ['not json', { ...lead, name: '  ' }, { ...lead, phone: '+7747' }, { ...lead, phone: '87475696969' }, { ...lead, page: 'https://evil.test' }, 'x'.repeat(3000)]) {
      assert.equal((await submit(body)).status, 400);
    }
    assert.equal(calls.length, 0);
  });
});
