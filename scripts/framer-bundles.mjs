// Content fixes for the saved Framer pages. Framer renders every page from its CDN bundles, so a fix in
// public/<route>/index.html alone is undone by hydration. This script downloads the original bundles, applies
// the fixes below, writes the copies to public/assets/framer/ and adds an import map to each page, which
// sends the browser to our copy. The same fixes go into the saved HTML, so the page matches before hydration.
// Run it after scripts/framer-pages.mjs: `npm run sync:framer-bundles`. It always starts from Framer's originals.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { SURGEON_ROUTES } from './surgeon-pages.mjs';

const SITE = 'https://framerusercontent.com/sites/17VXhmfdt2lH6iX7r8acSp/';
const LOCAL = '/assets/framer/';
const PUBLIC = new URL('../public/', import.meta.url);
const OUT = new URL('assets/framer/', PUBLIC);
const CORE = /^(rolldown-runtime|react|motion|framer|Video|shared-lib)\./;

const CONSENT_LABEL = 'jGGq9_U4k:`Согласие на обработку данных`';
const CONSENT_HREF = '/privacy-policy/';
const NEW_PHOTO = '/assets/img/web/rustam-consultation.webp';
const OLD_PHOTO = /https:\/\/framerusercontent\.com\/images\/(?:EZ8nQCefTwlnonYzZWp8lEl7eM|Zp8naUxdXneV8OgCywoaV1IpffI)\.png[^\s"'`,)]*/g;
// The case galleries start their 8 s timers on mount. surgeon-pages.js resolves this promise when the block is on screen.
const GALLERY_TIMER = /await ([\w$]+\(\(\)=>[\w$]+\(`[\w-]{9}`,!0\),8e3\))/g;
const WAIT_FOR_GALLERY = 'await window.rrCasesVisible;await $1';
const TEXT_FIXES = {
  'chatinyan-garik/facelift': [['Гармоничная форма носа', 'Свежий, естественный вид']],
};

// Rustam's phone tabs all show the abdomen heading. The bundle has one heading per tab on desktop only, so
// choose it by the active variant. Variant 6 is the abdomen tab on /mammoplasty, where the tabs come in another order.
const RUSTAM_BUNDLE = /^rT5OpQw55\./;
const RUSTAM_LIFT = "(m===`LtI7EGSDO`||m===`jq6DDlsVi`&&!location.pathname.includes(`mammoplasty`))";
const RUSTAM_HEADING = [
  ['children:`Коррекция живота и\\xA0контуров тела `', 'children:m===`i87jgDZem`?`Добавление объёма и\\xA0коррекция формы груди `:' + RUSTAM_LIFT + '?`Коррекция изменившейся `:`Коррекция живота и\\xA0контуров тела `'],
  ['children:`после\\xA0родов, снижения веса и\\xA0других изменений фигуры`', 'children:m===`i87jgDZem`?`с\\xA0учётом пропорций тела`:' + RUSTAM_LIFT + '?`формы и\\xA0положения груди`:`после\\xA0родов, снижения веса и\\xA0других изменений фигуры`'],
];
// /mammoplasty starts on the breast lift tab on phones, so its saved heading has to match that before hydration.
const RUSTAM_LIFT_HTML = [
  ['Коррекция живота и&nbsp;контуров тела ', 'Коррекция изменившейся '],
  ['после&nbsp;родов, снижения веса и&nbsp;других изменений фигуры', 'формы и&nbsp;положения груди'],
];

const faq = JSON.parse(await readFile(new URL('surgeon-faq.json', import.meta.url), 'utf8'));

async function bundle(name) {
  const response = await fetch(SITE + name);
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  return response.text();
}

function imports(code) {
  return [...code.matchAll(/from"\.\/([^"]+\.mjs)"/g)].map((match) => match[1]);
}

// Our copy lives on another origin, so its relative imports have to point back at Framer.
function absoluteImports(code) {
  return code
    .replace(/(from\s*"|import\s*\(\s*[`"]|import\s*")\.\//g, `$1${SITE}`)
    .replace(/\n\/\/# sourceMappingURL=.*$/, '\n');
}

function sourceString(literal) {
  return literal.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))).replace(/\\n/g, '\n');
}

function templateLiteral(text) {
  return '`' + text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
}

// Saved HTML escapes these characters and may use either kind of space.
function htmlPattern(text) {
  const parts = [...text.trim()].map((char) => {
    if (char === ' ' || char === '\u00a0') return '(?: |\\u00a0|&nbsp;|&#160;)';
    if (char === '&') return '&amp;';
    if (char === "'") return "(?:'|&#x27;|&#39;)";
    if (char === '"') return '(?:"|&quot;)';
    if (char === '<') return '&lt;';
    if (char === '>') return '&gt;';
    return char.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  });
  return new RegExp(parts.join(''), 'g');
}

