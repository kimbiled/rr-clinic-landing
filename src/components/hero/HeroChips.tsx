import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { asset, getDoctor } from '../../data/hero';
import type { Doctor } from '../../data/types';
import { caseCount, doctorName, plural } from '../surgeon-menu/menuTrigger';
import { useHero } from './HeroContext';

const CHIP =
  'inline-flex h-12 items-center rounded-md bg-glass-light backdrop-blur-[12px] font-text text-[14px] leading-[14px] ' +
  'font-medium tracking-[-0.21px] whitespace-nowrap text-white';

/** 2GIS rating chip: a link to the clinic's 2GIS card when the data has one, plain text otherwise. */
function RatingChip({ href, children }: { href: string | null; children: ReactNode }) {
  const className = `${CHIP} ml-2 gap-1.5 pr-[13px] pl-3`;
  if (!href) {
    return (
      <p className={className} data-reveal="chip">
        {children}
      </p>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-reveal="chip"
      data-interactive=""
      className={`${className} cursor-pointer transition-colors duration-200 hover:bg-white/30`}
    >
      {children}
    </a>
  );
}

/** m-12: the measured render puts the chip pair ~5 px left of the column centre. */
const ROW_OFFSET = -5;
const FILTER_GAP = 8;

/**
 * Chips row (Figma 1620:4669): location + 2GIS rating, plus the "selected surgeon" reset chip.
 * m-3: when the reset chip shows, the whole group re-centres with a transform (no layout shift).
 */
export function HeroChips({ resetFocusRef }: { resetFocusRef: RefObject<HTMLElement | null> }) {
  const { data, selectedDoctorId, selectDoctor } = useHero();
  const { clinic } = data;
  const rating = clinic.rating;
  const ratingValue = rating.value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const ratingSource = rating.source === '2GIS' ? '2ГИС' : rating.source;

  const doctor = getDoctor(selectedDoctorId);
  // Keep the last doctor so the chip can fade out with its label intact.
  const [lastDoctor, setLastDoctor] = useState<Doctor | undefined>(doctor);
  if (doctor && doctor !== lastDoctor) setLastDoctor(doctor);
  const shown = doctor ?? lastDoctor;

  const chipRef = useRef<HTMLButtonElement>(null);
  const [chipWidth, setChipWidth] = useState(0);
  useLayoutEffect(() => {
    // offsetWidth = unscaled stage px (getBoundingClientRect would include the stage scale)
    setChipWidth(chipRef.current?.offsetWidth ?? 0);
  }, [shown?.id]);

  const shift = doctor ? (chipWidth + FILTER_GAP) / 2 : 0;
  const count = shown ? caseCount(shown.id) : 0;
  const name = shown ? doctorName(shown) : '';

  const onReset = () => {
    // m-2: the chip hides itself, so hand keyboard focus to the CTA that opens the menu.
    if (document.activeElement === chipRef.current) resetFocusRef.current?.focus();
    selectDoctor(null);
  };

  return (
    <div
      data-cc-keepout="" /* lifted case cards never overlap this row (carousel controller) */
      className="rr-chips relative flex h-12 items-center justify-center"
      style={{ transform: `translateX(${ROW_OFFSET - shift}px)` } as CSSProperties}
    >
      <p className={`${CHIP} gap-2 pr-[13px] pl-3`} data-reveal="chip">
        <img src={asset('assets/icons/location.svg')} width={12} height={13} alt="" className="mx-0.5 h-[13.33px] w-3" />
        <span>{clinic.location}</span>
      </p>

      <RatingChip href={rating.url}>
        <img src={asset(rating.logo.src)} width={26} height={26} alt="" className="size-[26px] rounded-sm" />
        <span className="flex flex-col items-start gap-[3px]" aria-hidden="true">
          <span className="flex items-baseline gap-1">
            <span className="font-display text-[14px] leading-[14px] font-medium">{ratingValue}</span>
            <span className="text-[9px] leading-[9px] opacity-80">({rating.count})</span>
          </span>
          <span className="flex gap-[0.9px]">
            {[1, 2, 3, 4, 5].map((i) => (
              <img key={i} src={asset(`assets/icons/star-${i}.svg`)} width={7} height={7} alt="" className="size-[7.3px]" />
            ))}
          </span>
        </span>
        <span className="sr-only">
          {`Рейтинг в ${ratingSource}: ${ratingValue} из ${rating.max ?? 5}, ${rating.count} ${plural(rating.count, 'отзыв', 'отзыва', 'отзывов')}`}
          {rating.url && ' (открывается в новой вкладке)'}
        </span>
      </RatingChip>

      <button
        ref={chipRef}
        type="button"
        data-interactive=""
        data-hidden={doctor ? undefined : ''}
        className={
          `${CHIP} rr-filter-chip absolute top-0 cursor-pointer gap-2 pr-2.5 pl-4 ` +
          'bg-gold-950/45 shadow-[inset_0_0_0_1px_rgb(215_165_97/0.55)] ' +
          'hover:bg-gold-950/65 hover:shadow-[inset_0_0_0_1px_var(--color-gold-400)]'
        }
        style={{ left: `calc(100% + ${FILTER_GAP}px)` }}
        onClick={onReset}
        aria-label={
          shown
            ? count
              ? `Показаны кейсы врача ${name}. Сбросить выбор`
              : `Выбран врач ${name}, кейсы скоро появятся. Сбросить выбор`
            : undefined
        }
      >
        <span>{name}</span>
        {shown && !count && <span className="font-normal text-gold-400">· Кейсы скоро</span>}
        <span className="grid size-6 place-items-center rounded-full bg-white/15 text-base leading-none" aria-hidden="true">
          ×
        </span>
      </button>

      <p className="sr-only" aria-live="polite">
        {doctor ? (count ? `Показаны кейсы врача ${name}` : `Врач ${name}: кейсы скоро появятся`) : ''}
      </p>
    </div>
  );
}
