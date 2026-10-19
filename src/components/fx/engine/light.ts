// Light shimmer factory: WebGL1 first, Canvas2D fallback.

import { createLight2D } from './light2D';
import { createLightGL } from './lightGL';
import type { LightRenderer } from './types';

/**
 * - a renderer;
 * - 'needs-fresh-canvas': WebGL failed after the canvas handed out a WebGL context, so it can't give
 *   a 2D one; the caller must mount a new <canvas> and retry with allowGL = false;
 * - null: no light at all.
 */
export type CreateLightResult = LightRenderer | 'needs-fresh-canvas' | null;

export function createLight(canvas: HTMLCanvasElement, allowGL: boolean): CreateLightResult {
  if (allowGL) {
    const glLight = createLightGL(canvas);
    if (glLight) return glLight;
  }
  const light2D = createLight2D(canvas);
  if (light2D) return light2D;
  return allowGL ? 'needs-fresh-canvas' : null;
}
