// FE-1 · Background FX controller: light shimmer + particles on ONE shared rAF loop.
// Paused when the hero is off-screen or the tab is hidden; reduced motion renders a single still
// frame of each layer (design-spec §9.1, §9.2, §9.7).
//
// Module singleton. Each React layer attaches its <canvas> and gets a detach function back; the
// observers and the loop live only while at least one layer is attached. attach/detach are
// idempotent, so StrictMode's mount → unmount → mount is safe. Settings (scale, reduced motion,
// focus) persist across re-attaches.

import { createLight } from './light';
import { createLoop } from './loop';
import { createParticles, type Particles } from './particles';
import { RENDER_SCALE } from './lightParams';
import type { LightRenderer } from './types';

const LIGHT_FPS = 30; // the light moves over 7–17 s periods, 30 fps is indistinguishable
const RESIZE_DEBOUNCE_MS = 150;
const DPR_MAX = 2; // particles: cap on the EFFECTIVE density (devicePixelRatio × stage.scale)
const SLOW_FRAME_MS = 18; // §9.1: drop particles to 60% if avg frame > 18 ms for 2 s
const SLOW_FOR_S = 2;
const WARMUP_S = 3; // ignore load-time jank

export interface LayerCallbacks {
  /** Called once, after the layer's first frame is on the canvas. */
  onFirstFrame?: () => void;
}

export interface LightAttachOptions extends LayerCallbacks {
  allowGL: boolean;
  /** WebGL failed on a canvas that can no longer give a 2D context: remount it, allowGL = false. */
  onNeedFreshCanvas?: () => void;
}

interface Slot<T> {
  canvas: HTMLCanvasElement;
  engine: T;
  onFirstFrame?: () => void;
}

interface FxDebugInfo {
  msPerFrame: number;
  light: LightRenderer['kind'] | 'off';
  degraded: boolean;
  particles: number;
  lightBacking: string;
  particlesBacking: string;
}

declare global {
  interface Window {
    __rrFx?: FxDebugInfo;
  }
}

const settings = { scale: 1, reduced: false, focused: false, paused: false };
const state = { hidden: false, inView: new Map<HTMLCanvasElement, boolean>() };

let light: Slot<LightRenderer> | null = null;
let particles: Slot<Particles> | null = null;

let clock = 0; // FX time: only advances while animating, so a resume never jumps
let lightAcc = Infinity;
let emaInterval = 16.7;
let baseInterval = Infinity; // display/vsync cap measured during warm-up (60 Hz, or 30 Hz in battery saver)
let slowFor = 0;
let degraded = false;

let ro: ResizeObserver | null = null;
let io: IntersectionObserver | null = null;
let dprQuery: MediaQueryList | null = null;
let resizeTimer = 0;

const debug = typeof location !== 'undefined' && new URLSearchParams(location.search).has('fxdebug');
let stats = { cost: 0, frames: 0, lastLog: 0 };

function markDrawn(slot: Slot<unknown> | null) {
  if (!slot?.onFirstFrame) return;
  const cb = slot.onFirstFrame;
  slot.onFirstFrame = undefined;
  cb();
}

function watchBudget(dt: number, interval: number) {
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
    particles.engine.degrade();
  }
}

function logStats(cost: number, now: number) {
  stats.cost += cost;
  stats.frames += 1;
  if (now - stats.lastLog < 2000) return;
  const info: FxDebugInfo = {
    msPerFrame: stats.cost / stats.frames,
    light: light?.engine.kind ?? 'off',
    degraded,
    particles: particles?.engine.count ?? 0,
    lightBacking: light ? `${light.canvas.width}×${light.canvas.height}` : '-',
    particlesBacking: particles ? `${particles.canvas.width}×${particles.canvas.height}` : '-',
  };
  console.debug(
    `[fx] ${info.msPerFrame.toFixed(3)} ms/frame CPU · light=${info.light} · ` +
      `avg interval ${emaInterval.toFixed(1)} ms${degraded ? ' · degraded' : ''}`,
  );
  window.__rrFx = info;
  stats = { cost: 0, frames: 0, lastLog: now };
}

const loop = createLoop((dt, now, interval) => {
  const t0 = debug ? performance.now() : 0;
  clock += dt;
  if (particles) {
    particles.engine.update(dt);
    particles.engine.render(clock);
    markDrawn(particles);
  }
  lightAcc += dt;
  if (light && lightAcc >= 1 / LIGHT_FPS - 0.004) {
    lightAcc = 0;
    light.engine.render(clock);
    markDrawn(light);
  }
  watchBudget(dt, interval);
  if (debug) logStats(performance.now() - t0, now);
});

function renderStill() {
  if (light) {
    light.engine.render(0, { still: true });
    markDrawn(light);
  }
  if (particles) {
    particles.engine.renderStatic();
    markDrawn(particles);
  }
}

function anyInView() {
  if (state.inView.size === 0) return true;
  for (const v of state.inView.values()) if (v) return true;
  return false;
}

function sync() {
  if (!light && !particles) {
    loop.stop();
    return;
  }
  if (settings.reduced) {
    loop.stop();
    renderStill();
    return;
  }
  if (!state.hidden && !settings.paused && anyInView()) {
    lightAcc = Infinity; // draw the light on the first frame after a resume
    loop.start();
  } else {
    loop.stop();
  }
}

