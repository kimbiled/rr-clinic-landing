import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { asset } from '../../data/hero';
import type { BeforeAfterCase, Case, Framing, ImageAsset } from '../../data/types';
import { coverRect, framingStyle } from '../carousel/geometry';
import { useHero } from '../hero/HeroContext';

/** Card 362 × 461 in the 393 px design; each side's Figma crop fills one half of it. */
const CARD_ASPECT = 362 / 461;
const HALF = { before: { x: 0, w: 0.5 }, after: { x: 0.5, w: 0.5 } } as const;

const isBeforeAfter = (c: Case): c is BeforeAfterCase => c.type === 'beforeAfter';

/**
 * The Figma crops are cut for the desktop card half (100 × 220); the phone half is narrower, so "cover" would
 * trim the sides and zoom in. Instead keep the crop's full width and grow it vertically around its centre
 * (≈ 16 % more head and chin), staying inside the source; only when that would run off the image fall back to cover.
 */
function fitWidth(rect: Framing, w: number, h: number, slotAspect: number): Framing {
  const nh = (rect.w * w) / slotAspect / h;
  if (nh < rect.h || nh > 1) return coverRect(rect, w, h, slotAspect);
  const y = Math.min(1 - nh, Math.max(0, rect.y - (nh - rect.h) / 2));
  return { x: rect.x, y, w: rect.w, h: nh };
}

/** Image placed so its (widened) Figma crop fills its half of the card (aspect kept); the rest spills under the other half. */
function sideStyle(img: ImageAsset, side: 'before' | 'after'): CSSProperties | undefined {
  if (!img.framing) return undefined;
  return framingStyle(fitWidth(img.framing, img.width, img.height, CARD_ASPECT / 2), HALF[side]);
}

const ArrowIcon = ({ dir }: { dir: -1 | 1 }) => (
  <svg viewBox="0 0 22 16" width={22} height={16} fill="none" aria-hidden="true" className={dir < 0 ? 'rotate-180' : undefined}>
    <path d="M1 8h19M13.5 1.5 20 8l-6.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * "Смотреть работы" (phone): one before/after card at a time — drag anywhere on the photo (or use the knob
 * with ← →) to move the divider; the round arrows switch cases. When a surgeon is picked in the menu, only
 * their cases are shown.
 */
export function MobileCases() {
  const { data, selectedDoctorId } = useHero();
  const all = useMemo(() => data.cases.filter(isBeforeAfter), [data.cases]);
  const cases = useMemo(() => {
    const own = selectedDoctorId ? all.filter((c) => c.doctorId === selectedDoctorId) : [];
    return own.length ? own : all;
  }, [all, selectedDoctorId]);

  const [index, setIndex] = useState(0);
  const [pos, setPos] = useState(50);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    setIndex(0);
    setPos(50);
  }, [cases]);

  const n = cases.length;
  const go = (step: number) => {
    setIndex((i) => (i + step + n) % n);
    setPos(50);
  };

  const posFromPointer = (clientX: number) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    posFromPointer(e.clientX);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) posFromPointer(e.clientX);
  };
  const endDrag = () => {
    dragging.current = false;
  };

  const onKnobKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.key === 'ArrowLeft' ? -5 : e.key === 'ArrowRight' ? 5 : e.key === 'Home' ? -100 : e.key === 'End' ? 100 : 0;
    if (!step) return;
    e.preventDefault();
    setPos((p) => Math.min(100, Math.max(0, p + step)));
  };

  if (!n) return null;
  const current = cases[Math.min(index, n - 1)];

  return (
    <div>
      <div
        ref={cardRef}
        className="m-cases__card relative aspect-[362/461] w-full touch-pan-y overflow-hidden rounded-[17px] bg-[#4a3624] select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="group"
        aria-roledescription="слайд"
        aria-label={`${index + 1} из ${n}: ${current.title}`}
      >
        {cases.map((c, i) => {
          const active = c === current;
          return (
            <div key={c.id} className="m-cases__slide absolute inset-0" data-active={active || undefined} aria-hidden={!active}>
              <img
                src={asset(c.after.src)}
                width={c.after.width}
                height={c.after.height}
                alt={active ? `После: ${c.title}` : ''}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
                className={c.after.framing ? 'absolute max-w-none' : 'absolute inset-0 size-full object-cover'}
                style={sideStyle(c.after, 'after')}
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${active ? 100 - pos : 50}% 0 0)` }}
              >
                <img
                  src={asset(c.before.src)}
                  width={c.before.width}
                  height={c.before.height}
                  alt={active ? `До: ${c.title}` : ''}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                  className={c.before.framing ? 'absolute max-w-none' : 'absolute inset-0 size-full object-cover'}
                  style={sideStyle(c.before, 'before')}
                />
              </div>
            </div>
          );
        })}

        <div className="m-cases__shade pointer-events-none absolute inset-x-0 bottom-0 h-[38%]" aria-hidden="true" />
        <span className="pointer-events-none absolute top-5 left-5 font-text text-[12px] leading-3 tracking-[0.02em] text-white/85 uppercase" aria-hidden="true">
          До
        </span>
        <span className="pointer-events-none absolute top-5 right-5 font-text text-[12px] leading-3 tracking-[0.02em] text-white/85 uppercase" aria-hidden="true">
          После
        </span>
        <p key={current.id} className="m-cases__title pointer-events-none absolute bottom-[19px] left-5 font-text text-[18px] leading-[22px] font-medium text-white">
          {current.title}
        </p>

        {/* Divider + knob (the knob is the keyboard handle; the whole photo is the pointer target) */}
        <span className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-white/80" style={{ left: `${pos}%` }} aria-hidden="true" />
        <button
          type="button"
          role="slider"
          aria-label="Сравнение до и после"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={`${Math.round(pos)}% «до»`}
          onKeyDown={onKnobKey}
          className="m-cases__knob absolute top-1/2 grid size-[22px] -translate-1/2 place-items-center rounded-full"
          style={{ left: `${pos}%` }}
        >
          <svg viewBox="0 0 10 6" width={8} height={5} fill="none" aria-hidden="true">
            <path d="M3 .8.8 3 3 5.2M7 .8 9.2 3 7 5.2" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Предыдущая работа"
          className="m-cases__nav m-cases__nav--prev grid size-14 shrink-0 place-items-center rounded-full"
        >
          <ArrowIcon dir={-1} />
        </button>
        <span className="h-px flex-1 bg-[#dbbb7f]" aria-hidden="true" />
        <span className="font-text text-[16px] leading-5 text-[#c9a463] tabular-nums" aria-live="polite">
          {index + 1}/{n}
        </span>
        <span className="h-px flex-1 bg-[#dbbb7f]" aria-hidden="true" />
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Следующая работа"
          className="m-cases__nav m-cases__nav--next grid size-14 shrink-0 place-items-center rounded-full"
        >
          <ArrowIcon dir={1} />
        </button>
      </div>
    </div>
  );
}
