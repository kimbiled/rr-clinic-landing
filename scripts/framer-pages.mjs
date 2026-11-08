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
//   2. Entrance animations. Appear-animated elements start at opacity 0 and Framer keeps them there until they are well
//      inside the viewport, so blocks looked broken while scrolling. The ones already in the viewport are shown straight
//      away, the rest fade in with a short CSS transition as they arrive; Framer's own trigger no longer decides.
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
//      wheel or scroll. The page is already complete without it; it brings the menu, sliders and animations.
//   8. First screen first: the fonts every page paints with are preloaded and the CDNs preconnected, so the fonts arrive
//      together, before the page shows. Fonts swapping one by one rewrapped long phone headlines (hero 26 px taller for
//      a second, CLS 0.68). The largest images of each breakpoint's hero get high priority and a preload.
//   9. SEO: a visually hidden <h1> outside Framer's React root (changing Framer's tags would break hydration) and a
//      <title> that names the operation on /<surgeon>/<procedure>.
//  10. The phone number calls instead of opening WhatsApp.
//  12. Browsers start lazy images up to 2500 px from the viewport, so ~10 before/after photos shared the connection with
//      the hero. Images below the hero load from the BODY script: 800 px from the viewport, or 2 s after the load event.
//  13. Until the fonts arrive, the phone hero text keeps its height: with some fonts in and others not, a long headline
//      wraps to one more line for a moment and pushes the whole page down.
//  11. Behaviour Framer lacks: «О докторе» on phones (#start exists only in the desktop tree), names for links without
//      text, keyboard access to its clickable divs, Esc for the interview video.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROCEDURES, SURGEONS, SURGEON_ROUTES, consultationLink, escapeAttribute, isConsultationLink } from './surgeon-pages.mjs';

const ORIGIN = 'https://rr-clinic.kz';
const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const SLUGS = [...SURGEON_ROUTES, 'privacy-policy'];
const PHONE_NUMBER = '+7 (747) 569-69-69';
const PHONE_HREF = 'tel:+77475696969';
// Patch 8: what the first screen paints with on every page (Manrope and Futura PT, Cyrillic).
const FONTS = [
  'https://fonts.gstatic.com/s/manrope/v23/xn7gYHE41ni1AdIRggexSg.woff2',
  'https://framerusercontent.com/assets/7RAvnlUKPTJmdlE33ZboEDjYu6c.woff2',
  'https://framerusercontent.com/assets/4PvvwwL8flzRaCaIJaSFgzlVLxQ.woff2',
  'https://framerusercontent.com/assets/Ky6hmPGFlmXHEfxTQjMhPoYQrw.woff2',
  'https://framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2',
];
const PHONE_SRCSET_CAP = 1024; // a 410 px hero slot at 2x; 2048 px copies cost 200 KB on phones
const HERO_PRELOADS = { phone: 3, desktop: 2 };

