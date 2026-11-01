import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('../src/lib/analytics.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup() {
  const scripts = [];
  const listeners = [];
  class Element {
    constructor(anchor) { this.anchor = anchor; }
    closest() { return this.anchor; }
  }
  class Anchor extends Element {
    constructor(href, dataset = {}, section = { id: 'doctors', tagName: 'SECTION' }) {
      super();
      Object.assign(this, { href, dataset, section });
    }
    closest() { return this.section; }
  }
  const context = {
    exports: {}, URL, Date, Element, HTMLAnchorElement: Anchor,
    location: { origin: 'https://rr-clinic.kz' }, window: {},
    document: {
      createElement: () => ({}),
      head: { appendChild: script => scripts.push(script) },
      addEventListener: (type, handler) => listeners.push({ type, handler }),
    },
  };
  vm.runInNewContext(source, context);
  const click = (anchor, overrides = {}) => listeners.forEach(({ handler }) => handler({
    target: new Element(anchor), button: 0, defaultPrevented: false, ...overrides,
  }));
  const commands = () => (context.window.dataLayer ?? []).map(args => Array.from(args));
  return { ...context.exports, scripts, listeners, Anchor, click, commands };
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

test('initialization queues config and loads one tag and one listener', () => {
  const app = setup();
  app.initializeAnalytics({ measurementId: ' G-TEST123 ' });
  app.initializeAnalytics({ measurementId: 'G-TEST123' });
  assert.equal(app.scripts.length, 1);
  assert.equal(app.listeners.length, 1);
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

test('nested icon clicks on late-mounted links emit exactly one event without destination data', () => {
  const app = setup();
  app.initializeAnalytics({ measurementId: 'G-TEST123' });
  const link = new app.Anchor('https://wa.me/123?text=private-message', { analyticsId: 'doctor_booking_test' });
  app.click(link);
  const events = app.commands().filter(([command]) => command === 'event');
  assert.equal(events.length, 1);
  assert.equal(events[0][1], 'contact_click');
  assert.deepEqual(JSON.parse(JSON.stringify(events[0][2])), {
    contact_method: 'whatsapp', placement: 'doctors', button_id: 'doctor_booking_test',
  });
  assert.equal(JSON.stringify(events).includes('private-message'), false);
  assert.equal(JSON.stringify(events).includes('wa.me'), false);
});

test('portal placement overrides and phone links work; cancelled and ordinary clicks are ignored', () => {
  const app = setup();
  app.initializeAnalytics({ measurementId: 'G-TEST123' });
  const link = new app.Anchor('tel:+123', { analyticsPlacement: 'surgeon_menu', analyticsId: 'menu_phone' }, null);
  app.click(link, { defaultPrevented: true });
  app.click(link, { button: 2 });
  app.click(new app.Anchor('https://example.com/'));
  assert.equal(app.commands().filter(([command]) => command === 'event').length, 0);
  app.click(link);
  assert.equal(app.commands().at(-1)[2].placement, 'surgeon_menu');
  assert.equal(app.commands().at(-1)[2].contact_method, 'phone');
});
