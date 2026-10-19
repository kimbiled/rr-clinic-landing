// Canvas2D fallback for the light shimmer (no WebGL). Same parameters as the shader, minus the
// caustic filaments: a scaled radial gradient for the glow and a pre-rendered shaft sprite
// that is drawn rotated each frame. Same reduced resolution, drawn at the same 30 fps cadence.

import {
  GLINT,
  GLOW,
  LAYER_OPACITY,
  NO_GLINT,
  SHAFTS,
  SHAFT_COLOR,
  SHAFT_HALF_WIDTH,
  SHAFT_LENGTH,
  SHAFT_TOP,
  createGlintScheduler,
  sampleLight,
  type Rgb,
  type Rgba,
} from './lightParams';
import type { LightRenderer } from './types';

const rgba = ([r, g, b]: Rgb | Rgba, a: number) => `rgba(${r}, ${g}, ${b}, ${a})`;

interface ShaftSprite {
  canvas: HTMLCanvasElement;
  len: number;
  w: number;
}

/** Shaft sprite: along +x, gaussian-ish across y, fade-in at the start and exponential fade-out. */
function makeShaftSprite(): ShaftSprite | null {
  const len = SHAFT_LENGTH * 3;
  const w = SHAFT_HALF_WIDTH * 4;
  const c = document.createElement('canvas');
  c.width = Math.round(len / 4);
  c.height = Math.round(w / 4);
  const g = c.getContext('2d');
  if (!g) return null;
  const across = g.createLinearGradient(0, 0, 0, c.height);
  across.addColorStop(0, rgba(SHAFT_COLOR, 0));
  across.addColorStop(0.3, rgba(SHAFT_COLOR, 0.35));
  across.addColorStop(0.5, rgba(SHAFT_COLOR, 1));
  across.addColorStop(0.7, rgba(SHAFT_COLOR, 0.35));
  across.addColorStop(1, rgba(SHAFT_COLOR, 0));
  g.fillStyle = across;
  g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'destination-in';
  const along = g.createLinearGradient(0, 0, c.width, 0);
  along.addColorStop(0, 'rgba(0,0,0,0)');
  for (let i = 1; i <= 6; i += 1) {
    const x = i / 6;
    along.addColorStop(x, `rgba(0,0,0,${(Math.min(1, x * 8) * Math.exp(-3 * x)).toFixed(3)})`);
  }
  g.fillStyle = along;
  g.fillRect(0, 0, c.width, c.height);
  return { canvas: c, len, w };
}

/** Returns null when the canvas can't give a 2D context (e.g. it already holds a WebGL one). */
export function createLight2D(canvas: HTMLCanvasElement): LightRenderer | null {
  const g = canvas.getContext('2d');
  if (!g) return null;
  const sprite = makeShaftSprite();
  if (!sprite) return null;
  const glint = createGlintScheduler();
  let w = 0;
  let h = 0;
  let unit = 1;

  return {
    kind: 'canvas2d',
    canvas,
    resize(nextW, nextH, pxPerUnit) {
      w = nextW;
      h = nextH;
      unit = pxPerUnit;
      const bw = Math.max(1, Math.round(w * unit));
      const bh = Math.max(1, Math.round(h * unit));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
    },
    render(t, opts = {}) {
      if (!w || !h) return;
      const s = sampleLight(t);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.setTransform(unit, 0, 0, unit, 0, 0);
      g.globalCompositeOperation = 'lighter';

      // glow (bottom-centred design frame)
      const cx = w / 2 - 720 + GLOW.x;
      const cy = h - 720 + GLOW.y;
      g.save();
      g.translate(cx, cy);
      g.scale(GLOW.rx * s.glowScale, GLOW.ry * s.glowScale);
      const rg = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      rg.addColorStop(0, rgba(GLOW.core, GLOW.core[3]));
      rg.addColorStop(GLOW.midStop, rgba(GLOW.mid, GLOW.mid[3]));
      rg.addColorStop(1, rgba(GLOW.mid, 0));
      g.globalAlpha = s.glowOpacity * LAYER_OPACITY;
      g.fillStyle = rg;
      g.fillRect(-1, -1, 2, 2);
      g.restore();

      // shafts
      SHAFTS.forEach((shaft, i) => {
        g.save();
        g.translate(w / 2 + shaft.offsetX + s.shafts[i].drift, SHAFT_TOP);
        g.rotate((shaft.angleDeg * Math.PI) / 180);
        g.globalAlpha = s.shafts[i].opacity * LAYER_OPACITY;
        g.drawImage(sprite.canvas, 0, -sprite.w / 2, sprite.len, sprite.w);
        g.restore();
      });

      // glint
      const gs = opts.still ? NO_GLINT : glint(t, w, h);
      if (gs.amp > 0.001) {
        const [dx, dy] = GLINT.dir;
        const x0 = dx * gs.center;
        const y0 = dy * gs.center;
        const span = GLINT.halfWidth * 2;
        const lg = g.createLinearGradient(x0 - dx * span, y0 - dy * span, x0 + dx * span, y0 + dy * span);
        lg.addColorStop(0, 'rgba(255,245,230,0)');
        lg.addColorStop(0.5, `rgba(255,245,230,${gs.amp})`);
        lg.addColorStop(1, 'rgba(255,245,230,0)');
        g.globalAlpha = LAYER_OPACITY;
        g.fillStyle = lg;
        g.fillRect(0, 0, w, h);
      }
      g.globalAlpha = 1;
    },
    destroy() {
      // nothing to release: the 2D context and the sprite are garbage-collected with the canvas
    },
  };
}