const HEAD = `
<!-- RR landing: show the page before Framer's JS runs (scripts/framer-pages.mjs) -->
<style>
  html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
  html.rr-wait #main { visibility: hidden; }
  #main > div:first-of-type { opacity: 1 !important; zoom: var(--rr-zoom, 1) !important; min-height: calc(100vh / var(--rr-zoom, 1)) !important; }
  [data-rr-shown] { opacity: 1 !important; transform: var(--rr-end, none) !important; }
  [data-rr-shown="fade"] { transition: opacity 450ms cubic-bezier(0.22, 1, 0.36, 1), transform 450ms cubic-bezier(0.22, 1, 0.36, 1); }
  [data-framer-name="Before/After"] > [data-framer-name="Текст кнопки"] { opacity: 1 !important; transform: none !important; }
  [data-framer-name$="[Vectorized]"] { cursor: pointer; }
  .rr-h1 { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
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
  /* RR landing: entrance-animated elements no longer wait for Framer, which keeps them blank until they are ~40 % up the
     screen (up to 1.7 s of empty blocks while scrolling). The ones on screen are shown at once, the rest fade in as they
     arrive, before and after hydration alike. */
  (function () {
    var vh = window.innerHeight;
    var root = document.documentElement;
    var els = document.querySelectorAll('#main [style*="will-change:transform"][style*="opacity:0"]');
    function show(el, value) {
      // The element's resting transform: its inline one without the entrance offset Framer appended.
      var t = /(?:^|;)transform:([^;]*)/.exec(el.getAttribute('style'));
      el.style.setProperty('--rr-end', (t ? t[1].replace(/ ?translateY\\(\\d+px\\)$/, '') : '') || 'none');
      el.setAttribute('data-rr-shown', value);
    }
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      for (var j = 0; j < entries.length; j++) {
        if (!entries[j].isIntersecting) continue;
        show(entries[j].target, 'fade');
        io.unobserve(entries[j].target);
      }
    }, { rootMargin: '0px 0px 100px 0px' }) : null;
    for (var i = 0; i < els.length; i++) {
      if (!/opacity:0(;|$)/.test(els[i].getAttribute('style'))) continue;
      var r = els[i].getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh && r.width > 0) show(els[i], '');
      else if (io) io.observe(els[i]);
      else show(els[i], '');
    }
    /* Patch 12: images below the hero. */
    var held = document.querySelectorAll('img[data-rr-src],img[data-rr-srcset]');
    function release(img) {
      var set = img.getAttribute('data-rr-srcset');
      var src = img.getAttribute('data-rr-src');
      if (set) { img.setAttribute('srcset', set); img.removeAttribute('data-rr-srcset'); }
      if (src) { img.setAttribute('src', src); img.removeAttribute('data-rr-src'); }
    }
    var near = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      for (var j = 0; j < entries.length; j++) {
        if (!entries[j].isIntersecting) continue;
        release(entries[j].target);
        near.unobserve(entries[j].target);
      }
    }, { rootMargin: '0px 0px 800px 0px' }) : null;
    for (var h = 0; h < held.length; h++) {
      if (near) near.observe(held[h]);
      else release(held[h]);
    }
    function releaseAll() {
      for (var q = 0; q < held.length; q++) release(held[q]);
    }

    /* Patch 13: the phone hero text keeps its height until the fonts are in (they delay the load event). */
    var heroText = document.querySelectorAll('[data-framer-name="hero_mobile-01"] > div:has(> [data-framer-name="Stats container"])');
    for (var f = 0; f < heroText.length; f++) {
      var height = heroText[f].getBoundingClientRect().height;
      if (height) heroText[f].style.setProperty('height', height / (parseFloat(getComputedStyle(root).getPropertyValue('--rr-zoom')) || 1) + 'px', 'important');
    }
    function freeHeroText() {
      for (var u = 0; u < heroText.length; u++) heroText[u].style.removeProperty('height');
    }
    function afterLoad() { freeHeroText(); setTimeout(releaseAll, 2000); }
    if (document.readyState === 'complete') afterLoad();
    else window.addEventListener('load', afterLoad);

    root.classList.remove('rr-wait');

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
      /* This listener stops the click before the analytics one: report it first. */
      if (window.__rrTrackClick) window.__rrTrackClick(e);
      e.preventDefault();
      e.stopImmediatePropagation();
      location.href = '/';
    }, true);
    window.addEventListener('pointerover', function (e) {
      var el = logo(e);
      if (el && el.tagName === 'A' && el.getAttribute('href') !== '/') el.setAttribute('href', '/');
    }, true);
  })();
  /* RR landing, patch 9: Framer's JS sets its own <title> after hydration. */
  (function () {
    var title = document.title;
    new MutationObserver(function () {
      if (document.title !== title) document.title = title;
    }).observe(document.head, { childList: true, subtree: true, characterData: true });
  })();
  /* RR landing, patch 11. */
  (function () {
    function shown(el) { return el && el.getClientRects().length > 0; }
    /* «О докторе» on phones: #start is only in the desktop tree. Framer closes its menu first, then we scroll. */
    window.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href$="#start"]');
      if (!a || shown(document.getElementById('start'))) return;
      var blocks = document.querySelectorAll('[data-framer-name="03_About the Doctor"]');
      for (var i = 0; i < blocks.length; i++) {
        if (!shown(blocks[i])) continue;
        var block = blocks[i];
        setTimeout(function () { block.scrollIntoView({ behavior: 'smooth' }); }, 350);
        return;
      }
    }, true);

    /* Names for links without text; role and focus for clickable divs. Runs once hydrated, and at the first Tab. */
    function linkName(href) {
      if (/whatsapp|wa\\.me/.test(href)) return 'Написать в WhatsApp';
      if (/instagram/.test(href)) return 'Instagram RR Clinic';
      if (/2gis/.test(href)) return 'RR Clinic в 2ГИС';
      if (/#start$|^\\/$/.test(href)) return 'RR Clinic — на главную';
      return 'Подробнее';
    }
    function describe() {
      var links = document.querySelectorAll('#main a[href]');
      for (var i = 0; i < links.length; i++) {
        var a = links[i];
        if (a.hasAttribute('aria-label') || a.textContent.trim() || a.querySelector('img[alt]:not([alt=""])')) continue;
        a.setAttribute('aria-label', linkName(a.getAttribute('href')));
      }
      var all = document.querySelectorAll('#main div');
      for (var j = 0; j < all.length; j++) {
        var el = all[j];
        if (el.hasAttribute('data-rr-key') || !shown(el) || getComputedStyle(el).cursor !== 'pointer') continue;
        if (el.closest('a,button,[role="button"]') || getComputedStyle(el.parentElement).cursor === 'pointer') continue;
        el.setAttribute('data-rr-key', '');
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
      }
    }
    window.addEventListener('load', function () { setTimeout(describe, 3000); });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') return describe();
      if (e.key === 'Escape') {
        /* The interview video: Framer's own close button sits next to it in a fixed box. */
        var video = document.querySelector('video[controls]');
        var box = video && video.closest('body > div');
        var close = box && getComputedStyle(box).position === 'fixed' && box.querySelector('button');
        if (close) close.click();
        return;
      }
      if ((e.key === 'Enter' || e.key === ' ') && e.target.hasAttribute && e.target.hasAttribute('data-rr-key')) {
        e.preventDefault();
        e.target.click();
      }
    });
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

/** Patch 12: the image waits for the BODY script (data-rr-*), so nothing below the hero competes with the first screen. */
function holdImage(tag) {
  return tag.replace(/\s(srcset|src)="/g, ' data-rr-$1="');
}

/** Patch 8: drops the srcset candidates wider than `cap`, keeping at least the narrowest one. */
function capSrcset(srcset, cap) {
  const list = srcset.split(/,\s*(?=https?:)/).map((entry) => ({ entry, w: Number(/\s(\d+)w$/.exec(entry)?.[1] ?? 0) }));
  const kept = list.filter((c) => c.w && c.w <= cap);
  return kept.length ? kept.map((c) => c.entry).join(', ') : srcset;
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
  const desktop = [...media].find(([, query]) => query.startsWith('(min-width') && !query.includes('max-width'));
  const hero = { phone: [], desktop: [] }; // hero images each breakpoint shows, with their rendered area
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
        tag = holdImage(tag);
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
        if (heroSection && phone && !hidden.has(phone[0]) && slot > 1) hero.phone.push({ area, edit: edits.length, alone: hidden.has(desktop?.[0]) });
        const wide = Math.max(0, ...[...(splitTopLevel(/\ssizes="([^"]*)"/.exec(tag)?.[1] ?? '').at(-1) ?? '').matchAll(/([\d.]+)px/g)].map((x) => +x[1]));
        if (heroSection && desktop && !hidden.has(desktop[0]) && wide > 1) hero.desktop.push({ area: w ? wide * wide * (h / w) : 0, edit: edits.length });
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
  // The phone hero sits near the end of the HTML, so its photos are found late: preload the largest ones of each
  // breakpoint at high priority, for that breakpoint only.
  let preload = '';
  const prioritise = (list, count, query, cap) => {
    for (const item of list.sort((a, b) => b.area - a.area).slice(0, count)) {
      const edit = edits[item.edit];
      if (cap && item.alone) edit[2] = edit[2].replace(/\ssrcset="([^"]*)"/, (_, s) => ` srcset="${capSrcset(s, cap)}"`);
      if (!edit[2].includes('fetchpriority=')) edit[2] = edit[2].replace('<img', '<img fetchpriority="high"').replace(' loading="lazy"', '');
      const srcset = /\ssrcset="([^"]*)"/.exec(edit[2])?.[1];
      const src = /\ssrc="([^"]*)"/.exec(edit[2])?.[1];
      const sizes = /\ssizes="([^"]*)"/.exec(edit[2])?.[1];
      preload +=
        `<link rel="preload" as="image" fetchpriority="high" media="${query}" ` +
        (srcset ? `imagesrcset="${srcset}"${sizes ? ` imagesizes="${sizes}"` : ''}>` : `href="${src}">`);
    }
  };
  if (phone) prioritise(hero.phone, HERO_PRELOADS.phone, phone[1], PHONE_SRCSET_CAP);
  if (desktop) prioritise(hero.desktop, HERO_PRELOADS.desktop, desktop[1]);
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

/** Patch 8: preconnects and the font preloads. */
function firstScreenLinks(html) {
  const fonts = FONTS.filter((url) => html.includes(url));
  return (
    '<link rel="preconnect" href="https://framerusercontent.com">' +
    '<link rel="preconnect" href="https://framerusercontent.com" crossorigin>' +
    fonts.map((url) => `<link rel="preload" as="font" type="font/woff2" href="${url}" crossorigin>`).join('')
  );
}

/** Patch 9: the page name for <title>, its social copies and the hidden <h1>. */
function pageHeading(html, slug) {
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1];
  if (!title) throw new Error(`${slug}: no <title>`);
  const [surgeon, procedure] = slug.split('/');
  if (!SURGEONS[surgeon]) return { title, h1: title };
  const name = PROCEDURES[procedure];
  if (procedure && !name) throw new Error(`${slug}: no operation name in PROCEDURES`);
  const h1 = `${SURGEONS[surgeon].name}, пластический хирург в Астане`;
  return procedure ? { title: `${name} — ${title}`, h1: `${name}: ${h1}`, old: title } : { title, h1 };
}

/** Patch 10: links whose text is the phone number. */
function callPhoneLinks(html) {
  return html.replace(/<a\b([^>]*)\bhref="[^"]*"([^>]*)>((?:(?!<\/a>)[\s\S])*?)<\/a>/g, (link, before, after, inner) =>
    inner.replace(/<[^>]*>/g, '').includes(PHONE_NUMBER) ? `<a${before}href="${PHONE_HREF}"${after}>${inner}</a>` : link,
  );
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
  const heading = pageHeading(html, slug);
  const titled = heading.old ? linked.replaceAll(`content="${heading.old}"`, `content="${heading.title}"`).replace(`<title>${heading.old}</title>`, `<title>${heading.title}</title>`) : linked;
  return callPhoneLinks(deferPixel(titled))
    .replace(/(<a\b[^>]*\bhref=")https:\/\/rr-clinic\.kz\/?/g, '$1/')
    .replace(/<html\b([^>]*)>/, (tag, attrs) => /\blang=/.test(attrs) ? tag : `<html lang="ru"${attrs}>`)
    .replace(/<head\b[^>]*>/, (head) => `${head}${firstScreenLinks(html)}${images.preload}`)
    .replace(/<body\b[^>]*>/, (body) => `${body}<h1 class="rr-h1">${heading.h1}</h1>`)
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
