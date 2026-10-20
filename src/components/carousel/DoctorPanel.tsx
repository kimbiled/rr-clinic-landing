// Info under the lifted card (Figma hover card): avatar + surgeon, then the case title. It sits on
// the lift's glass frame (carousel.css .cc-lift__frame), so the panel itself has no fill.
// Fixed height (GEOM.PANEL_H) — the frame and shadow are sized from it.
import { asset } from '../../data/hero';
import type { Case, Doctor } from '../../data/types';
import { GEOM, doctorName, initials } from './geometry';

interface Props {
  /** Case currently shown by the lift. */
  item: Case;
  doctor: Doctor | undefined;
}

export function DoctorPanel({ item, doctor }: Props) {
  const avatar = doctor?.avatar ?? doctor?.photo ?? null;

  return (
    <div
      data-cc-panel=""
      className="cc-panel absolute left-0 top-[220px] w-[200px] overflow-hidden font-text text-white"
      style={{ height: GEOM.PANEL_H }}
    >
      <div className="cc-panel__inner flex flex-col gap-2.5 pt-3">
        {doctor && (
          <div className="flex h-[22px] min-w-0 items-center gap-2 text-[11px]/[14px] font-normal text-white/85">
            {avatar ? (
              <span className="size-[22px] flex-none overflow-hidden rounded-full">
                <img src={asset(avatar.src)} alt="" width={22} height={22} decoding="async" draggable={false} className="size-full object-cover" />
              </span>
            ) : (
              <span className="grid size-[22px] flex-none place-items-center rounded-full bg-gold-400/20 text-[9px] leading-none tracking-[0.02em] text-gold-400">
                {initials(doctor)}
              </span>
            )}
            <span className="truncate">{doctorName(doctor)}</span>
          </div>
        )}
        <p className="m-0 line-clamp-2 text-[14px]/[17px] font-normal text-white/95">{item.title}</p>
      </div>
    </div>
  );
}
