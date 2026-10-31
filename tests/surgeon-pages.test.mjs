import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { test } from 'node:test';
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
