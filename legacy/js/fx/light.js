// Light shimmer factory: WebGL1 first, Canvas2D fallback.

import { createLightGL } from './light-gl.js';
import { createLight2D } from './light-2d.js';

export function createLight(canvas) {
  const glLight = createLightGL(canvas);
  if (glLight) return glLight;

  // A canvas that already handed out a WebGL context can't give a 2D one: swap in a fresh clone.
  const fresh = canvas.cloneNode(false);
  canvas.replaceWith(fresh);
  return createLight2D(fresh);
}
