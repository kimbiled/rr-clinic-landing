import { type CSSProperties, type MouseEvent } from 'react';
import { asset } from '../../data/hero';
import type { Doctor } from '../../data/types';
import { whatsappLink } from '../sections/whatsapp';
import { CARD_TEXT, TEAM_PHOTOS } from './teamData';

interface DoctorCardProps {
  doctor: Doctor;
  index: number;
  /** Called for "Подробнее" — return true when the click was handled (default link navigation is then cancelled). */
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
 * Design 2026-10-30: the Figma card photo fills the card, operation tags on top, and a frosted panel at the
 * bottom — role line, name, the full bio, two figures, then "Записаться" (WhatsApp, or a closed state) /
 * "Подробнее" (the doctor's page).
 */
export function DoctorCard({ doctor, index, onMore }: DoctorCardProps) {
  const photo = TEAM_PHOTOS[doctor.id] ?? null;
  const nameId = `team-doctor-${doctor.id}`;
  const text = CARD_TEXT[doctor.id];
  const given = [doctor.firstName, text?.patronymic].filter(Boolean).join(' ');
  const fullName = `${doctor.lastName} ${given}`;
  const bio = text?.bio ?? doctor.specialty;

  const handleMore = (event: MouseEvent<HTMLAnchorElement>) => {
    if (onMore?.(doctor)) event.preventDefault();
  };

  return (
    <li
      className="team-card relative h-[544px] w-[340px] shrink-0 snap-start overflow-hidden rounded-[24px] bg-[#f5f2f0] max-md:w-[calc(100vw-45px)]"
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

      {text && text.tags.length > 0 && (
        <ul className="absolute inset-x-[16px] top-[16px] flex gap-1.5 overflow-hidden" aria-label="Операции">
          {text.tags.map((tag) => (
            <li
              key={tag}
              className="team-card__tag shrink-0 rounded-pill px-2 py-1 font-text text-[10px] leading-3 whitespace-nowrap text-[#4f7468]"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div className="team-card__panel absolute inset-x-[16px] bottom-[16px] rounded-[20px] p-4">
        {text?.role && <p className="font-text text-[12px] leading-4 text-[#5e8b7b]">{text.role}</p>}
        <h3 id={nameId} className="mt-2 font-display text-[17px] leading-[20px] font-normal tracking-[-0.01em] text-[#1b1919]">
          {doctor.lastName}
          <br />
          {given}
        </h3>

        <p className="mt-2.5 h-[48px] overflow-hidden font-text text-[12px] leading-4 text-[#625f5e]">{bio}</p>

        {text?.stats && (
          <dl className="mt-2.5 flex gap-5">
            {text.stats.map((stat) => (
              <div key={stat.label} className="flex min-w-0 flex-col">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="order-first font-display text-[15px] leading-5 text-[#1b1919]">{stat.value}</dd>
                <dd className="font-text text-[11px] leading-[14px] whitespace-nowrap text-[#7c7876]" aria-hidden="true">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          {text?.bookingClosed ? (
            <span className="team-card__btn team-card__btn--closed">Запись закрыта</span>
          ) : (
            <a
              {...whatsappLink(`Здравствуйте! Хочу записаться на консультацию к врачу: ${fullName}`)}
              data-analytics-id={`doctor_booking_${doctor.id}`}
              draggable={false}
              className="team-card__btn team-card__btn--primary"
              aria-label={`Записаться к врачу: ${fullName}`}
            >
              Записаться
            </a>
          )}
          <a
            href={doctor.href || '#doctors'}
            onClick={handleMore}
            draggable={false}
            className="team-card__btn team-card__btn--outline"
            aria-label={`Подробнее о враче: ${fullName}`}
          >
            Подробнее
          </a>
        </div>
      </div>
    </li>
  );
}
