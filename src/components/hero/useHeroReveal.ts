import { useLayoutEffect, useState } from 'react';

// Load reveal (design-spec §9.5). t = 0 once the fonts and the bg image are ready (capped at FONT_WAIT_MAX).
// Every [data-reveal] element in the document (navbar + hero + bg/statue layers) is animated with WAAPI,
// `fill: backwards`, and html.rr-reveal (the CSS pre-state) is dropped in the same frame → no flash.

const WAIT_MAX = 1200;
const IDLE_SHIMMER_AT = 2400;
const DEFAULT_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

interface Step {
  at: number;
  step: number;
  dur: number;
  easing?: string;
  from: Keyframe;
}

// t (ms) relative to the reveal start
const TIMELINE: Record<string, Step> = {
  bg: { at: 0, step: 0, dur: 1200, from: { opacity: 0.35, transform: 'scale(1.04)' } },
  statue: { at: 150, step: 0, dur: 1100, from: { opacity: 0, transform: 'translateY(16px)' } },
  nav: { at: 250, step: 60, dur: 600, from: { opacity: 0, transform: 'translateY(-12px)' } },
  chip: { at: 450, step: 80, dur: 600, from: { opacity: 0, transform: 'translateY(12px)' } },
  line: {
    at: 550,
    step: 100,
    dur: 900,
    easing: 'cubic-bezier(0.19, 1, 0.22, 1)',
    from: { opacity: 0, transform: 'translateY(105%)' },
  },
  subtitle: { at: 820, step: 0, dur: 700, from: { opacity: 0, transform: 'translateY(10px)' } },
  cta: { at: 950, step: 80, dur: 600, from: { opacity: 0, transform: 'translateY(14px) scale(0.98)' } },
};

export const REVEAL_CLASS = 'rr-reveal';

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function waitForAssets(bgSrc: string): Promise<unknown> {
  const fonts = document.fonts
    ? Promise.all([
        document.fonts.load('400 40px Manrope'),
        document.fonts.load('400 18px "Futura PT"'),
        document.fonts.load('500 14px "Futura PT"'),
      ]).then(() => document.fonts.ready)
    : Promise.resolve();
  const img = new Image();
  img.src = bgSrc;
  const bg = img.decode ? img.decode() : Promise.resolve();
  return Promise.race([
    Promise.all([fonts, bg]),
    new Promise((resolve) => setTimeout(resolve, WAIT_MAX)),
  ]).catch(() => undefined);
}

/**
 * Plays the staggered reveal once and calls `startReveal(duration)` when it starts (FX + carousel sync to it).
 * Returns `idle` = true when the primary CTA may start its idle shimmer.
 */
export function useHeroReveal(opts: { reducedMotion: boolean; bgSrc: string; startReveal: (duration: number) => void }) {
  const { reducedMotion, bgSrc, startReveal } = opts;
  const [idle, setIdle] = useState(false);

  useLayoutEffect(() => {
    const html = document.documentElement;
    if (reducedMotion || typeof Element.prototype.animate !== 'function') {
      // Reduced motion: everything is visible at t = 0 (spec §9.7); no idle shimmer.
      startReveal(0);
      return;
    }

    html.classList.add(REVEAL_CLASS);
    let cancelled = false;
    let idleTimer = 0;

    (async () => {
      await waitForAssets(bgSrc);
      await nextFrame();
      if (cancelled) return;

      const counters: Record<string, number> = {};
      let end = 0;
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        const kind = el.dataset.reveal ?? '';
        const t = TIMELINE[kind];
        if (!t) return;
        const index = (counters[kind] = (counters[kind] ?? -1) + 1);
        const delay = t.at + index * t.step;
        end = Math.max(end, delay + t.dur);
        el.animate([t.from, { opacity: 1, transform: 'none' }], {
          delay,
          duration: t.dur,
          easing: t.easing ?? DEFAULT_EASE,
          fill: 'backwards',
        });
      });

      // Same frame as the animations' first tick: the backwards fill now owns the hidden state.
      html.classList.remove(REVEAL_CLASS);
      startReveal(end);
      idleTimer = window.setTimeout(() => setIdle(true), IDLE_SHIMMER_AT);
    })().catch(() => html.classList.remove(REVEAL_CLASS));

    return () => {
      cancelled = true;
      clearTimeout(idleTimer);
      html.classList.remove(REVEAL_CLASS);
    };
    // Runs once on mount by design (the reveal never replays, spec §9.5).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { idle: idle && !reducedMotion };
}
