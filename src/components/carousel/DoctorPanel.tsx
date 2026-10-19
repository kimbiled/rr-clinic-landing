// Dark info panel under the lifted card (§5.1 Figma 200×82 + §5.3 avatar / "his cases" row).
// Heights are fixed: 82 px (Figma) without thumbs, 130 px with them (QA m-4).
import { asset } from '../../data/hero';
import type { Case, Doctor } from '../../data/types';
import { GEOM, doctorName, initials, pluralRu, thumbImage } from './geometry';

interface Props {
  /** Case currently shown by the lift (follows thumb swaps). */
  item: Case;
  doctor: Doctor | undefined;
  doctorCases: readonly Case[];
}

export function panelHeight(doctor: Doctor | undefined, doctorCases: readonly Case[]): number {
  return doctor && doctorCases.length > 1 ? GEOM.PANEL_H_THUMBS : GEOM.PANEL_H;
}

export function DoctorPanel({ item, doctor, doctorCases }: Props) {
  const avatar = doctor?.avatar ?? doctor?.photo ?? null;
  const height = panelHeight(doctor, doctorCases);
  const showThumbs = height === GEOM.PANEL_H_THUMBS && doctor;
  const shown = doctorCases.slice(0, 3);
  const rest = doctorCases.length - shown.length;
  const more = rest > 0 ? `Ещё ${rest} ${pluralRu(rest, 'кейс', 'кейса', 'кейсов')}` : 'Все кейсы';

  return (
    <div
      data-cc-panel=""
      className="cc-panel absolute left-0 top-[220px] w-[200px] overflow-hidden bg-[#2b1f12] font-text font-normal text-white"
      style={{ height }}
    >
      <div className="cc-panel__inner flex flex-col px-3 pt-[14px]">
        <p className="m-0 line-clamp-2 min-h-9 text-[17px]/[18px]">{item.title}</p>

        {doctor && (
          <div className="mt-1.5 flex h-[18px] min-w-0 items-center gap-2 text-[14px]/[16px] text-neutral-200/80">
            {avatar ? (
              <span className="size-[18px] flex-none overflow-hidden rounded-full">
                <img src={asset(avatar.src)} alt="" width={18} height={18} decoding="async" draggable={false} className="size-full object-cover" />
              </span>
            ) : (
              <span className="grid size-[18px] flex-none place-items-center rounded-full bg-gold-400/20 text-[8px] leading-none tracking-[0.02em] text-gold-400">
                {initials(doctor)}
              </span>
            )}
            <span className="truncate">{doctorName(doctor)}</span>
          </div>
        )}

        {showThumbs && (
          <div className="mt-2 flex items-center gap-1.5">
            {shown.map((c) => {
              const img = thumbImage(c);
              const current = c.id === item.id;
              return (
                <span
                  key={c.id}
                  data-thumb={c.id}
                  title={c.title}
                  data-current={current ? '' : undefined}
                  className="size-9 flex-none cursor-pointer overflow-hidden rounded-[4px] opacity-70 outline outline-1 -outline-offset-1 outline-transparent transition-[opacity,outline-color] duration-200 ease-out hover:opacity-100 motion-reduce:transition-none data-current:opacity-100 data-current:outline-gold-400"
                >
                  {img && (
                    <img src={asset(img.src)} alt="" decoding="async" draggable={false} className="pointer-events-none size-full max-w-none object-cover" />
                  )}
                </span>
              );
            })}
            <a
              href={doctor.href || '#doctors'}
              tabIndex={-1}
              data-doctor-link={doctor.id}
              className="group/more ml-auto whitespace-nowrap text-[12px]/[14px] text-gold-400 no-underline"
            >
              {more}{' '}
              <span aria-hidden="true" className="inline-block transition-transform duration-200 ease-out group-hover/more:translate-x-[3px] motion-reduce:transition-none motion-reduce:group-hover/more:translate-x-0">
                →
              </span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
