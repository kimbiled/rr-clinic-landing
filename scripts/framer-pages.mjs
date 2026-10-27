#!/usr/bin/env node
// Doctor pages + privacy policy: fetch the server-rendered HTML from the Framer site (rr-clinic.kz) and write it to
// public/<slug>/index.html with our patches. Safe to re-run whenever the pages change in Framer.
//
//   node scripts/framer-pages.mjs              # all pages
//   node scripts/framer-pages.mjs mussa-baurzhan
//
// Why the server HTML and not a browser "Save as": the server HTML has every breakpoint (desktop, tablet, phone) and
// hydrates in place. A saved page holds only the breakpoint it was saved at, so Framer rebuilt it on load and the
// whole page jumped (mobile CLS ~1.0).
//
// Patches (all marked "RR landing"):
//   1. Zoom wrapper. Framer's custom wrapper scales the page by innerWidth / (innerWidth < 768 ? 393 : 1440) and stays
//      at opacity 0 until its JS runs, so nothing was visible until the main bundle hydrated (LCP 6–10 s). A head
//      script applies the same zoom with CSS before the first paint and keeps it in sync on resize.
//      The page also stays hidden until the parser reaches the end of #main: the phone hero sits near the end of the
//      HTML and is moved to the top with CSS `order`, so painting the document as it streams in showed the sections
//      below first and then pushed them down when the hero arrived (mobile CLS ~1.0 on a real network).
//   2. Entrance animations in the first screen. Appear-animated elements start at opacity 0 until the bundle runs; the
//      ones already in the viewport are shown straight away (their transform still settles when Framer animates).
//      Elements further down keep their scroll animations.
//   3. Images. The HTML holds every breakpoint's variant and only hides the others with display:none, which does not
//      stop their images from downloading (a phone fetched the 3720 px desktop hero). In the first screen (everything up
//      to the end of the hero, plus any section named "...hero", wherever it sits in the HTML) an image's `sizes` is set
//      to 1px for the breakpoints that hide it, so a hidden copy costs the smallest file; everywhere else, images without
//      a loading attribute become lazy, so hidden copies are never fetched and visible ones load as they approach.
//   4. Meta Pixel loads after the page has loaded instead of competing with the first screen (PageView still fires).
//   5. The header logo leads to our home page (Framer links it to the top of the same page).
//   6. In-site <a href="https://rr-clinic.kz/..."> become relative, so they stay on this host.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://rr-clinic.kz';
const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const SLUGS = [
  'chatinyan-garik',
  'kodzoeva-leila',
  'kurmanbayev-rustam',
  'mussa-baurzhan',
  'privacy-policy',
  'romanovskaya-tatyana',
  'savelyev-evgeniy',
  'temirkhan-anar',
  'temirkhanov-amir',
  'tulepbergenova-tomiris',
  'ulagasheva-alina',
];

const HEAD = `
<!-- RR landing: show the page before Framer's JS runs (scripts/framer-pages.mjs) -->
<style>
  html.rr-wait #main { visibility: hidden; }
  #main > div:first-of-type { opacity: 1 !important; zoom: var(--rr-zoom, 1) !important; min-height: calc(100vh / var(--rr-zoom, 1)) !important; }
  [data-rr-shown] { opacity: 1 !important; }
  [data-framer-name$="[Vectorized]"] { cursor: pointer; }
</style>
<script>
  (function () {
    // Hidden until the end of #main is parsed (BODY script); the timeout only guards against that script never running.
    var root = document.documentElement;
    root.classList.add('rr-wait');
    setTimeout(function () { root.classList.remove('rr-wait'); }, 4000);
    function zoom() {
      var w = window.innerWidth;
      document.documentElement.style.setProperty('--rr-zoom', String(w / (w < 768 ? 393 : 1440)));
    }
    zoom();
    window.addEventListener('resize', zoom);
  })();
</script>
`;

const BODY = `
<script>
  /* RR landing: entrance-animated elements already on screen are shown at once instead of after hydration. */
  (function () {
    var vh = window.innerHeight;
    var els = document.querySelectorAll('#main [style*="will-change:transform"][style*="opacity:0"]');
    for (var i = 0; i < els.length; i++) {
      if (!/opacity:0(;|$)/.test(els[i].getAttribute('style'))) continue;
      var r = els[i].getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh && r.width > 0) els[i].setAttribute('data-rr-shown', '');
    }
    document.documentElement.classList.remove('rr-wait');
  })();
  /* RR landing: the header logo leads to our home page (Framer linked it to the top of this page). */
  (function () {
    var LOGO = '[data-framer-name$="[Vectorized]"]';
    function logo(e) { return e.target.closest && e.target.closest(LOGO); }
    window.addEventListener('click', function (e) {
      if (!logo(e) || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      location.href = '/';
    }, true);
    window.addEventListener('pointerover', function (e) {
      var el = logo(e);
      if (el && el.tagName === 'A' && el.getAttribute('href') !== '/') el.setAttribute('href', '/');
    }, true);
  })();
</script>
`;

/** Breakpoint hash → media query, from the hydration data on #main. */
function breakpoints(html) {
  const m = /breakpoints&quot;:(\[.*?\])/.exec(html);
  if (!m) return new Map();
  return new Map(JSON.parse(m[1].replaceAll('&quot;', '"')).map((b) => [b.hash, b.mediaQuery]));
}

