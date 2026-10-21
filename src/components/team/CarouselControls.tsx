interface CarouselControlsProps {
  prevDisabled: boolean;
  nextDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
  label: string;
}

function Arrow({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={dir === 'left' ? '-scale-x-100' : undefined}
    >
      <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Design 2026-10: two 46 px outline circles (← →) at the right end of the tabs row.
 * Edge buttons use aria-disabled, not disabled.
 */
export function CarouselControls({ prevDisabled, nextDisabled, onPrev, onNext, label }: CarouselControlsProps) {
  // R3-4b: `disabled` on the focused button would drop focus to <body>; aria-disabled keeps it focusable
  // (and still announced as unavailable) while the click becomes a no-op.
  const guard = (disabled: boolean, action: () => void) => () => {
    if (!disabled) action();
  };

  return (
    <div className="flex items-center gap-[18px]" role="group" aria-label={`Навигация: ${label}`}>
      <button type="button" className="team-nav-btn" onClick={guard(prevDisabled, onPrev)} aria-disabled={prevDisabled} aria-label="Предыдущий врач">
        <Arrow dir="left" />
      </button>
      <button type="button" className="team-nav-btn" onClick={guard(nextDisabled, onNext)} aria-disabled={nextDisabled} aria-label="Следующий врач">
        <Arrow dir="right" />
      </button>
    </div>
  );
}
