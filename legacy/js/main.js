// Entry point. Each feature module exports `init(ctx)` and owns its own files:
//   FE-1  js/fx/index.js          — light shimmer + particles
//   FE-2  js/carousel/index.js    — cases carousel, before/after, video, doctor card
//   FE-3  js/nav.js, js/hero.js, js/surgeon-menu.js — navbar, content reveal, CTAs, surgeon menu
// A module that fails to load or throws must not take the others down.

import { loadHeroData } from './data/hero-data.js';

const MODULES = [
  ['./nav.js', 'navbar'],
  ['./hero.js', 'hero content'],
  ['./fx/index.js', 'background fx'],
  ['./carousel/index.js', 'carousel'],
  ['./surgeon-menu.js', 'surgeon menu'],
];

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Shared context passed to every module.
 * bus events:
 *   'surgeon:select'  detail { doctorId: string | null }
 *   'carousel:focus'  detail { caseId: string, doctorId: string }
 *   'carousel:blur'   detail {}
 *   'stage:resize'    detail { scale: number, width: number, height: number }
 *
 * ctx.stage: the hero is a 1440×720 composition scaled as one unit (css/base.css .hero__stage).
 *   stage.scale  — CSS px per stage px. Convert pointer deltas with (clientX - rect.left) / scale,
 *                  and multiply canvas backing size by it to stay sharp.
 *   stage.width  — stage width in stage px (= viewport width / scale), height is always 720.
 */
const STAGE_W = 1440;
const STAGE_H = 720;
const STAGE_MAX_SCALE = 1.6;

const heroEl = document.getElementById('hero');

const ctx = {
  root: heroEl,
  stage: { scale: 1, width: STAGE_W, height: STAGE_H },
  data: null,
  bus: new EventTarget(),
  get reducedMotion() {
    return reducedMotionQuery.matches;
  },
  emit(type, detail = {}) {
    this.bus.dispatchEvent(new CustomEvent(type, { detail }));
  },
  on(type, handler) {
    const listener = (event) => handler(event.detail);
    this.bus.addEventListener(type, listener);
    return () => this.bus.removeEventListener(type, listener);
  },
};

function updateStage() {
  const vw = document.documentElement.clientWidth;
  const fit = Math.min(vw / STAGE_W, window.innerHeight / STAGE_H);
  const scale = Math.min(Math.max(fit, 1), STAGE_MAX_SCALE);
  const width = vw / scale;
  const changed = scale !== ctx.stage.scale || width !== ctx.stage.width;

  ctx.stage = { scale, width, height: STAGE_H };
  heroEl.style.setProperty('--stage-scale', String(scale));
  if (changed) ctx.emit('stage:resize', { ...ctx.stage });
}

async function boot() {
  updateStage();
  window.addEventListener('resize', updateStage, { passive: true });

  // Fetch data and every module in parallel; initialise in the declared order.
  const [data, ...loaded] = await Promise.all([
    loadHeroData(),
    ...MODULES.map(([path, label]) =>
      import(path).catch((error) => {
        console.error(`[hero] ${label} failed to load`, error);
        return null;
      }),
    ),
  ]);
  ctx.data = data;

  for (const [index, mod] of loaded.entries()) {
    if (!mod) continue;
    try {
      await mod.init(ctx);
    } catch (error) {
      console.error(`[hero] ${MODULES[index][1]} failed to initialise`, error);
    }
  }

  document.documentElement.classList.add('is-ready');
}

boot();
