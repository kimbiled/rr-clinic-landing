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
//      The phone hero photo (the phone LCP) is preloaded at high priority, phones only.
//   3b. Full-size CDN images without srcset (before/after sliders: up to 4400 px, ~1 MB each) get the CDN's
//      scale-down-to copy: in the HTML here, and for the ones Framer's JS creates via a small src/setAttribute hook.
//   4. Meta Pixel loads after the page has loaded instead of competing with the first screen (PageView still fires).
//   5. The header logo leads to our home page (Framer links it to the top of the same page).
//   6. In-site <a href="https://rr-clinic.kz/..."> become relative, so they stay on this host.
//   7. Framer's JS (~340 KB: main bundle + modulepreloads) starts after the load event, or at the first touch, key,
//      wheel or scroll. The page is already complete without it; it brings the menu, sliders and animations. Until
//      then, entrance-animated blocks are shown as they scroll into view, so nothing stays blank.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SURGEONS, SURGEON_ROUTES, consultationLink, escapeAttribute, isConsultationLink } from './surgeon-pages.mjs';

const ORIGIN = 'https://rr-clinic.kz';
const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const SLUGS = [...SURGEON_ROUTES, 'privacy-policy'];

const HEAD = `
<!-- RR landing: show the page before Framer's JS runs (scripts/framer-pages.mjs) -->
<style>
  html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
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
      // Match Framer's phone media query, including phone landscape and small tablets.
      document.documentElement.style.setProperty('--rr-zoom', String(w / (w < 810 ? 393 : 1440)));
    }
    zoom();
    window.addEventListener('resize', zoom);
  })();
  (function () {
    /* Images created by Framer's JS (only those: the parser does not go through these setters) (patch 3b):
       - code components (before/after sliders) set full-size CDN images (up to 4400 px, ~1 MB) with no srcset:
         ask the CDN for a scaled-down copy instead;
       - after hydration the case carousels re-create ~20 images at once: unless the component chose a loading mode,
         they load lazily, so the ones off screen wait for the visitor instead of competing with the first screen. */
    var cap = window.innerWidth < 810 ? 1536 : 2048;
    function shrink(v) { return ${shrinkUrl.toString().replace(/\s+/g, ' ')}(v, cap); }
    var setAttr = Element.prototype.setAttribute;
    function lazy(img) { if (!img.hasAttribute('loading')) setAttr.call(img, 'loading', 'lazy'); }
    Element.prototype.setAttribute = function (name, value) {
      if (this.tagName === 'IMG' && name === 'src' && typeof value === 'string') {
        lazy(this);
        value = shrink(value);
      }
      return setAttr.call(this, name, value);
    };
    var desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      configurable: true,
      enumerable: desc.enumerable,
      get: desc.get,
      set: function (value) {
        lazy(this);
        desc.set.call(this, typeof value === 'string' ? shrink(value) : value);
      },
    });
  })();
</script>
`;

