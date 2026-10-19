// Light shimmer parameters (design-spec §9.2) shared by the WebGL and Canvas2D renderers.
// Every period is >= 7 s and none are commensurate, so the pattern never visibly loops
// and brightness never changes faster than ~0.15 Hz (H-02: no flashes > 1 Hz).

const TAU = Math.PI * 2;

/** Overall layer opacity (§9.2 "layer opacity .5"). */
export const LAYER_OPACITY = 0.5;

/** Canvas pixels per CSS pixel. The light is blurry by nature, so half resolution is plenty. */
export const RENDER_SCALE = 0.5;

/** Light behind the statue head. Design frame 1440×720, anchored bottom-centre like the statue. */
export const GLOW = {
  x: 720,
  y: 180,
  rx: 450,
  ry: 260,
  core: [255, 214, 160, 0.55],
  mid: [255, 190, 120, 0.18],
  midStop: 0.55,
};

/** Two shafts falling from the top gaps between the columns, converging behind the head. */
export const SHAFTS = [
  { offsetX: -360, angleDeg: 40, period: 9, phase: 0, driftPhase: 0 },
  { offsetX: 360, angleDeg: 140, period: 13, phase: 3, driftPhase: 2 },
];
export const SHAFT_TOP = -60; // origin above the hero top edge, CSS px
export const SHAFT_HALF_WIDTH = 110; // 220 px wide
export const SHAFT_LENGTH = 650; // e-folding length of the fade-out
export const SHAFT_COLOR = [255, 209, 153];

/** Optional slow diagonal glint across the columns. */
export const GLINT = {
  everyMin: 10,
  everyMax: 14,
  duration: 2.4,
  halfWidth: 60, // 120 px band
  amp: 0.08,
  dir: normalize([1, 0.45]),
};

function normalize([x, y]) {
  const l = Math.hypot(x, y);
  return [x / l, y / l];
}

/**
 * Animated values at time t (seconds of FX clock).
 * For reduced motion pass t = 0: every sine is at its midpoint, the glint is off.
 */
export function sampleLight(t) {
  const glowOpacity = 0.45 + 0.1 * Math.sin((TAU * t) / 7); // .35 ↔ .55
  const glowScale = 1.02 + 0.02 * Math.sin((TAU * t) / 11); // 1 ↔ 1.04
  const shafts = SHAFTS.map((s) => ({
    opacity: 0.2 + 0.1 * Math.sin((TAU * (t + s.phase)) / s.period), // .1 ↔ .3
    drift: 24 * Math.sin((TAU * t) / 17 + s.driftPhase), // ±24 px
  }));
  return { glowOpacity, glowScale, shafts };
}

/** Schedules the glint on the FX clock. Returns { center, amp } in CSS px along GLINT.dir. */
export function createGlintScheduler() {
  let nextAt = rand(GLINT.everyMin * 0.5, GLINT.everyMax * 0.5);
  let startedAt = -1;

  return function sample(t, w, h) {
    if (startedAt < 0 && t >= nextAt) startedAt = t;
    if (startedAt < 0) return { center: 0, amp: 0 };
    const p = (t - startedAt) / GLINT.duration;
    if (p >= 1) {
      startedAt = -1;
      nextAt = t + rand(GLINT.everyMin, GLINT.everyMax);
      return { center: 0, amp: 0 };
    }
    const from = -GLINT.halfWidth * 3;
    const to = w * GLINT.dir[0] + h * GLINT.dir[1] + GLINT.halfWidth * 3;
    return { center: from + (to - from) * p, amp: GLINT.amp * Math.sin(Math.PI * p) };
  };
}

function rand(a, b) {
  return a + Math.random() * (b - a);
}
