import type { CSSProperties, MouseEvent } from 'react';
import { asset } from '../../data/hero';
import type { Doctor } from '../../data/types';
import { whatsappLink } from '../sections/whatsapp';
import { CARD_TEXT, TEAM_PHOTOS } from './teamData';

interface DoctorCardProps {
  doctor: Doctor;
  index: number;
  /** Called for "О враче" — return true when the click was handled (default link navigation is then cancelled). */
  onMore?: (doctor: Doctor) => boolean;
}

/** Head-and-shoulders outline shown until the doctor's card photo arrives. */
function Silhouette() {
  return (
    <svg viewBox="0 0 300 400" className="absolute inset-x-0 top-0 h-[400px] w-full" aria-hidden="true">
      <circle cx="150" cy="190" r="56" fill="#e9e3dc" />
      <path d="M30 400c4-84 56-134 120-134s116 50 120 134z" fill="#e9e3dc" />
    </svg>
  );
}

/**
 * Design 2026-10-28: 300×562 card — the Figma card photo (arches + doctor) fills it, a frosted name plate
 * overlaps the photo's lower edge, and "Записаться" (WhatsApp) / "О враче" (the doctor's page) sit below.
 */
export function DoctorCard({ doctor, index, onMore }: DoctorCardProps) {
  const photo = TEAM_PHOTOS[doctor.id] ?? null;
  const nameId = `team-doctor-${doctor.id}`;
  const text = CARD_TEXT[doctor.id] ?? {};
  const given = [doctor.firstName, text.patronymic].filter(Boolean).join(' ');
  const fullName = `${doctor.lastName} ${given}`;

  const handleMore = (event: MouseEvent<HTMLAnchorElement>) => {
    if (onMore?.(doctor)) event.preventDefault();
  };

  return (
    <li
      className="team-card relative h-[562px] w-[300px] shrink-0 snap-start overflow-hidden rounded-[24px] bg-[#f5f2f0]"
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
          className="team-card__img absolute inset-0 size-full object-cover object-top"
        />
      ) : (
        <Silhouette />
      )}

      <div className="absolute inset-x-5 bottom-5 flex flex-col gap-3">
        <div className="team-card__plate h-[108px] rounded-[16px] px-5 pt-[18px] pb-4">
          <h3 id={nameId} className="font-display text-[16px] leading-[1.2] font-normal tracking-[-0.02em] text-[#1b1919]">
            {doctor.lastName}
            <br />
            {given}
          </h3>
          <p className="mt-2 line-clamp-2 font-text text-[13px] leading-[1.15] text-[#625f5e]">
            {text.note ?? doctor.specialty}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a
            {...whatsappLink(`Здравствуйте! Хочу записаться на консультацию к врачу: ${fullName}`)}
            draggable={false}
            className="team-card__btn team-card__btn--primary"
            aria-label={`Записаться к врачу: ${fullName}`}
          >
            Записаться
          </a>
          <a
            href={doctor.href || '#doctors'}
            onClick={handleMore}
            draggable={false}
            className="team-card__btn team-card__btn--outline"
            aria-label={`О враче: ${fullName}`}
          >
            О враче
          </a>
        </div>
      </div>
    </li>
  );
}
