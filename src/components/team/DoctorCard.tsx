import type { CSSProperties, MouseEvent } from 'react';
import { asset } from '../../data/hero';
import type { Doctor } from '../../data/types';

interface DoctorCardProps {
  doctor: Doctor;
  index: number;
  /** Called for "Подробнее" — return true when the click was handled (default link navigation is then cancelled). */
  onMore?: (doctor: Doctor) => boolean;
}

function photoPosition(doctor: Doctor): string | undefined {
  const f = doctor.photo?.framing;
  if (!f) return undefined;
  return `${((f.x + f.w / 2) * 100).toFixed(1)}% ${((f.y + f.h / 2) * 100).toFixed(1)}%`;
}

export function DoctorCard({ doctor, index, onMore }: DoctorCardProps) {
  const { photo } = doctor;
  const nameId = `team-doctor-${doctor.id}`;

  const handleMore = (event: MouseEvent<HTMLAnchorElement>) => {
    if (onMore?.(doctor)) event.preventDefault();
  };

  return (
    <li
      className="team-card w-[232px] shrink-0 snap-start"
      style={{ '--i': index } as CSSProperties}
      aria-labelledby={nameId}
    >
      <div className="relative h-[300px] w-[232px] overflow-hidden rounded-[24px] bg-[#e9e4df]">
        {photo ? (
          <img
            src={asset(photo.src)}
            width={photo.width}
            height={photo.height}
            alt={photo.alt ?? doctor.name}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="team-card__img absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: photoPosition(doctor) }}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-text text-[16px] leading-5 text-[#7f7369]">
            Фото врача
          </span>
        )}
      </div>

      <h3
        id={nameId}
        className="mt-3 line-clamp-2 h-[52px] font-display text-[20px] leading-[26px] font-normal tracking-[0.01em] text-neutral-900"
      >
        {doctor.name}
      </h3>

      <p className="mt-3 line-clamp-4 h-[96px] font-text text-[20px] leading-6 tracking-[-0.01em] text-[#7c7876]">
        {doctor.specialty}
      </p>

      <a
        href={doctor.href || '#doctors'}
        onClick={handleMore}
        draggable={false}
        className="team-card__more mt-3 flex h-5 w-fit items-center gap-1.5 rounded-sm font-text text-[18px] leading-5 font-medium text-[#2f675f]"
        aria-label={`Подробнее о враче: ${doctor.name}`}
      >
        Подробнее
        <span aria-hidden="true" className="team-card__arrow inline-block">
          →
        </span>
      </a>
    </li>
  );
}
