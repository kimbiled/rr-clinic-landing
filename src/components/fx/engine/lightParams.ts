// Light shimmer parameters (design-spec §9.2) shared by the WebGL and Canvas2D renderers.
// Every period is >= 7 s and none are commensurate, so the pattern never visibly loops
// and brightness never changes faster than ~0.15 Hz (H-02: no flashes > 1 Hz).
// All geometry is in stage px (the 1440×720 design frame; the stage is scaled as one unit).

const TAU = Math.PI * 2;

export type Rgb = readonly [number, number, number];
export type Rgba = readonly [number, number, number, number];

/** Overall layer opacity (§9.2 "layer opacity .5"). */
export const LAYER_OPACITY = 0.5;

/**
 * Canvas pixels per *screen* CSS pixel. The light is blurry by nature, so half resolution is plenty.
 * The backing store is stage px × stage.scale × RENDER_SCALE (DPR deliberately ignored).
 */
export const RENDER_SCALE = 0.5;

/** Light behind the statue head. Design frame 1440×720, anchored bottom-centre like the statue. */
export const GLOW = {
  x: 720,
  y: 180,
  rx: 450,
  ry: 260,
  core: [255, 214, 160, 0.55] as Rgba,
  mid: [255, 190, 120, 0.18] as Rgba,
  midStop: 0.55,
} as const;

export interface ShaftParams {
  offsetX: number;
  angleDeg: number;
  period: number;
  phase: number;
  driftPhase: number;
}

/** Two shafts falling from the top gaps between the columns, converging behind the head. */
export const SHAFTS: readonly [ShaftParams, ShaftParams] = [
  { offsetX: -360, angleDeg: 40, period: 9, phase: 0, driftPhase: 0 },
  { offsetX: 360, angleDeg: 140, period: 13, phase: 3, driftPhase: 2 },
];
export const SHAFT_TOP = -60; // origin above the hero top edge, stage px
export const SHAFT_HALF_WIDTH = 110; // 220 px wide
export const SHAFT_LENGTH = 650; // e-folding length of the fade-out
export const SHAFT_COLOR: Rgb = [255, 209, 153];

function normalize([x, y]: readonly [number, number]): readonly [number, number] {
  const l = Math.hypot(x, y);
  return [x / l, y / l];
}

/** Optional slow diagonal glint across the columns. */
export const GLINT = {
  everyMin: 10,
  everyMax: 14,
  duration: 2.4,
  halfWidth: 60, // 120 px band
  amp: 0.08,
  dir: normalize([1, 0.45]),
} as const;

export interface ShaftSample {
  opacity: number;
  drift: number;
}

export interface LightSample {
  glowOpacity: number;
  glowScale: number;
  shafts: readonly [ShaftSample, ShaftSample];
}

export interface GlintSample {
  /** Band centre in stage px along GLINT.dir. */
  center: number;
  amp: number;
}

export const NO_GLINT: GlintSample = { center: 0, amp: 0 };

function sampleShaft(s: ShaftParams, t: number): ShaftSample {
  return {
    opacity: 0.2 + 0.1 * Math.sin((TAU * (t + s.phase)) / s.period), // .1 ↔ .3
    drift: 24 * Math.sin((TAU * t) / 17 + s.driftPhase), // ±24 px
  };
}

/**
 * Animated values at time t (seconds of FX clock).
 * For reduced motion pass t = 0: every sine is at its midpoint, the glint is off.
 */
export function sampleLight(t: number): LightSample {
  return {
    glowOpacity: 0.45 + 0.1 * Math.sin((TAU * t) / 7), // .35 ↔ .55
    glowScale: 1.02 + 0.02 * Math.sin((TAU * t) / 11), // 1 ↔ 1.04
    shafts: [sampleShaft(SHAFTS[0], t), sampleShaft(SHAFTS[1], t)],
  };
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export type GlintScheduler = (t: number, w: number, h: number) => GlintSample;

/** Schedules the glint on the FX clock. */
export function createGlintScheduler(): GlintScheduler {
  let nextAt = rand(GLINT.everyMin * 0.5, GLINT.everyMax * 0.5);
  let startedAt = -1;

  return (t, w, h) => {
    if (startedAt < 0 && t >= nextAt) startedAt = t;
    if (startedAt < 0) return NO_GLINT;
    const p = (t - startedAt) / GLINT.duration;
    if (p >= 1) {
      startedAt = -1;
      nextAt = t + rand(GLINT.everyMin, GLINT.everyMax);
      return NO_GLINT;
    }
    const from = -GLINT.halfWidth * 3;
    const to = w * GLINT.dir[0] + h * GLINT.dir[1] + GLINT.halfWidth * 3;
    return { center: from + (to - from) * p, amp: GLINT.amp * Math.sin(Math.PI * p) };
  };
}