function htmlText(text) {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function replaceFaq(code, route) {
  const approved = faq[route];
  if (!approved) throw new Error(`${route}: no approved FAQ`);
  const pairs = [];
  const patched = code.replace(/faqItems:\[(\{answer:`(?:[^`\\]|\\.)*`,id:`[^`]*`,question:`(?:[^`\\]|\\.)*`\},?)+\]/g, (block) => {
    const items = [...block.matchAll(/\{answer:`((?:[^`\\]|\\.)*)`,id:`([^`]*)`,question:`((?:[^`\\]|\\.)*)`\}/g)];
    if (items.length !== approved.length) throw new Error(`${route}: ${items.length} FAQ items, ${approved.length} approved`);
    const next = items.map(([, answer, id, question], index) => {
      pairs.push([sourceString(question), approved[index].question], [sourceString(answer), approved[index].answer]);
      return `{answer:${templateLiteral(approved[index].answer)},id:\`${id}\`,question:${templateLiteral(approved[index].question)}}`;
    });
    return `faqItems:[${next.join(',')}]`;
  });
  if (!pairs.length) throw new Error(`${route}: FAQ not found in the bundle`);
  return { code: patched, pairs };
}

function patchShared(name, code) {
  if (!RUSTAM_BUNDLE.test(name)) return code;
  return RUSTAM_HEADING.reduce((patched, [before, after]) => {
    if (patched.split(before).length !== 2) throw new Error(`${name}: expected one ${before}`);
    return patched.replace(before, () => after);
  }, code);
}

function patchHtml(html, route, pairs, chunks) {
  let out = html;
  // Longest first, so a short old answer cannot match inside a longer one.
  for (const [before, after] of [...pairs].sort((a, b) => b[0].length - a[0].length)) {
    out = out.replace(htmlPattern(before), () => htmlText(after));
  }
  for (const item of faq[route]) {
    if (!out.includes(htmlText(item.answer))) throw new Error(`${route}: approved answer missing from HTML: ${item.question}`);
  }
  for (const [before, after] of TEXT_FIXES[route] || []) out = out.replace(htmlPattern(before), htmlText(after));
  out = out.replace(OLD_PHOTO, NEW_PHOTO);
  if (route === 'kurmanbayev-rustam/mammoplasty') {
    for (const [before, after] of RUSTAM_LIFT_HTML) out = out.replaceAll(before, after);
  }
  // The consent item is an <a> without href, next to the policy link built by the same component.
  out = out.replace(/<a\b(?![^>]*\bhref=)([^>]*>(?:(?!<\/a>)[\s\S])*?Согласие на обработку данных)/g, `<a href="${CONSENT_HREF}"$1`);
  const map = Object.fromEntries(chunks.map((name) => [SITE + name, LOCAL + name]));
  for (const [from, to] of Object.entries(map)) out = out.replaceAll(`"${from}"`, `"${to}"`);
  const tag = `<script type="importmap" data-rr-bundles>${JSON.stringify({ imports: map })}</script>`;
  out = out.replace(/<script type="importmap" data-rr-bundles>.*?<\/script>/s, '');
  return out.replace(/<head\b[^>]*>/, (head) => head + tag);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
const firstHtml = await readFile(new URL(`${SURGEON_ROUTES[0]}/index.html`, PUBLIC), 'utf8');
const entry = /script_main\.[\w-]+\.mjs/.exec(firstHtml)?.[0];
if (!entry) throw new Error('Framer entry bundle not found');
const main = await bundle(entry);
const routes = new Map([...main.matchAll(/page:[\w$]+\(\(\)=>import\(`\.\/([^`]+)`\)\),path:`([^`]+)`/g)].map(([, name, path]) => [path, name]));
const originals = new Map();
async function original(name) {
  if (!originals.has(name)) originals.set(name, bundle(name));
  return originals.get(name);
}

const shared = new Set();
for (const route of SURGEON_ROUTES) {
  const name = routes.get(`/${route}`);
  if (!name) throw new Error(`${route}: not in Framer's route map`);
  const source = await original(name);
  const { code: withFaq, pairs } = replaceFaq(source, route);
  let code = withFaq.replace(OLD_PHOTO, NEW_PHOTO).replace(GALLERY_TIMER, WAIT_FOR_GALLERY);
  for (const [before, after] of TEXT_FIXES[route] || []) {
    if (!code.includes(before)) throw new Error(`${route}: text not in the bundle: ${before}`);
    code = code.replaceAll(before, after);
  }
  if (!code.includes(CONSENT_LABEL)) throw new Error(`${route}: consent item not found`);
  code = code.replaceAll(CONSENT_LABEL, `${CONSENT_LABEL},tnmgeyy1t:\`${CONSENT_HREF}\``);
  const chunks = [name];
  await writeFile(new URL(name, OUT), absoluteImports(code));
  for (const dependency of imports(source).filter((file) => !CORE.test(file))) {
    const text = await original(dependency);
    const gated = text.replace(GALLERY_TIMER, WAIT_FOR_GALLERY);
    if (gated === text) continue;
    if (!shared.has(dependency)) {
      shared.add(dependency);
      await writeFile(new URL(dependency, OUT), absoluteImports(patchShared(dependency, gated)));
    }
    chunks.push(dependency);
  }
  const url = new URL(`${route}/index.html`, PUBLIC);
  await writeFile(url, patchHtml(await readFile(url, 'utf8'), route, pairs, chunks));
  console.log(`${route}: ${chunks.length} bundles`);
}
