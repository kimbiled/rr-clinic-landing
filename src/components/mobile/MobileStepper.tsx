import './mobile.css';

const ArrowIcon = ({ dir }: { dir: -1 | 1 }) => (
  <svg viewBox="0 0 22 16" width={22} height={16} fill="none" aria-hidden="true" className={dir < 0 ? 'rotate-180' : undefined}>
    <path d="M1 8h19M13.5 1.5 20 8l-6.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface MobileStepperProps {
  index: number;
  count: number;
  onStep: (dir: -1 | 1) => void;
  /** Accessible names of the two buttons, e.g. "Предыдущая работа" / "Следующая работа". */
  prevLabel: string;
  nextLabel: string;
  className?: string;
}

/** Phone slider controls (design 2026-10): gold outline ←, "n/N" between two gold rules, filled gold →. */
export function MobileStepper({ index, count, onStep, prevLabel, nextLabel, className }: MobileStepperProps) {
  return (
    <div className={`flex items-center gap-4 ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => onStep(-1)}
        aria-label={prevLabel}
        className="m-cases__nav m-cases__nav--prev grid size-14 shrink-0 place-items-center rounded-full"
      >
        <ArrowIcon dir={-1} />
      </button>
      <span className="h-px flex-1 bg-[#dbbb7f]" aria-hidden="true" />
      <span className="font-text text-[16px] leading-5 text-[#c9a463] tabular-nums" aria-live="polite">
        {index + 1}/{count}
      </span>
      <span className="h-px flex-1 bg-[#dbbb7f]" aria-hidden="true" />
      <button
        type="button"
        onClick={() => onStep(1)}
        aria-label={nextLabel}
        className="m-cases__nav m-cases__nav--next grid size-14 shrink-0 place-items-center rounded-full"
      >
        <ArrowIcon dir={1} />
      </button>
    </div>
  );
}
