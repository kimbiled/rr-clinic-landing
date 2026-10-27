import { useEffect, useState, type MouseEvent } from 'react';
import { asset } from '../../data/hero';
import { operations, surgery, type SurgeryCase } from '../../data/landing';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { OPEN_CATEGORY_EVENT } from './Operations';
import { revealItem, revealScope, useInView } from './useInView';
import './sections.css';

/** One-time hint that the divider moves: 50 → 62 → 38 → 50 % over this long, once the card is in view. */
const NUDGE_MS = 1400;
const NUDGE_DELAY_MS = 600;

/**
 * Before/after card: "after" fills the card, "before" is clipped to the left of the divider. A transparent range
 * input covers the card, so dragging, clicking and the arrow keys all move the divider; the title sits above it.
 */
function BeforeAfter({ item, index, inView }: { item: SurgeryCase; index: number; inView: boolean }) {
  const reducedMotion = useReducedMotion();
  const [pos, setPos] = useState(50);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!inView || touched || reducedMotion) return undefined;
    let raf = 0;
    let start = 0;
    const delay = NUDGE_DELAY_MS + index * 180;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, Math.max(0, (now - start - delay) / NUDGE_MS));
      setPos(50 + 12 * Math.sin(t * Math.PI * 2) * (1 - t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, touched, reducedMotion, index]);

  const openCategory = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent(OPEN_CATEGORY_EVENT, { detail: item.categoryId }));
  };

  return (
    <li className="rr-ba relative h-[446px] overflow-hidden rounded-[24px] bg-[#b4a294]" {...revealItem(3 + index)}>
      <img
        src={asset(item.after.src)}
        width={item.after.width}
        height={item.after.height}
        alt={item.after.alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover"
      />
      <img
        src={asset(item.before.src)}
        width={item.before.width}
        height={item.before.height}
        alt={item.before.alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />
      <span className="rr-ba__shade pointer-events-none absolute inset-0" aria-hidden="true" />

      <span className="rr-ba__label absolute top-[22px] left-[22px]" aria-hidden="true">
        До
      </span>
      <span className="rr-ba__label absolute top-[22px] right-[22px]" aria-hidden="true">
        После
      </span>

      <span className="rr-ba__divider pointer-events-none absolute inset-y-0 w-px" style={{ left: `${pos}%` }} aria-hidden="true">
        <span className="rr-ba__handle absolute top-1/2 left-1/2 grid size-[42px] -translate-1/2 place-items-center rounded-full">
          <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true">
            <path d="M5 1 1 5l4 4M11 1l4 4-4 4" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(pos)}
        onChange={(e) => {
          setTouched(true);
          setPos(Number(e.target.value));
        }}
        onPointerDown={() => setTouched(true)}
        className="rr-ba__range absolute inset-0 size-full"
        aria-label={`${item.title}: до и после`}
        aria-valuetext={`${Math.round(pos)}% — до`}
      />

      <a
        href={`#${operations.id}`}
        onClick={openCategory}
        className="rr-ba__title absolute bottom-[26px] left-6 z-[1] font-display text-[22px] leading-7 font-medium text-white"
      >
        {item.title}
      </a>
    </li>
  );
}

/** "Пластическая хирургия" (design 2026-10-27): heading + three before/after cards; a card's title opens its category below. */
export function Surgery() {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section
      ref={ref}
      id={surgery.id}
      aria-labelledby="surgery-title"
      className="rr-section relative bg-white text-neutral-900"
      {...revealScope(inView)}
    >
      <span className="rr-rule pointer-events-none absolute inset-x-0 top-0" aria-hidden="true" />
      <div className="mx-auto max-w-[1440px] px-(--sec-pad)">
        <div className="rr-frame relative px-8 pt-[48px] pb-[40px]">
          <p className="rr-eyebrow !text-[14px]" {...revealItem(0)}>
            {surgery.eyebrow}
          </p>
          <h2
            id="surgery-title"
            className="mt-[14px] font-display text-[36px] leading-[44px] font-normal tracking-[-0.02em] text-[#1b1919]"
            {...revealItem(1)}
          >
            {surgery.title}
          </h2>
          <p className="mt-[7px] font-text text-[18px] leading-[20px] text-[#8c8784]" {...revealItem(2)}>
            {surgery.text}
          </p>

          <ul className="mt-[40px] grid grid-cols-3 gap-[22px]">
            {surgery.cases.map((item, i) => (
              <BeforeAfter key={item.title} item={item} index={i} inView={inView} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