/** "(min-width: 1440px) 1240px, ..." → the clauses for hidden media queries say 1px. */
function shrinkSizes(sizes, hiddenMedia) {
  return sizes
    .split(/,\s*/)
    .map((clause) => {
      const at = clause.lastIndexOf(' ');
      return at > 0 && hiddenMedia.has(clause.slice(0, at)) ? `${clause.slice(0, at)} 1px` : clause;
    })
    .join(', ');
}

/** Patch 3: walks the divs under the Framer root, tracking which breakpoints hide each image and whether it is past the hero. */
function patchImages(html, slug) {
  const media = breakpoints(html);
  const rootAt = html.indexOf('data-framer-root');
  if (rootAt < 0 || !media.size) {
    console.warn(`  ${slug}: no Framer root / breakpoints, images left as they are`);
    return { html, eager: 0, shrunk: 0, lazy: 0 };
  }
  const start = html.lastIndexOf('<div', rootAt);
  const stack = []; // per open div: the breakpoint hashes it hides
  let pastHero = false;
  let heroSeen = false;
  let heroSection = false; // the current root child is named "...hero" (the phone hero sits near the end of the HTML)
  let sections = 0;
  const edits = [];
  const counts = { eager: 0, shrunk: 0, lazy: 0 };
  const tags = /<(\/?)div\b([^>]*)>|<img\b[^>]*>/g;
  tags.lastIndex = start;
  for (let m; (m = tags.exec(html)); ) {
    if (m[0].startsWith('<img')) {
      const hidden = new Set(stack.flat());
      let tag = m[0];
      if (pastHero && !heroSection) {
        if (!/\sloading=/.test(tag)) {
          tag = tag.replace('<img', '<img loading="lazy"');
          counts.lazy++;
        }
      } else {
        const hiddenMedia = new Set([...hidden].map((h) => media.get(h)).filter(Boolean));
        if (hiddenMedia.size && /\ssizes="/.test(tag)) {
          tag = tag.replace(/\ssizes="([^"]*)"/, (_, s) => ` sizes="${shrinkSizes(s, hiddenMedia)}"`);
          counts.shrunk++;
        } else counts.eager++;
      }
      if (tag !== m[0]) edits.push([m.index, m.index + m[0].length, tag]);
      continue;
    }
    if (m[1]) {
      stack.pop();
      // A direct child of the root just closed: once the hero is behind us, the rest of the page is below the fold.
      if (stack.length === 1 && heroSeen) pastHero = true;
      if (!stack.length) break;
      continue;
    }
    const cls = /\bclass="([^"]*)"/.exec(m[2])?.[1] ?? '';
    stack.push([...cls.matchAll(/\bhidden-([a-z0-9]+)/g)].map((h) => h[1]));
    if (stack.length === 2) {
      sections++;
      heroSection = /data-framer-name="[^"]*hero/i.test(m[2]);
      if (heroSection) heroSeen = true;
      // Pages without a section named "...Hero": treat the first three root children as the first screen.
      if (!heroSeen && sections > 3) pastHero = true;
    }
  }
  let out = html;
  for (const [from, to, text] of edits.reverse()) out = out.slice(0, from) + text + out.slice(to);
  return { html: out, ...counts };
}

/** Patch 4: run the inline Meta Pixel snippet after the load event. */
function deferPixel(html) {
  return html.replace(/<script>(\s*!function\(f,b,e,v,n,t,s\)[\s\S]*?)<\/script>/, (_, code) =>
    `<script>/* RR landing: Meta Pixel after load */window.addEventListener('load',function(){setTimeout(function(){${code}},0)});</script>`,
  );
}

function patch(html, slug) {
  const wrapper = /<div style="width:100%;min-height:100vh;overflow-x:hidden;zoom:1;opacity:0;/;
  if (!wrapper.test(html)) throw new Error(`${slug}: zoom wrapper not found — check patch 1 against the new Framer markup`);
  if (!html.includes('</head>') || !html.includes('</body>')) throw new Error(`${slug}: no </head> or </body>`);
  const images = patchImages(html, slug);
  console.log(`  images: ${images.eager} first screen, ${images.shrunk} hidden-variant sizes → 1px, ${images.lazy} made lazy`);
  return deferPixel(images.html)
    .replace(/(<a\b[^>]*\bhref=")https:\/\/rr-clinic\.kz\/?/g, '$1/')
    .replace('</head>', `${HEAD}</head>`)
    .replace('</body>', `${BODY}</body>`);
}

const slugs = process.argv.length > 2 ? process.argv.slice(2) : SLUGS;
for (const slug of slugs) {
  const res = await fetch(`${ORIGIN}/${slug}`, { headers: { 'user-agent': 'Mozilla/5.0 (RR landing page sync)' } });
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  const html = patch(await res.text(), slug);
  const dir = join(PUBLIC, slug);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), html);
  // Images, styles and scripts now come from Framer's CDN, as on the live site; the saved copies are unused.
  await rm(join(dir, 'files'), { recursive: true, force: true });
  console.log(`${slug}: ${(html.length / 1024).toFixed(0)} KB`);
}
