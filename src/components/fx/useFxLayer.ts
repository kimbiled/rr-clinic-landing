import { useCallback, useEffect, useState } from 'react';
import { useHero } from '../hero/HeroContext';
import { fx } from './engine/fx';

/** §9.5: particles + light fade in at t = 1400 ms of the content reveal, over 1500 ms. */
const REVEAL_OFFSET_MS = 1400;
/** If the reveal never starts (no fonts, an error upstream…), fade in anyway after this long. */
const REVEAL_FALLBACK_MS = 1500;

/**
 * Shared wiring for both FX canvases: pushes stage scale + reduced motion into the engine and
 * decides when the canvas may fade in (first frame drawn AND the reveal timeline reached 1400 ms).
 */
export function useFxLayer() {
  const { stage, reducedMotion, reveal, surgeonMenuOpen } = useHero();
  const [drawn, setDrawn] = useState(false);
  const [due, setDue] = useState(false);
  const markDrawn = useCallback(() => setDrawn(true), []);

  useEffect(() => {
    fx.setScale(stage.scale);
  }, [stage.scale]);

  useEffect(() => {
    fx.setReduced(reducedMotion);
  }, [reducedMotion]);

  // QA N2-9: the full-screen menu (24 px backdrop blur) covers the hero — don't animate behind it.
  useEffect(() => {
    fx.setPaused(surgeonMenuOpen);
  }, [surgeonMenuOpen]);

  useEffect(() => {
    if (due || reducedMotion) return undefined;
    const wait =
      reveal.startedAt === null
        ? REVEAL_FALLBACK_MS
        : Math.max(0, reveal.startedAt + REVEAL_OFFSET_MS - performance.now());
    const timer = window.setTimeout(() => setDue(true), wait);
    return () => window.clearTimeout(timer);
  }, [due, reducedMotion, reveal.startedAt]);

  // Reduced motion: "everything visible at t = 0" (§9.7), no transition.
  const visible = drawn && (due || reducedMotion);
  return { visible, markDrawn };
}

export function fxCanvasClass(layer: 'hero__light' | 'hero__particles', visible: boolean) {
  return [
    'hero__layer',
    layer,
    'block size-full transition-opacity duration-1500 ease-out motion-reduce:transition-none',
    visible ? 'opacity-100' : 'opacity-0',
  ].join(' ');
}