const BODY = `
<script>
  /* RR landing: entrance-animated elements already on screen are shown at once instead of after hydration; the ones
     scrolled into view before Framer's JS has started are shown as they appear (patch 7), later ones animate as usual. */
  (function () {
    var vh = window.innerHeight;
    var els = document.querySelectorAll('#main [style*="will-change:transform"][style*="opacity:0"]');
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      for (var j = 0; j < entries.length; j++) {
        if (!entries[j].isIntersecting) continue;
        entries[j].target.setAttribute('data-rr-shown', '');
        io.unobserve(entries[j].target);
      }
    }) : null;
    for (var i = 0; i < els.length; i++) {
      if (!/opacity:0(;|$)/.test(els[i].getAttribute('style'))) continue;
      var r = els[i].getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh && r.width > 0) els[i].setAttribute('data-rr-shown', '');
      else if (io) io.observe(els[i]);
    }
    document.documentElement.classList.remove('rr-wait');

    /* Patch 7: Framer's JS (hydration) starts after the load event, or at the first touch, key, wheel or scroll. */
    var bundle = __RR_BUNDLE__;
    if (!bundle) return;
    var started = false;
    function start() {
      if (started) return;
      started = true;
      for (var k = 0; k < bundle.preload.length; k++) {
        var link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = bundle.preload[k];
        document.head.appendChild(link);
      }
      var s = document.createElement('script');
      for (var name in bundle.attrs) s.setAttribute(name, bundle.attrs[name]);
      s.onload = s.onerror = function () { if (io) io.disconnect(); };
      document.body.appendChild(s);
    }
    var triggers = ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'];
    for (var t = 0; t < triggers.length; t++) window.addEventListener(triggers[t], start, { once: true, passive: true });
    if (document.readyState === 'complete') setTimeout(start, 0);
    else window.addEventListener('load', function () { setTimeout(start, 0); });
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

/**
 * A full-size Framer CDN image (no scale-down-to) whose longer side exceeds `cap` → the CDN's scaled-down copy.
 * Also inlined into the page (HEAD), so it is written in plain ES5 without comments.
 */
function shrinkUrl(url, cap) {
  var m = /^(https:\/\/framerusercontent\.com\/images\/[^?]+)\?(.*)$/.exec(url);
  if (!m || /(^|&)scale-down-to=/.test(m[2])) return url;
  var w = /(?:^|&)width=(\d+)/.exec(m[2]);
  var h = /(?:^|&)height=(\d+)/.exec(m[2]);
  if (!w || Math.max(+w[1], h ? +h[1] : 0) <= cap) return url;
  return m[1] + '?scale-down-to=' + cap + '&' + m[2];
}

/** Breakpoint hash → media query, from the hydration data on #main. */
function breakpoints(html) {
  const m = /breakpoints&quot;:(\[.*?\])/.exec(html);
  if (!m) return new Map();
  return new Map(JSON.parse(m[1].replaceAll('&quot;', '"')).map((b) => [b.hash, b.mediaQuery]));
}

/** Splits "a, max(b, c), d" at the commas outside parentheses. */
function splitTopLevel(list) {
  const parts = [];
  let depth = 0;
  let from = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i] === '(') depth++;
    else if (list[i] === ')') depth--;
    else if (list[i] === ',' && depth === 0) {
      parts.push(list.slice(from, i).trim());
      from = i + 1;
    }
  }
  parts.push(list.slice(from).trim());
  return parts;
}

/** "(min-width: 1440px) 1240px, ..." → the clauses for hidden media queries say 1px. */
function shrinkSizes(sizes, hiddenMedia) {
  return splitTopLevel(sizes)
    .map((clause) => {
      for (const query of hiddenMedia) if (clause.startsWith(`${query} `)) return `${query} 1px`;
      return clause;
    })
    .join(', ');
}

/** Patch 3b for images in the HTML: full-size CDN `src` without srcset → scaled-down copy (attribute values use &amp;). */
function shrinkSrc(tag) {
  if (/\ssrcset="/.test(tag)) return tag;
  return tag.replace(/\ssrc="([^"]*)"/, (_, src) => ` src="${shrinkUrl(src.replaceAll('&amp;', '&'), 1536).replaceAll('&', '&amp;')}"`);
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
  const phone = [...media].find(([, query]) => query.startsWith('(max-width'));
  let lcp = null; // phone LCP guess: the largest phone-visible image with a srcset in the first screen
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
      let tag = shrinkSrc(m[0]);
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
        } else if (hiddenMedia.size && !/\ssrcset="/.test(tag) && !/\sloading=/.test(tag)) {
          // No srcset to shrink: lazy, so the breakpoints that hide it never fetch it.
          tag = tag.replace('<img', '<img loading="lazy"');
          counts.lazy++;
        } else counts.eager++;
        // Rendered area on a phone: the phone slot width from `sizes` (largest px value) and the image's aspect ratio.
        const w = Number(/\swidth="(\d+)"/.exec(tag)?.[1] ?? 0);
        const h = Number(/\sheight="(\d+)"/.exec(tag)?.[1] ?? 0);
        const phoneClause = phone && splitTopLevel(/\ssizes="([^"]*)"/.exec(tag)?.[1] ?? '').find((c) => c.startsWith(phone[1]));
        const slot = Math.max(0, ...[...(phoneClause ?? '').slice(phone?.[1].length ?? 0).matchAll(/([\d.]+)px/g)].map((x) => +x[1]));
        const area = w ? slot * slot * (h / w) : 0;
        if (phone && !hidden.has(phone[0]) && /\ssrcset="/.test(tag) && slot > 1 && area > (lcp?.area ?? 0)) {
          lcp = { area, edit: edits.length };
        }
      }
      edits.push([m.index, m.index + m[0].length, tag]);
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
  // The phone hero sits near the end of the HTML, so its photo is found late: preload it (phones only) at high priority.
  let preload = '';
  if (lcp) {
    const edit = edits[lcp.edit];
    edit[2] = edit[2].replace('<img', '<img fetchpriority="high"');
    const srcset = /\ssrcset="([^"]*)"/.exec(edit[2])[1];
    const sizes = /\ssizes="([^"]*)"/.exec(edit[2])?.[1];
    preload =
      `<link rel="preload" as="image" fetchpriority="high" media="${phone[1]}" imagesrcset="${srcset}"` +
      `${sizes ? ` imagesizes="${sizes}"` : ''}>`;
  }
  let out = html;
  for (const [from, to, text] of edits.reverse()) if (html.slice(from, to) !== text) out = out.slice(0, from) + text + out.slice(to);
  return { html: out, preload, ...counts };
}

/** Patch 4: run the inline Meta Pixel snippet after the load event. */
function deferPixel(html) {
  return html.replace(/<script>(\s*!function\(f,b,e,v,n,t,s\)[\s\S]*?)<\/script>/, (_, code) =>
    `<script>/* RR landing: Meta Pixel after load */window.addEventListener('load',function(){setTimeout(function(){${code}},0)});</script>`,
  );
}

/**
 * Patch 7: take Framer's main bundle and its modulepreloads out of the HTML, so ~340 KB of JS no longer competes with
 * the first screen; the BODY script adds them back after the load event (or at the first interaction).
 */
function deferBundle(html, slug) {
  const tag = /<script type="module"([^>]*\bdata-framer-bundle="main"[^>]*)><\/script>/.exec(html);
  if (!tag) {
    console.warn(`  ${slug}: Framer bundle not found, hydration left as it is`);
    return { html, bundle: null };
  }
  const attrs = { type: 'module' };
  for (const [, name, value] of tag[1].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[name] = value ?? '';
  const preload = [...html.matchAll(/<link rel="modulepreload"[^>]*\bhref="([^"]+)"[^>]*>/g)].map((m) => m[1]);
  const out = html.replace(tag[0], '').replace(/<link rel="modulepreload"[^>]*>/g, '');
  return { html: out, bundle: { attrs, preload } };
}

export function patch(html, slug) {
  html = html.replaceAll('\r\n', '\n').replace(/[ \t]+$/gm, '');
  const wrapper = /<div style="width:100%;min-height:100vh;overflow-x:hidden;zoom:1;opacity:0;/;
  if (!wrapper.test(html)) throw new Error(`${slug}: zoom wrapper not found — check patch 1 against the new Framer markup`);
  if (!html.includes('</head>') || !html.includes('</body>')) throw new Error(`${slug}: no </head> or </body>`);
  const images = patchImages(html, slug);
  const deferred = deferBundle(images.html, slug);
  console.log(
    `  images: ${images.eager} first screen, ${images.shrunk} hidden-variant sizes → 1px, ${images.lazy} made lazy` +
      (images.preload ? ', phone hero photo preloaded' : '') +
      (deferred.bundle ? `; bundle + ${deferred.bundle.preload.length} modules after load` : ''),
  );
  const surgeon = SURGEONS[slug.split('/')[0]];
  const href = surgeon ? consultationLink(html, slug) : null;
  // Some cloned Framer blocks still book Rustam. Correct their SSR links as well as hydrated clicks.
  const linked = href ? deferred.html.replace(/(<a\b[^>]*\bhref=")([^"]+)(")/g, (tag, before, link, after) =>
    isConsultationLink(link) ? before + escapeAttribute(href) + after : tag) : deferred.html;
  const assets = surgeon ? `
