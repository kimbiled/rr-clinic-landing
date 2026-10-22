import { useEffect, useRef } from 'react';
import { useHero } from '../hero/HeroContext';
import { fx } from './engine/fx';
import { fxCanvasClass, useFxLayer } from './useFxLayer';

/**
 * Floating dust / gold motes (design-spec §9.1), z = --z-particles. Shares the FX rAF loop.
 * `className` is appended to the layer classes (the phone hero uses it to drop the stage z-index).
 */
export function ParticlesCanvas({ className }: { className?: string } = {}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { focusedCase } = useHero();
  const { visible, markDrawn } = useFxLayer();
  const focused = focusedCase !== null;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    return fx.attachParticles(canvas, { onFirstFrame: markDrawn });
  }, [markDrawn]);

  // A case card is hovered/focused: dim + slow the dust; restore when it clears.
  useEffect(() => {
    fx.setFocus(focused);
  }, [focused]);

  return <canvas ref={ref} aria-hidden="true" className={[fxCanvasClass('hero__particles', visible), className].filter(Boolean).join(' ')} />;
}