function measure(canvas: HTMLCanvasElement) {
  // clientWidth/Height are layout sizes, i.e. stage px — the stage transform doesn't affect them.
  return { w: canvas.clientWidth, h: canvas.clientHeight };
}

function applySize() {
  let sized = false;
  const dpr = window.devicePixelRatio || 1;
  if (light) {
    const { w, h } = measure(light.canvas);
    if (w && h) {
      light.engine.resize(w, h, settings.scale * RENDER_SCALE);
      sized = true;
    }
  }
  if (particles) {
    const { w, h } = measure(particles.canvas);
    if (w && h) {
      particles.engine.resize(w, h, Math.min(dpr * settings.scale, DPR_MAX));
      sized = true;
    }
  }
  if (!sized) return;
  // resizing clears the canvases: repaint now instead of waiting for the next tick
  if (settings.reduced) {
    renderStill();
  } else if (!loop.running) {
    light?.engine.render(clock);
    particles?.engine.render(clock);
  } else {
    lightAcc = Infinity;
  }
}

function scheduleResize() {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(applySize, RESIZE_DEBOUNCE_MS);
}

function watchDpr() {
  dprQuery?.removeEventListener('change', onDprChange);
  dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
  dprQuery.addEventListener('change', onDprChange);
}

function onDprChange() {
  watchDpr();
  scheduleResize();
}

function onVisibility() {
  state.hidden = document.hidden;
  sync();
}

function startObservers() {
  if (ro) return;
  state.hidden = document.hidden;
  ro = new ResizeObserver(scheduleResize);
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.target instanceof HTMLCanvasElement) state.inView.set(e.target, e.isIntersecting);
    }
    sync();
  });
  document.addEventListener('visibilitychange', onVisibility);
  watchDpr();
}

function stopObservers() {
  loop.stop();
  ro?.disconnect();
  io?.disconnect();
  ro = null;
  io = null;
  clearTimeout(resizeTimer);
  document.removeEventListener('visibilitychange', onVisibility);
  dprQuery?.removeEventListener('change', onDprChange);
  dprQuery = null;
  state.inView.clear();
}

function observe(canvas: HTMLCanvasElement) {
  startObservers();
  ro?.observe(canvas);
  io?.observe(canvas);
}

function unobserve(canvas: HTMLCanvasElement) {
  ro?.unobserve(canvas);
  io?.unobserve(canvas);
  state.inView.delete(canvas);
  if (!light && !particles) stopObservers();
  else sync();
}

export const fx = {
  attachLight(canvas: HTMLCanvasElement, opts: LightAttachOptions): () => void {
    if (light) fx.detach(light.canvas);
    let result: ReturnType<typeof createLight> = null;
    try {
      result = createLight(canvas, opts.allowGL && !forceLight2D());
    } catch (error) {
      console.warn('[fx] light disabled', error);
    }
    if (result === 'needs-fresh-canvas') {
      opts.onNeedFreshCanvas?.();
      return noop;
    }
    if (!result) return noop;
    light = { canvas, engine: result, onFirstFrame: opts.onFirstFrame };
    observe(canvas);
    applySize();
    sync();
    return () => fx.detach(canvas);
  },

  attachParticles(canvas: HTMLCanvasElement, opts: LayerCallbacks = {}): () => void {
    if (particles) fx.detach(particles.canvas);
    let engine: Particles | null = null;
    try {
      engine = createParticles(canvas);
    } catch (error) {
      console.warn('[fx] particles disabled', error);
    }
    if (!engine) return noop;
    engine.setReduced(settings.reduced);
    engine.setFocus(settings.focused);
    if (degraded) engine.degrade();
    particles = { canvas, engine, onFirstFrame: opts.onFirstFrame };
    observe(canvas);
    applySize();
    sync();
    return () => fx.detach(canvas);
  },

  detach(canvas: HTMLCanvasElement) {
    if (light?.canvas === canvas) {
      light.engine.destroy();
      light = null;
    } else if (particles?.canvas === canvas) {
      particles.engine.destroy();
      particles = null;
    } else {
      return;
    }
    unobserve(canvas);
  },

  /** stage.scale (1…1.6): canvas backing = stage px × scale × DPR (capped). */
  setScale(scale: number) {
    if (!(scale > 0) || scale === settings.scale) return;
    settings.scale = scale;
    if (light || particles) scheduleResize();
  },

  setReduced(reduced: boolean) {
    if (reduced === settings.reduced) return;
    settings.reduced = reduced;
    particles?.engine.setReduced(reduced);
    sync();
  },

  /** Pause the loop while something covers the hero (the full-screen surgeon menu), like a hidden tab. */
  setPaused(paused: boolean) {
    if (paused === settings.paused) return;
    settings.paused = paused;
    sync();
  },

  /** A case card is hovered/focused: calm the dust (dim + slow). */
  setFocus(focused: boolean) {
    if (focused === settings.focused) return;
    settings.focused = focused;
    particles?.engine.setFocus(focused);
    if (settings.reduced) renderStill();
  },
};

function noop() {}

function forceLight2D() {
  return typeof location !== 'undefined' && new URLSearchParams(location.search).get('fxlight') === '2d';
}
