import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { asset, getDoctor } from '../../data/hero';
import { works, type WorkCategory } from '../../data/landing';
import type { Doctor } from '../../data/types';
import rawWorks from '../../data/works.json';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { MobileStepper } from '../mobile/MobileStepper';
import { revealItem, revealScope, useInView } from './useInView';
import './sections.css';

/** window event (detail = work category): the catalog's "Смотреть результаты" sets the filter here. */
export const OPEN_WORKS_EVENT = 'rr:open-works';

/** One-time hint that the divider moves: 50 → 62 → 38 → 50 % over this long, once the card is in view. */
const NUDGE_MS = 1400;
const NUDGE_DELAY_MS = 600;

interface Work {
  /** Files: assets/img/web/works/<id>-before.webp and -after.webp. */
  id: string;
  doctorId: string;
  title: string;
  category: WorkCategory;
  /** Time since the operation; shown only when known. */
  months?: number;
  /** A designer's side-by-side pair: both photos meet at the divider instead of lying on top of each other. */
  split?: boolean;
}

const allWorks = rawWorks as Work[];
const surgeons = works.surgeons.map((id) => getDoctor(id)).filter((d): d is Doctor => Boolean(d));

const shortName = (doctor: Doctor) => `${doctor.lastName} ${doctor.firstName[0]}.`;
const photo = (id: string, side: 'before' | 'after') => asset(`assets/img/web/works/${id}-${side}.webp`);

export function DoctorAvatar({ doctor, size }: { doctor: Doctor; size: number }) {
  return doctor.avatar ? (
    <img
      src={asset(doctor.avatar.src)}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      decoding="async"
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : null;
}

/**
 * "After" fills the frame, "before" is clipped to the left of the divider; a transparent range input moves it.
 * A split work gives each photo its own side of the divider, inner edge at the divider, so at 50 % it matches the pair
 * in the design and at either end one photo fills the card.
 */
function Compare({ work, nudgeDelay }: { work: Work; nudgeDelay?: number }) {
  const reducedMotion = useReducedMotion();
  const [pos, setPos] = useState(50);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (nudgeDelay === undefined || touched || reducedMotion) return undefined;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, Math.max(0, (now - start - nudgeDelay) / NUDGE_MS));
      setPos(50 + 12 * Math.sin(t * Math.PI * 2) * (1 - t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [nudgeDelay, touched, reducedMotion]);

  return (
    <>
      <img
        src={photo(work.id, 'after')}
        alt={`${work.title}: после`}
        loading="lazy"
        decoding="async"
        className={`absolute top-0 h-full object-cover ${work.split ? 'object-left' : ''}`}
        style={work.split ? { left: `${pos}%`, width: `${100 - pos}%` } : { left: 0, width: '100%' }}
      />
      <img
        src={photo(work.id, 'before')}
        alt={`${work.title}: до`}
        loading="lazy"
        decoding="async"
        className={`absolute top-0 left-0 h-full object-cover ${work.split ? 'object-right' : ''}`}
        style={work.split ? { width: `${pos}%` } : { width: '100%', clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />
      <span className="rr-ba__blur rr-edge-blur pointer-events-none absolute inset-0" aria-hidden="true" />
      <span className="rr-ba__shade pointer-events-none absolute inset-0" aria-hidden="true" />

      <span className="rr-ba__label absolute top-5 left-5" aria-hidden="true">
        До
      </span>
      <span className="rr-ba__label absolute top-5 right-5" aria-hidden="true">
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
        aria-label={`${work.title}: до и после`}
        aria-valuetext={`${Math.round(pos)}% — до`}
      />
    </>
  );
}

function WorkMeta({ work, doctor }: { work: Work; doctor?: Doctor }) {
  return (
    <span className="mt-2 flex items-center justify-between gap-3 font-text text-[14px] leading-5 text-white/85">
      {doctor && (
        <span className="flex min-w-0 items-center gap-2">
          <DoctorAvatar doctor={doctor} size={24} />
          <span className="truncate">{shortName(doctor)}</span>
        </span>
      )}
      {work.months && <span className="shrink-0">{work.months} мес. после</span>}
    </span>
  );
}

function WorkCard({ work, nudgeDelay, onOpen }: { work: Work; nudgeDelay?: number; onOpen: () => void }) {
  return (
    <li className="rr-ba relative h-[400px] overflow-hidden rounded-[24px] bg-[#b4a294] max-md:h-[424px]">
      <Compare work={work} nudgeDelay={nudgeDelay} />
      <button type="button" className="rr-work__open absolute inset-x-0 bottom-0 z-[1] px-5 pt-4 pb-4 text-left text-white" onClick={onOpen} aria-label={`Рассмотреть крупно: ${work.title}`}>
        <span className="rr-work__title block font-text text-[20px] leading-6 font-medium">{work.title}</span>
        <WorkMeta work={work} doctor={getDoctor(work.doctorId)} />
      </button>
    </li>
  );
}

/** The chosen work, large: ← → walk through the current filter; Esc and a click outside close it. */
function Lightbox({ list, index, onIndex, onClose }: { list: Work[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const work = list[index];
  const step = (dir: number) => onIndex((index + dir + list.length) % list.length);

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className="rr-work-box"
      aria-label={work.title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.target instanceof HTMLInputElement) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') step(e.key === 'ArrowRight' ? 1 : -1);
      }}
    >
      <div className="rr-ba relative h-[min(78vh,760px)] w-[min(92vw,600px)] overflow-hidden rounded-[24px] bg-[#b4a294]">
        <Compare key={work.id} work={work} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] px-6 pb-5 text-white">
          <p className="rr-work__title font-text text-[22px] leading-7 font-medium">{work.title}</p>
          <WorkMeta work={work} doctor={getDoctor(work.doctorId)} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-text text-[15px] leading-5 text-white/80 tabular-nums">
          {index + 1} / {list.length}
        </span>
        <div className="flex gap-2">
          <button type="button" className="rr-work-box__btn" onClick={() => step(-1)} aria-label="Предыдущая работа">
            ←
          </button>
          <button type="button" className="rr-work-box__btn" onClick={() => step(1)} aria-label="Следующая работа">
            →
          </button>
          <button type="button" className="rr-work-box__btn" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
      </div>
    </dialog>
  );
}

const ScalpelIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5e8b7b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
    <path d="m3 18.5 8-8 3 3-8 8a1 1 0 0 1-1.4 0L3 19.9a1 1 0 0 1 0-1.4Z" />
    <path d="M11 10.5 20.5 3c.8 4.5-1.5 8-6.5 10.5" />
  </svg>
);

const SurgeonIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5e8b7b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
    <path d="M7 8.5V7a5 5 0 0 1 10 0v1.5M6 8.5h12" />
    <path d="M8 8.5V10a4 4 0 0 0 8 0V8.5" />
    <path d="M4 21c0-3.6 3.6-6 8-6s8 2.4 8 6" />
  </svg>
);

/** Phone filter: an icon and a pill that opens its options in a popup; picking one, a tap outside or Esc closes it. */
function FilterMenu({
  label,
  icon,
  value,
  avatar,
  alignEnd,
  children,
}: {
  label: string;
  icon: ReactNode;
  value?: string;
  avatar?: ReactNode;
  /** Last in the row: the popup grows to the left so it stays on screen. */
  alignEnd?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="flex min-w-0 flex-auto items-center gap-1.5">
      {icon}
      <div ref={box} className="relative min-w-0 flex-auto">
        <button
          type="button"
          className="rr-work__pill flex h-[42px] w-full items-center justify-center gap-1.5 rounded-pill px-3 font-text text-[14px] leading-5 font-medium whitespace-nowrap"
          aria-expanded={open}
          aria-label={label}
          onClick={() => setOpen((v) => !v)}
        >
          {avatar}
          <span className="min-w-0 truncate">{value}</span>
          <svg width="10" height="6" viewBox="0 0 12 8" aria-hidden="true" className={`shrink-0 ${open ? 'rotate-180' : ''}`}>
            <path d="M1 1.5 6 6.5l5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open && (
          <div
            className={`rr-work__menu absolute top-[calc(100%+8px)] z-20 flex ${alignEnd ? '-right-2.5' : '-left-2.5'} max-h-[440px] w-max flex-col items-start gap-1.5 overflow-y-auto rounded-[20px] bg-white p-2.5`}
            role="group"
            aria-label={label}
            onClick={() => setOpen(false)}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * "Работы наших хирургов" (design 2026-10-30): filters by operation and by surgeon, a 4-column grid of before/after
 * cards, "Показать ещё работы". The photos and titles come from the doctors' pages (public/<slug>/).
 */
export function Works() {
  const { ref, inView } = useInView<HTMLElement>();
  const isMobile = useIsMobile();
  const [category, setCategory] = useState<WorkCategory | 'all'>('all');
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [shown, setShown] = useState(works.pageSize);
  const [current, setCurrent] = useState(0);
  const [boxIndex, setBoxIndex] = useState<number | null>(null);
  const [atEnd, setAtEnd] = useState(false);
  const surgeonRow = useRef<HTMLDivElement>(null);

  const list = useMemo(
    () => allWorks.filter((w) => (category === 'all' || w.category === category) && (!doctorId || w.doctorId === doctorId)),
    [category, doctorId],
  );
  const visible = isMobile ? list.slice(current, current + 1) : list.slice(0, shown);

  const resetPaging = () => {
    setShown(works.pageSize);
    setCurrent(0);
  };

  useEffect(() => {
    const onOpen = (e: Event) => {
      setCategory((e as CustomEvent<WorkCategory>).detail);
      setDoctorId(null);
      resetPaging();
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener(OPEN_WORKS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_WORKS_EVENT, onOpen);
  }, [ref]);

  const onRowScroll = () => {
    const el = surgeonRow.current;
    if (el) setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  };

  const pickCategory = (id: WorkCategory | 'all') => {
    setCategory(id);
    resetPaging();
  };
  const pickDoctor = (id: string | null) => {
    setDoctorId(id);
    resetPaging();
  };

  const operationPills = works.operationFilters.map((f) => (
    <button
      key={f.id}
      type="button"
      className="rr-work__pill h-[42px] shrink-0 rounded-pill px-[18px] font-text text-[15px] leading-5 font-medium whitespace-nowrap"
      aria-pressed={category === f.id}
      onClick={() => pickCategory(f.id)}
    >
      {f.label}
    </button>
  ));
  const allSurgeonsPill = (
    <button
      type="button"
      className="rr-work__pill h-[42px] shrink-0 rounded-pill px-[18px] font-text text-[15px] leading-5 font-medium whitespace-nowrap"
      aria-pressed={doctorId === null}
      onClick={() => pickDoctor(null)}
    >
      Все хирурги
    </button>
  );
  const surgeonPills = surgeons.map((doctor) => (
    <button
      key={doctor.id}
      type="button"
      className="rr-work__pill flex h-[46px] shrink-0 items-center gap-2 rounded-pill pr-[18px] pl-[7px] font-text text-[15px] leading-5 font-medium whitespace-nowrap"
      aria-pressed={doctorId === doctor.id}
      onClick={() => pickDoctor(doctor.id)}
    >
      <DoctorAvatar doctor={doctor} size={32} />
      {shortName(doctor)}
    </button>
  ));
  const pickedDoctor = doctorId ? getDoctor(doctorId) : undefined;

  const filterTitle = `${works.operationFilters.find((f) => f.id === category)?.label} · ${
    doctorId ? shortName(getDoctor(doctorId) as Doctor) : 'все хирурги'
  }`;

  return (
    <section
      ref={ref}
      id={works.id}
      aria-labelledby="works-title"
      className="rr-section relative bg-[#f5f2ef] text-neutral-900 max-md:bg-white"
      {...revealScope(inView)}
    >
      <div className="mx-auto max-w-[1440px] px-(--sec-pad) pt-[52px] pb-[52px] max-md:pt-10 max-md:pb-10">
        <div className="flex items-end justify-between gap-10 max-md:flex-col max-md:items-start max-md:gap-4">
          <div>
            <p className="rr-eyebrow !text-[14px] max-md:hidden" {...revealItem(0)}>
              {works.eyebrow}
            </p>
            <h2
              id="works-title"
              className="mt-3 font-display text-[40px] leading-[48px] font-normal text-[#1b1919] max-md:mt-0 max-md:text-[30px] max-md:leading-9"
              {...revealItem(1)}
            >
              {works.title[0]}
              <span className="text-[#5e8b7b] max-md:text-inherit">{works.title[1]}</span>
            </h2>
            <p className="mt-3 font-text text-[18px] leading-[22px] whitespace-pre-line text-[#625f5e] max-md:text-[17px] max-md:whitespace-normal max-md:text-[#8c8784]" {...revealItem(2)}>
              {works.text}
            </p>
          </div>
          <p className="rr-work__consent inline-flex h-10 shrink-0 items-center gap-2.5 rounded-pill px-4 font-text text-[14px] leading-5 text-[#625f5e] max-md:order-first max-md:text-[13px]" {...revealItem(2)}>
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none" stroke="#5e8b7b" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 1 2 3v5.5C2 12.6 4.6 15.6 8 17c3.4-1.4 6-4.4 6-8.5V3L8 1Z" />
              <path d="m5.5 9 2 2 3-3.5" />
            </svg>
            {works.consent}
          </p>
        </div>

        {isMobile ? (
          <div className="mt-5 flex items-center gap-2.5" {...revealItem(3)}>
            <FilterMenu label="Операция" icon={ScalpelIcon} value={works.operationFilters.find((f) => f.id === category)?.label}>
              {operationPills}
            </FilterMenu>
            <FilterMenu
              label="Хирург"
              icon={SurgeonIcon}
              alignEnd
              value={pickedDoctor ? shortName(pickedDoctor) : 'Все хирурги'}
              avatar={pickedDoctor && <DoctorAvatar doctor={pickedDoctor} size={24} />}
            >
              {allSurgeonsPill}
              {surgeonPills}
            </FilterMenu>
          </div>
        ) : (
          <div className="rr-work__filters mt-8 rounded-[24px] bg-white px-6" {...revealItem(3)}>
            <div className="flex items-center gap-6 border-b border-[#ebe7e3] py-[16px]">
              <span className="w-[70px] shrink-0 font-text text-[14px] leading-5 text-[#a4a09d]">Операция</span>
              <div className="rr-work__row flex min-w-0 gap-2 overflow-x-auto" role="group" aria-label="Операция">
                {operationPills}
              </div>
            </div>
            <div className="flex items-center gap-6 py-[16px]">
              <span className="w-[70px] shrink-0 font-text text-[14px] leading-5 text-[#a4a09d]">Хирург</span>
              <div
                ref={surgeonRow}
                className={`rr-work__row flex min-w-0 flex-1 items-center gap-2 overflow-x-auto ${atEnd ? '' : 'rr-work__row--more'}`}
                role="group"
                aria-label="Хирург"
                onScroll={onRowScroll}
              >
                {allSurgeonsPill}
                {surgeonPills}
              </div>
              <button
                type="button"
                className="rr-round-btn rr-round-btn--sm shrink-0"
                aria-label="Показать других хирургов"
                disabled={atEnd}
                onClick={() => surgeonRow.current?.scrollBy({ left: 320, behavior: 'smooth' })}
              >
                <svg width="8" height="12" viewBox="0 0 8 12" aria-hidden="true">
                  <path d="M2 1.5 6.2 6 2 10.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-baseline justify-between gap-6 max-md:mt-6 max-md:flex-col max-md:gap-1" aria-live="polite">
          <h3 className="font-display text-[22px] leading-7 font-normal text-[#2e2c2c] max-md:text-[20px] max-md:leading-6">{filterTitle}</h3>
          <p className="font-text text-[14px] leading-5 text-[#a4a09d] max-md:text-[13px]">{works.hint}</p>
        </div>

        {list.length === 0 ? (
          <p className="mt-6 font-text text-[17px] leading-[22px] text-[#625f5e]">Таких работ пока нет — выберите другую операцию или хирурга.</p>
        ) : (
          <ul key={`${category}-${doctorId}`} className="rr-op-grid mt-8 grid grid-cols-4 gap-5 max-md:mt-4 max-md:grid-cols-1">
            {visible.map((work, i) => (
              <WorkCard
                key={work.id}
                work={work}
                nudgeDelay={inView && i < 4 ? NUDGE_DELAY_MS + i * 180 : undefined}
                onOpen={() => setBoxIndex(list.indexOf(work))}
              />
            ))}
          </ul>
        )}

        {isMobile
          ? list.length > 1 && (
              <MobileStepper
                className="mt-5"
                index={current}
                count={list.length}
                onStep={(dir) => setCurrent((i) => (i + dir + list.length) % list.length)}
                prevLabel="Предыдущая работа"
                nextLabel="Следующая работа"
              />
            )
          : shown < list.length && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  className="rr-work__more inline-flex h-[54px] items-center gap-3 rounded-pill px-8 font-text text-[16px] leading-5 font-medium text-[#2f4a44]"
                  onClick={() => setShown((n) => n + works.pageSize)}
                >
                  {works.moreLabel}
                  <svg width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
                    <path d="M1 1.5 6 6.5l5-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
      </div>

      {boxIndex !== null && <Lightbox list={list} index={boxIndex} onIndex={setBoxIndex} onClose={() => setBoxIndex(null)} />}
    </section>
  );
}
