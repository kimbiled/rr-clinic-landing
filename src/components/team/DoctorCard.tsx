import type { CSSProperties, MouseEvent } from 'react';
import { asset } from '../../data/hero';
import type { Doctor } from '../../data/types';
import { CARD_TEXT, TEAM_PHOTOS } from './teamData';

interface DoctorCardProps {
  doctor: Doctor;
  index: number;
  /** Called for "Подробнее" — return true when the click was handled (default link navigation is then cancelled). */
  onMore?: (doctor: Doctor) => boolean;
}

function photoPosition(doctor: Doctor): string | undefined {
  const f = doctor.photo?.framing;
  if (!f) return undefined; // cut-outs: full height, bottom-centred (object-contain object-bottom)
  return `${((f.x + f.w / 2) * 100).toFixed(1)}% ${((f.y + f.h / 2) * 100).toFixed(1)}%`;
}

/** Head-and-shoulders outline shown until the doctor's cut-out photo arrives. */
function Silhouette() {
  return (
    <svg viewBox="0 0 296 300" className="absolute inset-x-0 bottom-0 h-[300px] w-full" aria-hidden="true">
      <circle cx="148" cy="112" r="50" fill="#e9e3dc" />
      <path d="M38 300c4-74 50-118 110-118s106 44 110 118z" fill="#e9e3dc" />
    </svg>
  );
}

/** Design 2026-10: 296×375 beige card, photo bottom-aligned, ↗ link top-right, frosted name plate at the bottom. */
export function DoctorCard({ doctor, index, onMore }: DoctorCardProps) {
  const cutout = TEAM_PHOTOS[doctor.id];
  const photo = cutout ?? doctor.photo;
  const nameId = `team-doctor-${doctor.id}`;
  const text = CARD_TEXT[doctor.id] ?? {};
  const given = [doctor.firstName, text.patronymic].filter(Boolean).join(' ');

  const handleMore = (event: MouseEvent<HTMLAnchorElement>) => {
    if (onMore?.(doctor)) event.preventDefault();
  };

  return (
    <li
      className="team-card relative h-[375px] w-[296px] shrink-0 snap-start overflow-hidden rounded-[20px] bg-[#f5f2ef]"
      style={{ '--i': index } as CSSProperties}
      aria-labelledby={nameId}
    >
      {photo ? (
        <img
          src={asset(photo.src)}
          width={photo.width}
          height={photo.height}
          alt={photo.alt ?? doctor.name}
          loading="lazy"
          decoding="async"
          draggable={false}
          className={`team-card__img absolute inset-0 size-full ${cutout ? 'object-contain object-bottom' : 'object-cover object-top'}`}
          style={cutout ? undefined : { objectPosition: photoPosition(doctor) }}
        />
      ) : (
        <Silhouette />
      )}

      {/* The ↗ button is the card's link; its ::after stretches over the whole card. */}
      <a
        href={doctor.href || '#doctors'}
        onClick={handleMore}
        draggable={false}
        className="team-card__more absolute top-5 right-5 grid size-10 place-items-center rounded-[10px]"
        aria-label={`Подробнее о враче: ${doctor.name}`}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="team-card__arrow">
          <path d="M3.5 10.5l7-7M4.5 3.5h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>

      <div className="team-card__plate pointer-events-none absolute inset-x-[14px] bottom-[14px] rounded-[16px] px-6 pt-3.5 pb-4">
        <h3 id={nameId} className="font-display text-[16px] leading-[1.2] font-medium tracking-[-0.02em] text-[#132d2d]">
          {doctor.lastName}
          <br />
          {given}
        </h3>
        <p className="mt-2 line-clamp-3 font-text text-[14px] leading-[1.1] text-[#625f5e]">{text.note ?? doctor.specialty}</p>
      </div>
    </li>
  );
}
