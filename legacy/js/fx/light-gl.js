// WebGL1 light shimmer: one full-screen triangle, a fragment shader with a breathing glow
// behind the statue head, two drifting god-ray shafts with slow caustic filaments, and an
// occasional diagonal glint. Output is premultiplied, so the browser composites it as
// src + dst·(1 − a), which reads like a soft "screen" over the columns photo.

import {
  GLINT,
  GLOW,
  LAYER_OPACITY,
  RENDER_SCALE,
  SHAFTS,
  SHAFT_COLOR,
  SHAFT_HALF_WIDTH,
  SHAFT_LENGTH,
  SHAFT_TOP,
  createGlintScheduler,
  sampleLight,
} from './light-params.js';

const f = (n) => (Number.isInteger(n) ? `${n}.0` : String(n));
const rgb = ([r, g, b]) => `vec3(${f(r / 255)}, ${f(g / 255)}, ${f(b / 255)})`;
const dir = (deg) => {
  const a = (deg * Math.PI) / 180;
  return `vec2(${f(Math.cos(a))}, ${f(Math.sin(a))})`;
};

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;      // drawing buffer, px
uniform float uScale;   // buffer px per CSS px
uniform vec2 uCss;      // hero size, CSS px
uniform float uTime;    // FX clock, s
uniform vec2 uGlow;     // opacity, scale
uniform vec2 uShaftA;   // opacity of shaft 1, 2
uniform vec2 uShaftX;   // origin x of shaft 1, 2 (CSS px)
uniform vec2 uGlint;    // band centre (CSS px along dir), amplitude

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float shaft(vec2 p, vec2 o, vec2 d, float seed) {
  vec2 rel = p - o;
  float along = dot(rel, d);
  float across = dot(rel, vec2(-d.y, d.x));
  float w = ${f(SHAFT_HALF_WIDTH)} * (1.0 + max(along, 0.0) / 1400.0);
  float q = across / w;
  float profile = exp(-q * q * 2.0);
  float len = smoothstep(-40.0, 180.0, along) * exp(-max(along, 0.0) / ${f(SHAFT_LENGTH)});
  // slow filaments travelling down the shaft + a broader breathing band
  float fil = noise(vec2(across / 36.0 + seed, along / 420.0 - uTime * 0.05));
  float band = noise(vec2(across / 95.0 - uTime * 0.03 + seed * 2.0, along / 900.0));
  return profile * len * (0.62 + 0.38 * fil) * (0.8 + 0.2 * band);
}

void main() {
  vec2 css = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale; // y down, CSS px

  // --- glow behind the statue head (bottom-centred 1440×720 design frame)
  vec2 dsg = vec2(css.x - uCss.x * 0.5 + 720.0, css.y - uCss.y + 720.0);
  vec2 q = (dsg - vec2(${f(GLOW.x)}, ${f(GLOW.y)})) / (vec2(${f(GLOW.rx)}, ${f(GLOW.ry)}) * uGlow.y);
  float r = length(q);
  float k = smoothstep(0.0, ${f(GLOW.midStop)}, r);
  vec3 glowCol = mix(${rgb(GLOW.core)}, ${rgb(GLOW.mid)}, k);
  float glowA = mix(${f(GLOW.core[3])}, ${f(GLOW.mid[3])}, k) * (1.0 - smoothstep(${f(GLOW.midStop)}, 1.0, r));
  float caustic = noise(dsg / 170.0 + vec2(uTime * 0.035, -uTime * 0.025)) * 0.6
                + noise(dsg / 90.0 - vec2(uTime * 0.02, uTime * 0.04)) * 0.4;
  glowA *= uGlow.x * (0.85 + 0.3 * caustic);

  // --- shafts (anchored to the hero top)
  float s1 = shaft(css, vec2(uShaftX.x, ${f(SHAFT_TOP)}), ${dir(SHAFTS[0].angleDeg)}, 0.0) * uShaftA.x;
  float s2 = shaft(css, vec2(uShaftX.y, ${f(SHAFT_TOP)}), ${dir(SHAFTS[1].angleDeg)}, 7.3) * uShaftA.y;
  float shaftA = s1 + s2;

  // --- glint
  float g = (dot(css, vec2(${f(GLINT.dir[0])}, ${f(GLINT.dir[1])})) - uGlint.x) / ${f(GLINT.halfWidth)};
  float glintA = uGlint.y * exp(-g * g);

  vec3 col = glowCol * glowA + ${rgb(SHAFT_COLOR)} * shaftA + vec3(1.0, 0.96, 0.9) * glintA;
  float a = glowA + shaftA + glintA;
  col *= ${f(LAYER_OPACITY)};
  a *= ${f(LAYER_OPACITY)};

  // dither against banding in the very soft gradients
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
  col = clamp(col, 0.0, 1.0);
  a = clamp(max(a, max(col.r, max(col.g, col.b))), 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}
`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`[fx] light shader: ${log}`);
  }
  return sh;
}

/** Returns a light renderer, or null when WebGL is unavailable or the shader fails. */
export function createLightGL(canvas) {
  let gl;
  try {
    gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
      failIfMajorPerformanceCaveat: true,
    });
  } catch {
    gl = null;
  }
  if (!gl) return null;

  let program = null;
  let u = null;
  let lost = false;
  let cssW = 0;
  let cssH = 0;
  let lastT = 0;
  const glint = createGlintScheduler();

  function setup() {
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`[fx] light program: ${gl.getProgramInfoLog(program)}`);
    }
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    u = {};
    for (const name of ['uRes', 'uScale', 'uCss', 'uTime', 'uGlow', 'uShaftA', 'uShaftX', 'uGlint']) {
      u[name] = gl.getUniformLocation(program, name);
    }
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
  }

  try {
    setup();
  } catch (error) {
    console.warn(error);
    return null;
  }

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lost = true;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    try {
      setup();
      lost = false;
      api.resize(cssW, cssH);
      api.render(lastT, { static: lastT === 0 });
    } catch (error) {
      console.warn(error);
    }
  });

  const api = {
    kind: 'webgl',
    canvas,
    resize(w, h) {
      cssW = w;
      cssH = h;
      const bw = Math.max(1, Math.round(w * RENDER_SCALE));
      const bh = Math.max(1, Math.round(h * RENDER_SCALE));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      if (lost) return;
      gl.viewport(0, 0, bw, bh);
    },
    /** t: FX clock in seconds. opts.static: no glint (reduced motion). */
    render(t, opts = {}) {
      lastT = t;
      if (lost || !cssW || !cssH) return;
      const s = sampleLight(t);
      const gl1 = opts.static ? { center: 0, amp: 0 } : glint(t, cssW, cssH);
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uScale, canvas.width / cssW);
      gl.uniform2f(u.uCss, cssW, cssH);
      gl.uniform1f(u.uTime, t);
      gl.uniform2f(u.uGlow, s.glowOpacity, s.glowScale);
      gl.uniform2f(u.uShaftA, s.shafts[0].opacity, s.shafts[1].opacity);
      gl.uniform2f(
        u.uShaftX,
        cssW / 2 + SHAFTS[0].offsetX + s.shafts[0].drift,
        cssW / 2 + SHAFTS[1].offsetX + s.shafts[1].drift,
      );
      gl.uniform2f(u.uGlint, gl1.center, gl1.amp);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
  return api;
}
