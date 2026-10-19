// FE-1 · Background FX: light shimmer (data-fx-light) + particles (data-fx-particles).
// One shared rAF loop; paused when the hero is off-screen or the tab is hidden;
// reduced motion renders a single still frame of each layer (design-spec §9.1, §9.2, §9.7).

import { createLoop } from './loop.js';
import { createLight } from './light.js';
import { createParticles } from './particles.js';

const LIGHT_FPS = 30; // the light moves over 7–17 s periods, 30 fps is indistinguishable
const RESIZE_DEBOUNCE_MS = 150;
const SLOW_FRAME_MS = 18; // §9.1: drop particles to 60% if avg frame > 18 ms for 2 s
const SLOW_FOR_S = 2;
const WARMUP_S = 3; // ignore load-time jank
const VISIBLE_CLASS = 'is-fx-visible';

export async function init(ctx) {
  const root = ctx.root;
  if (!root) return undefined;
  const lightCanvas = root.querySelector('[data-fx-light]');
  const particlesCanvas = root.querySelector('[data-fx-particles]');

  let light = null;
  let particles = null;
  try {
    light = lightCanvas ? createLight(lightCanvas) : null;
  } catch (error) {
    console.warn('[fx] light disabled', error);
  }
  try {
    particles = particlesCanvas ? createParticles(particlesCanvas) : null;
  } catch (error) {
    console.warn('[fx] particles disabled', error);
  }
  if (!light && !particles) return undefined;

  const debug = new URLSearchParams(location.search).has('fxdebug');
  const state = {
    inView: true,
    hidden: document.hidden,
    reduced: Boolean(ctx.reducedMotion),
  };
  let clock = 0; // FX time: only advances while animating, so a resume never jumps
  let lightAcc = Infinity;
  let revealed = false;
  let emaInterval = 16.7;
  let baseInterval = Infinity; // display/vsync cap measured during warm-up (60 Hz, or 30 Hz in battery saver)
  let slowFor = 0;
  let degraded = false;
  let stats = { cost: 0, frames: 0, lastLog: 0 };

  function reveal() {
    if (revealed) return;
    revealed = true;
    // next frame: make sure the first frame is on screen before the fade starts
    requestAnimationFrame(() => {
      light?.canvas.classList.add(VISIBLE_CLASS);
      particles?.canvas.classList.add(VISIBLE_CLASS);
    });
  }

  function watchBudget(dt, interval) {
    if (degraded || !particles) return;
    if (interval > 100) return;
    emaInterval += (interval - emaInterval) * 0.1;
    if (clock < WARMUP_S) {
      if (interval > 4) baseInterval = Math.min(baseInterval, interval);
      return;
    }
    // A steady 30 Hz cap is not jank: only count frames clearly slower than the display cadence.
    const threshold = Math.max(SLOW_FRAME_MS, baseInterval * 1.15);
    slowFor = emaInterval > threshold ? slowFor + dt : 0;
    if (slowFor > SLOW_FOR_S) {
      degraded = true;
      particles.degrade();
    }
  }

  const loop = createLoop((dt, now, interval) => {
    const t0 = debug ? performance.now() : 0;
    clock += dt;
    if (particles) {
      particles.update(dt);
      particles.render(clock);
    }
    lightAcc += dt;
    if (light && lightAcc >= 1 / LIGHT_FPS - 0.004) {
      lightAcc = 0;
      light.render(clock);
    }
    reveal();
    watchBudget(dt, interval);
    if (debug) logStats(performance.now() - t0, now);
  });

  function logStats(cost, now) {
    stats.cost += cost;
    stats.frames += 1;
    if (now - stats.lastLog > 2000) {
      // eslint-disable-next-line no-console
      console.debug(
        `[fx] ${(stats.cost / stats.frames).toFixed(3)} ms/frame CPU · light=${light?.kind ?? 'off'} · ` +
          `avg interval ${emaInterval.toFixed(1)} ms${degraded ? ' · degraded' : ''}`,
      );
      window.__rrFx = { msPerFrame: stats.cost / stats.frames, light: light?.kind, degraded };
      stats = { cost: 0, frames: 0, lastLog: now };
    }
  }

  function renderStill() {
    light?.render(0, { static: true });
    particles?.renderStatic();
    reveal();
  }

  function sync() {
    if (state.reduced) {
      loop.stop();
      renderStill();
      return;
    }
    if (!state.hidden && state.inView) {
      lightAcc = Infinity; // draw the light on the first frame after a resume
      loop.start();
    } else {
      loop.stop();
    }
  }

  function applySize() {
    const w = root.clientWidth;
    const h = root.clientHeight;
    if (!w || !h) return;
    light?.resize(w, h);
    particles?.resize(w, h);
    // resizing clears the canvases: repaint now instead of waiting for the next tick
    if (state.reduced) {
      renderStill();
    } else if (!loop.running) {
      light?.render(clock);
      particles?.render(clock);
    } else {
      lightAcc = Infinity;
    }
  }

  particles?.setReduced(state.reduced);
  applySize();

  // --- observers
  let resizeTimer = 0;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applySize, RESIZE_DEBOUNCE_MS);
  });
  ro.observe(root);

  const io = new IntersectionObserver((entries) => {
    state.inView = entries[entries.length - 1].isIntersecting;
    sync();
  });
  io.observe(root);

  const onVisibility = () => {
    state.hidden = document.hidden;
    sync();
  };
  document.addEventListener('visibilitychange', onVisibility);

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onMotion = () => {
    state.reduced = Boolean(ctx.reducedMotion);
    particles?.setReduced(state.reduced);
    sync();
  };
  motionQuery.addEventListener('change', onMotion);

  // --- bus: calm the dust while a case card is in focus
  const offFocus = ctx.on('carousel:focus', () => particles?.setFocus(true));
  const offBlur = ctx.on('carousel:blur', () => particles?.setFocus(false));

  sync();

  return {
    destroy() {
      loop.stop();
      ro.disconnect();
      io.disconnect();
      clearTimeout(resizeTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery.removeEventListener('change', onMotion);
      offFocus();
      offBlur();
      particles?.destroy();
    },
  };
}
