#!/usr/bin/env node
// Validates src/data/hero.json. Usage: node scripts/validate-data.mjs
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const raw = readFileSync(join(root, 'src/data/hero.json'), 'utf8');
const data = JSON.parse(raw);
const errors = [];

// 1. no figma.com URLs anywhere (raw text, excluding _meta provenance)
const { _meta, ...content } = data;
if (/figma\.com/i.test(JSON.stringify(content))) errors.push('figma.com URL found in content');
if (/figma\.com/i.test(JSON.stringify(_meta))) errors.push('figma.com URL found in _meta');

// 2. every image src exists under public/
let images = 0;
(function walk(node, path) {
  if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`));
  if (node && typeof node === 'object') {
    if (typeof node.src === 'string' && 'width' in node) {
      images++;
      if (!existsSync(join(root, 'public', node.src))) errors.push(`missing file: public/${node.src} (${path})`);
    }
    if (typeof node.video === 'string' && !existsSync(join(root, 'public', node.video)))
      errors.push(`missing video: public/${node.video} (${path})`);
    for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
  }
})(content, '$');

// 3. unique ids
const dupes = (label, ids) => {
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) errors.push(`duplicate ${label} id: ${id}`);
    seen.add(id);
  }
  return seen;
};
const doctorIds = dupes('doctor', data.doctors.map((d) => d.id));
dupes('case', data.cases.map((c) => c.id));
dupes('nav', data.nav.map((n) => n.id));
dupes('cta', data.hero.ctas.map((c) => c.id));

// 4. case.doctorId references
for (const c of data.cases) if (!doctorIds.has(c.doctorId)) errors.push(`case ${c.id}: unknown doctorId "${c.doctorId}"`);

if (errors.length) {
  console.error(`FAIL (${errors.length})\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log(`OK: ${images} images, ${data.doctors.length} doctors, ${data.cases.length} cases`);
