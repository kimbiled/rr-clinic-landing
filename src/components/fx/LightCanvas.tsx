import { useEffect, useRef, useState } from 'react';
import { fx } from './engine/fx';
import { fxCanvasClass, useFxLayer } from './useFxLayer';

/**
 * Light shimmer behind the statue (design-spec §9.2), z = --z-light.
 * WebGL1 with a Canvas2D fallback. A canvas that already handed out a WebGL context can't give a
 * 2D one, so a failed WebGL init remounts a fresh <canvas> (key change) in 2D mode.
 */
export function LightCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [allowGL, setAllowGL] = useState(true);
  const { visible, markDrawn } = useFxLayer();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    return fx.attachLight(canvas, {
      allowGL,
      onFirstFrame: markDrawn,
      onNeedFreshCanvas: () => setAllowGL(false),
    });
  }, [allowGL, markDrawn]);

  return (
    <canvas
      key={allowGL ? 'gl' : '2d'}
      ref={ref}
      aria-hidden="true"
      className={fxCanvasClass('hero__light', visible)}
    />
  );
}
