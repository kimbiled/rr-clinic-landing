// Hero content — owner FE-3. Load reveal (design-spec §9.5), data sync, "Смотреть работы" scroll.
//
// The text lives in index.html (SEO). This module only:
//  1. syncs it with hero.json when they differ;
//  2. plays the staggered reveal for every [data-reveal] item (navbar + hero) once fonts are ready;
//  3. wires the secondary CTA to smooth-scroll to the cases.
// Reveal contract: the inline script in the NAVBAR region sets html.js-reveal before first paint, CSS hides
// [data-reveal] only under that class (+ prefers-reduced-motion: no-preference) with a 4 s failsafe.
// We start WAAPI animations with fill:'backwards' and drop the class in the same frame → no flash.

const FONT_WAIT_MAX = 1200;

// t (ms) relative to the reveal start, per §9.5
const TIMELINE = {
  nav: { at: 250, step: 60, dur: 600, from: { opacity: 0, transform: 'translateY(-12px)' } },
  chip: { at: 450, step: 80, dur: 600, from: { opacity: 0, transform: 'translateY(12px)' } },
  line: {
    at: 550,
    step: 100,
    dur: 900,
    easing: 'cubic-bezier(0.19, 1, 0.22, 1)',
    from: { opacity: 0, transform: 'translateY(105%)' },
  },
  subtitle: { at: 820, step: 0, dur: 700, from: { opacity: 0, transform: 'translateY(10px)' } },
  cta: { at: 950, step: 80, dur: 600, from: { opacity: 0, transform: 'translateY(14px) scale(0.98)' } },
};
const DEFAULT_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export async function init(ctx) {
  const layer = ctx.root?.querySelector('[data-hero-content]');
  if (!layer) {
    document.documentElement.classList.remove('js-reveal');
    return;
  }

  try {
    syncFromData(layer, ctx.data);
  } catch (error) {
    console.warn('[hero] data sync skipped', error);
  }
  bindSeeWorks(layer, ctx);

  // Not awaited: main.js initialises modules sequentially and must not wait for the font load.
  reveal(ctx).catch((error) => {
    document.documentElement.classList.remove('js-reveal');
    console.warn('[hero] reveal skipped', error);
  });
}

async function reveal(ctx) {
  const html = document.documentElement;
  if (!html.classList.contains('js-reveal')) return;

  if (ctx.reducedMotion || typeof Element.prototype.animate !== 'function') {
    html.classList.remove('js-reveal');
    ctx.emit('hero:revealed', { reduced: true });
    return;
  }

  await waitForFonts(FONT_WAIT_MAX);
  await nextFrame();

  const counters = {};
  const items = [...document.querySelectorAll('[data-reveal]')];
  let end = 0;

  items.forEach((el) => {
    const kind = el.dataset.reveal;
    const t = TIMELINE[kind];
    if (!t) return;
    const index = (counters[kind] = (counters[kind] ?? -1) + 1);
    const delay = t.at + index * t.step;
    end = Math.max(end, delay + t.dur);
    el.animate([t.from, { opacity: 1, transform: 'none' }], {
      delay,
      duration: t.dur,
      easing: t.easing ?? DEFAULT_EASE,
      fill: 'backwards',
    });
  });

  // Same frame as the animations' first tick: the backwards fill now owns the hidden state.
  html.classList.remove('js-reveal');
  ctx.emit('hero:reveal', { startedAt: performance.now(), duration: end });
}

function waitForFonts(maxMs) {
  if (!document.fonts) return Promise.resolve();
  const loads = Promise.all([
    document.fonts.load('400 40px Manrope'),
    document.fonts.load('400 18px Jost'),
    document.fonts.load('500 14px Jost'),
  ]).then(() => document.fonts.ready);
  return Promise.race([loads, new Promise((resolve) => setTimeout(resolve, maxMs))]).catch(() => {});
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

const norm = (s) => (s ?? '').replace(/\s+/g, ' ').trim();

/** Rewrite the static text only when hero.json differs from what is in the HTML. */
function syncFromData(layer, data) {
  if (!data) return;
  const { hero, clinic } = data;

  const title = layer.querySelector('[data-hero-title]');
  if (title && hero?.title && norm(title.textContent) !== norm(hero.title)) {
    // Unknown line breaks → one mask line that may wrap (nowrap off).
    title.style.whiteSpace = 'normal';
    title.replaceChildren(maskLine(hero.title));
  }

  const subtitle = layer.querySelector('[data-hero-subtitle]');
  if (subtitle && hero?.subtitle && norm(subtitle.textContent) !== norm(hero.subtitle)) {
    subtitle.textContent = hero.subtitle;
  }

  if (clinic) {
    const loc = layer.querySelector('[data-hero-location]');
    if (loc && clinic.location && norm(loc.textContent) !== norm(clinic.location)) loc.textContent = clinic.location;

    const r = clinic.rating;
    if (r && typeof r.value === 'number') {
      const value = r.value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      setText(layer.querySelector('[data-hero-rating-value]'), value);
      setText(layer.querySelector('[data-hero-rating-count]'), `(${r.count})`);
      setText(
        layer.querySelector('[data-hero-rating-label]'),
        `Рейтинг в ${r.source === '2GIS' ? '2ГИС' : r.source}: ${value} из ${r.max ?? 5}, ${r.count} ${plural(r.count, 'отзыв', 'отзыва', 'отзывов')}`,
      );
      if (r.url) wrapRatingLink(layer.querySelector('.hero-chip--rating'), r.url);
    }
  }

  (hero?.ctas ?? []).forEach((cta) => {
    const el = layer.querySelector(`[data-cta="${CSS.escape(cta.id)}"]`);
    if (!el) return;
    const label = el.querySelector('.cta__label');
    if (label && cta.label && norm(label.textContent) !== norm(cta.label)) label.textContent = cta.label;
    if (cta.href && el.getAttribute('href') !== cta.href) el.setAttribute('href', cta.href);
  });
}

function maskLine(text) {
  const line = document.createElement('span');
  line.className = 'hero-title__line';
  const inner = document.createElement('span');
  inner.className = 'hero-title__text';
  inner.dataset.reveal = 'line';
  inner.textContent = text;
  line.append(inner);
  return line;
}

function setText(el, text) {
  if (el && el.textContent !== text) el.textContent = text;
}

function wrapRatingLink(chip, url) {
  if (!chip || chip.closest('a')) return;
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener';
  a.className = chip.className;
  a.dataset.reveal = chip.dataset.reveal;
  a.append(...chip.childNodes);
  chip.replaceWith(a);
}

function plural(n, one, few, many) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/** "Смотреть работы" → smooth scroll to the cases section, or the hero carousel until it exists. */
function bindSeeWorks(layer, ctx) {
  const btn = layer.querySelector('[data-cta="see-works"]');
  if (!btn) return;
  btn.addEventListener('click', (event) => {
    const href = btn.getAttribute('href') || '';
    const target =
      (href.startsWith('#') && href.length > 1 && document.getElementById(href.slice(1))) ||
      ctx.root?.querySelector('[data-carousel]');
    if (!target) return;
    event.preventDefault();
    const behavior = ctx.reducedMotion ? 'auto' : 'smooth';
    const top = target.getBoundingClientRect().top + window.scrollY - (target.closest('#hero') ? 0 : 88);
    window.scrollTo({ top: Math.max(0, top), behavior });
    ctx.emit('hero:see-works', { targetId: target.id || null });
  });
}
