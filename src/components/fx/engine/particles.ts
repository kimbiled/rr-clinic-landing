// Floating dust / gold motes (design-spec §9.1). Canvas2D, additive ('lighter') compositing,
// pre-rendered glow sprites drawn with drawImage — no shadowBlur, no per-frame gradients.
// Coordinates are stage px (1440×720 design frame); the backing store is stage px × pxPerUnit.

const AREA_PER_PARTICLE = 14800; // 70 at 1440×720
const COUNT_MIN = 40;
const COUNT_MAX = 110;
const BOKEH_SHARE = 0.15;
/** Max pointer parallax for the nearest layer, stage px (subtle). Pending client decision. */
export const PARALLAX_PX = 6;
const FOCUS_DIM = 0.55; // alpha multiplier while a case card is focused
const FOCUS_SPEED = 0.5; // speed multiplier while a case card is focused
const DEGRADE_FACTOR = 0.6; // §9.1: drop to 60% when the frame budget is blown
const TAU = Math.PI * 2;

const COLORS = [
  { hex: '#F6E2BC', share: 0.7 },
  { hex: '#FFFFFF', share: 0.2 },
  { hex: '#D7A561', share: 0.1 },
] as const;

interface DepthLayer {
  speed: number;
  size: number;
  depth: number;
}

const LAYERS: readonly [DepthLayer, DepthLayer, DepthLayer] = [
  { speed: 0.6, size: 0.7, depth: 0.35 },
  { speed: 1, size: 1, depth: 0.65 },
  { speed: 1.4, size: 1.3, depth: 1 },
];

type SpriteKind = 'mote' | 'glow' | 'bokeh';
type Stop = readonly [at: number, alpha: number];

// Sprite kinds: drawn diameter = radius × scale.
const SPRITES: Record<SpriteKind, { scale: number; stops: readonly Stop[] }> = {
  mote: { scale: 2.6, stops: [[0, 1], [0.45, 0.85], [1, 0]] },
  glow: { scale: 8, stops: [[0, 1], [0.12, 0.95], [0.22, 0.35], [0.5, 0.08], [1, 0]] },
  bokeh: { scale: 2.2, stops: [[0, 0.9], [0.6, 0.7], [0.85, 0.25], [1, 0]] },
};
const GLOW_MIN_RADIUS = 1.3;
const SPRITE_PX = 64;

type SpriteSet = Record<SpriteKind, HTMLCanvasElement>;

interface Particle {
  li: number;
  depth: number;
  sprite: HTMLCanvasElement;
  size: number;
  half: number;
  margin: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  a: number;
  tw: number;
  twW: number;
  twP: number;
  swayA: number;
  swayW: number;
  swayP: number;
}

export interface Particles {
  readonly canvas: HTMLCanvasElement;
  readonly count: number;
  resize(w: number, h: number, pxPerUnit: number): void;
  setReduced(value: boolean): void;
  /** Called by the frame-budget watchdog: drop to 60% (§9.1). */
  degrade(): void;
  setFocus(focused: boolean): void;
  update(dt: number): void;
  render(t: number): void;
  /** Reduced motion: one still frame, no twinkle, no parallax. */
  renderStatic(): void;
  destroy(): void;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp1 = (v: number) => (v < -1 ? -1 : v > 1 ? 1 : v);

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function makeSprite(hex: string, kind: SpriteKind): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = SPRITE_PX;
  c.height = SPRITE_PX;
  const g = c.getContext('2d');
  if (!g) return c;
  const [r, gg, b] = hexToRgb(hex);
  const mid = SPRITE_PX / 2;
  const grad = g.createRadialGradient(mid, mid, 0, mid, mid, mid);
  for (const [at, a] of SPRITES[kind].stops) grad.addColorStop(at, `rgba(${r},${gg},${b},${a})`);
  g.fillStyle = grad;
  g.fillRect(0, 0, SPRITE_PX, SPRITE_PX);
  return c;
}

function pickColor(): number {
  let x = Math.random();
  for (let i = 0; i < COLORS.length; i += 1) {
    x -= COLORS[i].share;
    if (x <= 0) return i;
  }
  return 0;
}

export function targetCount(w: number, h: number): number {
  return Math.max(COUNT_MIN, Math.min(COUNT_MAX, Math.round((w * h) / AREA_PER_PARTICLE)));
}

