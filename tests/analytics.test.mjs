import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { OUTPUT, bundle } from '../scripts/analytics-bundle.mjs';

const source = ts.transpileModule(readFileSync(new URL('../src/lib/analytics.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

// A small fake DOM: enough of closest()/getAttribute()/textContent for the selectors analytics.ts uses.
function matchesOne(el, selector) {
  const m = /^([a-z]*)((?:\[[^\]]+\])*)$/i.exec(selector.trim());
  if (!m) return false;
  if (m[1] && el.tagName !== m[1].toUpperCase()) return false;
  for (const [, name, value] of m[2].matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)) {
    const actual = el.getAttribute(name);
    if (actual === null || (value !== undefined && actual !== value)) return false;
  }
  return true;
}

class Element {
  constructor(tag, attrs = {}, children = [], text = '') {
    this.tagName = tag.toUpperCase();
    this.attrs = attrs;
    this.parentElement = null;
    this.children = children;
    this.ownText = text;
    for (const child of children) child.parentElement = this;
    this.dataset = Object.fromEntries(
      Object.entries(attrs)
        .filter(([k]) => k.startsWith('data-'))
        .map(([k, v]) => [k.slice(5).replace(/-(\w)/g, (_, c) => c.toUpperCase()), v]),
    );
    this.id = attrs.id ?? '';
  }
  getAttribute(name) { return name in this.attrs ? this.attrs[name] : null; }
  get textContent() { return this.ownText + this.children.map((c) => c.textContent).join(' '); }
  matches(selector) { return selector.split(',').some((s) => matchesOne(this, s)); }
  closest(selector) {
    for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node;
    return null;
  }
  querySelector(selector) {
    for (const child of this.children) {
      if (child.matches(selector)) return child;
      const deep = child.querySelector(selector);
      if (deep) return deep;
    }
    return null;
  }
}

class HTMLAnchorElement extends Element {
  get href() { return new URL(this.attrs.href, PAGE).href; }
}

const PAGE = 'https://rr-clinic.kz/doctors/';
const el = (tag, attrs, children, text) => new (tag === 'a' ? HTMLAnchorElement : Element)(tag, attrs, children, text);

function setup(code = source, { hostname = 'rr-clinic.kz', search = '' } = {}) {
  const scripts = [];
  const listeners = [];
  const context = {
    exports: {}, URL, Date, Element, HTMLAnchorElement, Object, Set, WeakSet,
    location: { origin: `https://${hostname}`, href: PAGE.replace('rr-clinic.kz', hostname), hostname, search },
    window: {},
    document: {
      createElement: () => ({}),
      head: { appendChild: (script) => scripts.push(script) },
      addEventListener: (type, handler, capture) => listeners.push({ type, handler, capture }),
    },
  };
  vm.runInNewContext(code, context);
  const click = (target, overrides = {}) => listeners.forEach(({ handler }) => handler({
    target, button: 0, defaultPrevented: false, ...overrides,
  }));
  const commands = () => (context.window.dataLayer ?? []).map((args) => Array.from(args));
  // JSON round trip: objects made inside the vm have another realm's prototypes, which deepStrictEqual rejects.
  const events = (name) => JSON.parse(JSON.stringify(commands().filter(([c, n]) => c === 'event' && (!name || n === name)).map(([, , params]) => params)));
  return { ...context.exports, context, scripts, listeners, click, commands, events };
}

test('missing, invalid or disabled configuration never starts collection', () => {
  for (const options of [{}, { measurementId: 'G-INVALID?x=1' }, { measurementId: 'G-TEST123', enabled: false }]) {
    const app = setup();
    app.initializeAnalytics(options);
    assert.equal(app.scripts.length, 0);
    assert.equal(app.listeners.length, 0);
    assert.equal(app.commands().length, 0);
  }
});

test('initialization queues config and loads one tag and one capture listener', () => {
  const app = setup();
  app.initializeAnalytics({ measurementId: ' G-TEST123 ' });
  app.initializeAnalytics({ measurementId: 'G-TEST123' });
  assert.equal(app.scripts.length, 1);
  assert.equal(app.listeners.length, 1);
  assert.equal(app.listeners[0].capture, true);
  assert.equal(app.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-TEST123');
  assert.equal(app.scripts[0].async, true);
  assert.equal(app.commands()[1][0], 'config');
  assert.equal(app.commands()[1][1], 'G-TEST123');
  assert.equal('debug_mode' in app.commands()[1][2], false);
});

test('DebugView is explicitly enabled', () => {
  const app = setup();
  app.initializeAnalytics({ measurementId: 'G-TEST123', debug: true });
  assert.equal(app.commands()[1][2].debug_mode, true);
});

test('Clarity loads only with a well-formed project id', () => {
  const app = setup();
  app.initializeAnalytics({ measurementId: 'G-TEST123', clarityId: 'abc123xyz9' });
  assert.equal(app.scripts[1].src, 'https://www.clarity.ms/tag/abc123xyz9');
  assert.equal(typeof app.context.window.clarity, 'function');
  const bad = setup();
  bad.initializeAnalytics({ measurementId: 'G-TEST123', clarityId: 'x"/><script>' });
  assert.equal(bad.scripts.length, 1);
});

test('classifies contact methods and rejects unrelated or lookalike destinations', () => {
  const app = setup();
  for (const [href, method] of [
    ['https://wa.me/123?text=private', 'whatsapp'],
    ['https://api.whatsapp.com/send?phone=123', 'whatsapp'],
    ['tel:+123', 'phone'], ['mailto:clinic@example.com', 'email'],
  ]) assert.equal(app.contactClick(href, 'hero', 'book', 'https://rr-clinic.kz').contact_method, method);
  for (const href of ['#contacts', '/doctor', 'https://instagram.com/', 'https://wa.me.example.org/123', 'javascript:alert(1)']) {
    assert.equal(app.contactClick(href, 'hero', 'book', 'https://rr-clinic.kz'), null);
  }
});

test('links are described without queries, foreign paths or contact destinations', () => {
  const app = setup();
  const d = (href) => JSON.parse(JSON.stringify(app.describeLink(href, PAGE)));
  assert.deepEqual(d('/kurmanbayev-rustam/?utm=x#prices'), { link_type: 'internal', link_url: '/kurmanbayev-rustam/#prices' });
  assert.deepEqual(d('#faq'), { link_type: 'anchor', link_url: '#faq' });
  assert.deepEqual(d('https://www.instagram.com/p/secret/'), { link_type: 'external', link_url: 'www.instagram.com' });
  assert.deepEqual(d('https://wa.me/7701?text=Хочу'), { link_type: 'whatsapp' });
  assert.deepEqual(d('javascript:void(0)'), { link_type: 'button' });
});

test("on a doctor's landing every click carries the doctor's name", () => {
  const app = setup();
  app.context.document.documentElement = el('html', { 'data-rr-doctor': 'Лейла Кодзоева' });
  app.initializeAnalytics({ measurementId: 'G-TEST123' });
  const link = el('a', { href: 'https://wa.me/123' }, [], 'Записаться на консультацию');
  el('section', { id: 'hero' }, [link]);
  app.click(link);
  assert.equal(app.events('ui_click')[0].doctor, 'Лейла Кодзоева');
  assert.equal(app.events('contact_click')[0].doctor, 'Лейла Кодзоева');
});

test('a WhatsApp click sends ui_click and contact_click, never the destination or message', () => {
  const app = setup();
  app.initializeAnalytics({ measurementId: 'G-TEST123' });
  const icon = el('svg');
  const link = el('a', { href: 'https://wa.me/123?text=private-message', 'data-analytics-id': 'doctor_booking_test' }, [icon], 'Записаться');
  el('section', { id: 'doctors' }, [link]);
  app.click(icon);
  assert.deepEqual(app.events('ui_click'), [{
    button_id: 'doctor_booking_test', button_text: 'Записаться', placement: 'doctors', link_type: 'whatsapp',
  }]);
  assert.deepEqual(app.events('contact_click'), [{ contact_method: 'whatsapp', placement: 'doctors', button_id: 'doctor_booking_test' }]);
  const sent = JSON.stringify(app.commands());
  assert.equal(sent.includes('private-message'), false);
  assert.equal(sent.includes('wa.me'), false);
});

test('buttons in Framer blocks get the block name and their visible text', () => {
  const app = setup();
  app.initializeAnalytics({ measurementId: 'G-TEST123' });
  const label = el('span', {}, [], '  Сколько   длится восстановление? ');
  const button = el('div', { role: 'button' }, [label]);
  el('div', { 'data-framer-name': '09_FAQ' }, [el('div', { 'data-framer-name': 'Variant 2' }, [button])]);
  app.click(label);
  assert.deepEqual(app.events('ui_click'), [{
    button_id: 'сколько длится восстановление?', button_text: 'Сколько длится восстановление?', placement: 'FAQ', link_type: 'button',
  }]);
  assert.equal(app.events('contact_click').length, 0);
});

test('explicit placement wins; right clicks, cancelled clicks and plain text are ignored', () => {
  const app = setup();
  app.initializeAnalytics({ measurementId: 'G-TEST123' });
  const link = el('a', { href: 'tel:+123', 'data-analytics-placement': 'surgeon_menu', 'data-analytics-id': 'menu_phone' }, [], '+7 747');
  app.click(link, { button: 2 });
  app.click(link, { defaultPrevented: true });
  app.click(el('p', {}, [], 'просто текст'));
  assert.equal(app.events().length, 0);
  app.click(link);
  assert.equal(app.events('ui_click')[0].placement, 'surgeon_menu');
  assert.equal(app.events('contact_click')[0].contact_method, 'phone');
});

test('rr-analytics.js is generated from analytics.ts, stays off on localhost and starts on the site', () => {
  assert.equal(readFileSync(OUTPUT, 'utf8'), bundle(), 'run: node scripts/analytics-bundle.mjs');
  const code = bundle({ ga: 'G-TEST123', clarity: 'abc123xyz9' });
  const local = setup(code, { hostname: 'localhost' });
  assert.equal(local.scripts.length, 0);
  const debug = setup(code, { hostname: 'localhost', search: '?rr_analytics_debug=1' });
  assert.equal(debug.commands()[1][2].debug_mode, true);
  const live = setup(code);
  assert.deepEqual(live.scripts.map((s) => s.src), [
    'https://www.googletagmanager.com/gtag/js?id=G-TEST123',
    'https://www.clarity.ms/tag/abc123xyz9',
  ]);
  assert.equal(live.listeners.length, 1);
});
