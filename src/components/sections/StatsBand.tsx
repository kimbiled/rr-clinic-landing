import { useEffect, useState } from 'react';
import { stats, type StatItem } from '../../data/landing';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useHero } from '../hero/HeroContext';
import { revealItem, revealScope, useInView } from './useInView';
import './sections.css';

const COUNT_MS = 1400;
const STAGGER_MS = 120;
/** Share of the band that must be on screen before it counts (R3-3). */
const VISIBLE_RATIO = 0.4;
/** Safety net: if the hero reveal never reports a start, stop waiting for it after this long. */
const REVEAL_WAIT_MAX = 4000;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

function format(value: number, decimals = 0) {
  return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
}

/**
 * Counts 0 → value once `start` turns true. The final string sits underneath (invisible) and fixes the
 * box size, so the band never shifts while digits change; tabular figures keep the digits steady.
 */
function CountUp({ item, start, delay }: { item: StatItem; start: boolean; delay: number }) {
  const reducedMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const final = format(item.value, item.decimals) + (item.suffix ?? '');

  useEffect(() => {
    if (!start || reducedMotion) return;
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / COUNT_MS));
      setCurrent(p >= 1 ? item.value : item.value * easeOutCubic(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, reducedMotion, delay, item.value]);

  const shown = reducedMotion ? final : format(current, item.decimals) + (item.suffix ?? '');

  return (
    <span className="inline-grid tabular-nums">
      <span className="invisible col-start-1 row-start-1" aria-hidden="true">
        {final}
      </span>
      <span className="col-start-1 row-start-1" aria-hidden="true">
        {shown}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}

/**
 * True once the hero load reveal has finished (or never ran: reduced motion reports duration 0),
 * so the count-up never plays behind the hero intro.
 */
function useHeroRevealDone(): boolean {
  const { reveal } = useHero();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    if (reveal.startedAt === null) {
      const t = window.setTimeout(() => setDone(true), REVEAL_WAIT_MAX);
      return () => window.clearTimeout(t);
    }
    const left = reveal.startedAt + reveal.duration - performance.now();
    if (left <= 0) {
      setDone(true);
      return;
    }
    const t = window.setTimeout(() => setDone(true), left);
    return () => window.clearTimeout(t);
  }, [done, reveal.startedAt, reveal.duration]);

  return done;
}

/** Gold band under the hero (Figma "Stats container", 1440×148): four figures, centred, 190 wide, 48 apart. */
export function StatsBand() {
  // R3-3: count only when ≥40% of the band is actually on screen AND the hero intro is over; a band that
  // merely touches the fold at load stays put until the visitor scrolls to it.
  const { ref, inView } = useInView<HTMLElement>({ threshold: VISIBLE_RATIO, rootMargin: '0px' });
  const heroDone = useHeroRevealDone();
  const start = inView && heroDone;

  return (
    <section
      ref={ref}
      aria-labelledby="stats-title"
      className="rr-section relative overflow-hidden bg-[linear-gradient(90deg,#d7a663_8%,#c69453_50%,#b98845_76%)] text-white"
      {...revealScope(start)}
    >
      {/* Soft light lift towards the bottom edge, as in the design. */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/0 to-white/8" aria-hidden="true" />
      <h2 id="stats-title" className="sr-only">
        {stats.srTitle}
      </h2>
      <ul className="relative mx-auto flex h-[148px] max-w-[1440px] items-center justify-center gap-12 px-(--sec-pad)">
        {stats.items.map((item, i) => (
          <li key={item.label} className="w-[190px] shrink-0" {...revealItem(i)}>
            <p className="font-display text-[40px] leading-[38px] font-normal tracking-[-0.045em]">
              <CountUp item={item} start={start} delay={i * STAGGER_MS} />
            </p>
            <p className="mt-[6px] font-text text-base leading-4 font-normal tracking-[-0.02em]">{item.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