export function createParticles(canvas: HTMLCanvasElement): Particles | null {
  const g = canvas.getContext('2d', { alpha: true });
  if (!g) return null;
  const ctx = g;

  const sprites: SpriteSet[] = COLORS.map(({ hex }) => ({
    mote: makeSprite(hex, 'mote'),
    glow: makeSprite(hex, 'glow'),
    bokeh: makeSprite(hex, 'bokeh'),
  }));

  let w = 0;
  let h = 0;
  let unit = 1;
  let list: Particle[] = [];
  let countFactor = 1; // 1, or 0.6 after degrade(); ×0.5 for reduced motion
  let reduced = false;

  // eased modifiers
  let dim = 1;
  let dimTarget = 1;
  let speed = 1;
  let speedTarget = 1;
  let parX = 0;
  let parY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let clientX = 0;
  let clientY = 0;
  let pointerDirty = false;

  function make(anywhere: boolean): Particle {
    const bokeh = Math.random() < BOKEH_SHARE;
    const li = bokeh ? 2 : Math.floor(Math.random() * 3);
    const layer = LAYERS[li] ?? LAYERS[1];
    const radius = bokeh ? rand(3, 6) : rand(0.6, 2.2) * layer.size;
    const kind: SpriteKind = bokeh ? 'bokeh' : radius >= GLOW_MIN_RADIUS ? 'glow' : 'mote';
    const diameter = radius * SPRITES[kind].scale;
    const swayA = rand(6, 18);
    return {
      li,
      depth: layer.depth,
      sprite: (sprites[pickColor()] ?? sprites[0])[kind],
      size: diameter,
      half: diameter / 2,
      margin: diameter / 2 + swayA + PARALLAX_PX,
      x: rand(0, w),
      y: anywhere ? rand(0, h) : h + rand(0, 40),
      vx: rand(2, 8) * layer.speed,
      vy: -rand(4, 12) * layer.speed,
      a: bokeh ? rand(0.06, 0.14) : rand(0.15, 0.6),
      tw: bokeh ? 0.04 : 0.15,
      twW: TAU / rand(3, 7),
      twP: rand(0, TAU),
      swayA,
      swayW: TAU / rand(6, 14),
      swayP: rand(0, TAU),
    };
  }

  function syncCount() {
    const n = Math.max(1, Math.round(targetCount(w, h) * countFactor * (reduced ? 0.5 : 1)));
    if (list.length > n) list.length = n;
    while (list.length < n) list.push(make(true));
    list.sort((p, q) => p.li - q.li); // back layers first
  }

  function applyContextState() {
    ctx.setTransform(unit, 0, 0, unit, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
  }

  function onPointer(e: PointerEvent) {
    clientX = e.clientX;
    clientY = e.clientY;
    pointerDirty = true;
  }
  window.addEventListener('pointermove', onPointer, { passive: true });

  /** Normalise the pointer against the hero rect (screen space, after the stage transform). */
  function readPointer() {
    if (!pointerDirty) return;
    pointerDirty = false;
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    pointerX = clamp1(((clientX - r.left) / r.width) * 2 - 1);
    pointerY = clamp1(((clientY - r.top) / r.height) * 2 - 1);
  }

  function draw(t: number, twinkle: boolean) {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < list.length; i += 1) {
      const p = list[i];
      let a = p.a;
      if (twinkle) a += p.tw * Math.sin(p.twW * t + p.twP);
      a *= dim;
      if (a <= 0.003) continue;
      const x = p.x + p.swayA * Math.sin(p.swayW * t + p.swayP) + parX * p.depth;
      const y = p.y + parY * p.depth;
      ctx.globalAlpha = a > 1 ? 1 : a;
      ctx.drawImage(p.sprite, x - p.half, y - p.half, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  return {
    canvas,
    get count() {
      return list.length;
    },
    resize(nextW, nextH, pxPerUnit) {
      if (!nextW || !nextH) return;
      const sx = w ? nextW / w : 1;
      const sy = h ? nextH / h : 1;
      w = nextW;
      h = nextH;
      unit = pxPerUnit;
      canvas.width = Math.max(1, Math.round(w * unit));
      canvas.height = Math.max(1, Math.round(h * unit));
      applyContextState(); // resizing the backing store resets context state
      if (sx !== 1 || sy !== 1) {
        for (const p of list) {
          p.x *= sx;
          p.y *= sy;
        }
      }
      syncCount();
    },
    setReduced(value) {
      reduced = value;
      if (w) syncCount();
    },
    degrade() {
      countFactor = DEGRADE_FACTOR;
      if (w) syncCount();
    },
    setFocus(focused) {
      dimTarget = focused ? FOCUS_DIM : 1;
      speedTarget = focused ? FOCUS_SPEED : 1;
    },
    update(dt) {
      const k = 1 - Math.exp(-dt * 2.5);
      dim += (dimTarget - dim) * k;
      speed += (speedTarget - speed) * k;
      readPointer();
      const kp = 1 - Math.exp(-dt * 1.5);
      parX += (-pointerX * PARALLAX_PX - parX) * kp;
      parY += (-pointerY * PARALLAX_PX * 0.6 - parY) * kp;

      const step = dt * speed;
      for (let i = 0; i < list.length; i += 1) {
        const p = list[i];
        p.x += p.vx * step;
        p.y += p.vy * step;
        if (p.y < -p.margin) {
          p.y += h + 2 * p.margin;
          p.x = rand(0, w);
        }
        if (p.x > w + p.margin) p.x -= w + 2 * p.margin;
      }
    },
    render(t) {
      draw(t, true);
    },
    renderStatic() {
      parX = 0;
      parY = 0;
      dim = dimTarget;
      draw(0, false);
    },
    destroy() {
      window.removeEventListener('pointermove', onPointer);
      list = [];
    },
  };
}