<!-- RR landing: surgeon consultation offer and mobile safeguards -->
<link rel="stylesheet" href="/assets/surgeon-pages.css">
<script defer src="/assets/surgeon-pages.js" data-rr-surgeon="${slug.split('/')[0]}" data-doctor="${escapeAttribute(surgeon.name)}" data-consultation="${escapeAttribute(href)}"></script>
` : '';
  return deferPixel(linked)
    .replace(/(<a\b[^>]*\bhref=")https:\/\/rr-clinic\.kz\/?/g, '$1/')
    .replace(/<html\b([^>]*)>/, (tag, attrs) => /\blang=/.test(attrs) ? tag : `<html lang="ru"${attrs}>`)
    .replace(/<head\b[^>]*>/, (head) => `${head}${images.preload}`)
    .replace('</head>', `${HEAD}${assets}</head>`)
    .replace('</body>', `${BODY.replace('__RR_BUNDLE__', JSON.stringify(deferred.bundle))}</body>`);
}

async function main() {
  // --source-dir replays previously downloaded, unpatched SSR HTML for offline work.
  const args = process.argv.slice(2);
  const sourceAt = args.indexOf('--source-dir');
  const sourceDir = sourceAt >= 0 ? args.splice(sourceAt, 2)[1] : null;
  if (sourceAt >= 0 && !sourceDir) throw new Error('--source-dir requires a directory');
  const slugs = args.length ? args : SLUGS;
  for (const slug of slugs) {
    if (!SLUGS.includes(slug)) throw new Error(`Unsupported page: ${slug}`);
    let source;
    if (sourceDir) source = await readFile(join(sourceDir, slug.replaceAll('/', '__') + '.html'), 'utf8');
    else {
      // Framer occasionally caches a 200 response containing only an empty #main shell.
      for (const suffix of ['', '?rrsync=1']) {
        const res = await fetch(`${ORIGIN}/${slug}${suffix}`, { headers: { 'user-agent': 'Mozilla/5.0 (RR landing page sync)' } });
        if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
        source = await res.text();
        if (source.includes('data-framer-root')) break;
      }
    }
    const html = patch(source, slug);
    const dir = join(PUBLIC, slug);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), html);
    console.log(`${slug}: ${(html.length / 1024).toFixed(0)} KB`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) await main();
