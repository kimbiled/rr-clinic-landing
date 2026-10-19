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
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className={dir === 'left' ? '-scale-x-100' : undefined}
    >
      <path
        d="M1 9h16M10 2l7 7-7 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Figma "Carousel controls" 190×52: ← (48) · 66 px rule · → (44).
 * Enabled = filled gold disc (44 inside a 48 hit box); disabled = 48 outline ring with a gold arrow,
 * which is how the design shows "prev" at the start of the row.
 */
export function CarouselControls({ prevDisabled, nextDisabled, onPrev, onNext, label }: CarouselControlsProps) {
  return (
    <div className="team-controls relative left-px mx-auto mt-8 flex h-[52px] w-[192px] items-center" role="group" aria-label={`Навигация: ${label}`}>
      <button type="button" className="team-nav-btn" onClick={onPrev} disabled={prevDisabled} aria-label="Предыдущий врач">
        <Arrow dir="left" />
      </button>
      <span aria-hidden="true" className="mr-3.5 ml-4 h-0.5 w-[66px] rounded-full bg-[#e1b976]" />
      <button type="button" className="team-nav-btn" onClick={onNext} disabled={nextDisabled} aria-label="Следующий врач">
        <Arrow dir="right" />
      </button>
    </div>
  );
}
