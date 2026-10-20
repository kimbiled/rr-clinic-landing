// One card of the strip (§4). `primary` = the single focusable copy; the duplicates are aria-hidden.
// `k` = index inside the track (left = k × PITCH, stage px).
import { memo, useId } from 'react';
import type { Case, Doctor } from '../../data/types';
import { BeforeAfter } from './BeforeAfter';
import { GEOM, baSlidable, cardKey, doctorName } from './geometry';
import { PosterOnly, VideoCase } from './VideoCase';

interface MediaProps {
  item: Case;
  baKey: string;
  eager: boolean;
  interactive?: boolean;
  active?: boolean;
  reducedMotion?: boolean;
}

export function CaseMedia({ item, baKey, eager, interactive, active, reducedMotion }: MediaProps) {
  if (item.type === 'beforeAfter') {
    if (!(item.before || item.pair) || !(item.after || item.pair)) return <PosterOnly item={item} eager={eager} />;
    return <BeforeAfter item={item} baKey={baKey} eager={eager} interactive={interactive} />;
  }
  if (item.type === 'video') return <VideoCase item={item} eager={eager} active={active} reducedMotion={reducedMotion} />;
  return <PosterOnly item={item} eager={eager} />;
}

interface CardProps {
  item: Case;
  doctor: Doctor | undefined;
  k: number;
  primary: boolean;
  /** Shown by its lift in the overlay → hidden here (keeps keyboard focus). */
  lifted: boolean;
  /** Surgeon filter active and this case belongs to another doctor. */
  dim: boolean;
  /** Selected surgeon's case — emphasised. */
  match: boolean;
}

export const CaseCard = memo(function CaseCard({ item, doctor, k, primary, lifted, dim, match }: CardProps) {
  const hintId = useId();
  const name = doctorName(doctor);
  const isBa = baSlidable(item); // a static 50/50 split is not a slider
  const hints = [name && `Хирург: ${name}.`, isBa && 'Стрелки влево и вправо сдвигают границу «до/после».']
    .filter(Boolean)
    .join(' ');
  // N2-6: a B/A card's tab stop IS the slider (APG slider: focus on role=slider, value announced).
  // aria-valuenow/-text are kept current by the controller (writePos). Video cards stay a group.
  const a11y = !primary
    ? { 'aria-hidden': true as const }
    : isBa
      ? {
          tabIndex: 0,
          role: 'slider',
          'aria-roledescription': 'сравнение до и после',
          'aria-label': `Кейс: ${item.title}`,
          'aria-orientation': 'horizontal' as const,
          'aria-valuemin': 4,
          'aria-valuemax': 96,
          'aria-valuenow': 50,
          'aria-valuetext': 'До 50%, после 50%',
          'aria-describedby': hints ? hintId : undefined,
        }
      : { tabIndex: 0, role: 'group', 'aria-label': `Кейс: ${item.title}`, 'aria-describedby': hints ? hintId : undefined };

  return (
    <div
      data-cc-k={k}
      data-cc-card=""
      data-lifted={lifted ? '' : undefined}
      data-dim={dim ? '' : undefined}
      data-match={match ? '' : undefined}
      className="cc-card pointer-events-auto absolute top-0 h-[220px] w-[200px] select-none overflow-hidden bg-[#4a3624] [-webkit-tap-highlight-color:transparent]"
      style={{ left: k * GEOM.PITCH }}
      {...a11y}
    >
      {/* m-13: every strip image is eager — 8 unique URLs, cached, and never blank after a resize. */}
      <CaseMedia item={item} baKey={cardKey(k)} eager />
      {primary && hints && (
        <span id={hintId} className="sr-only">
          {hints}
        </span>
      )}
    </div>
  );
});
