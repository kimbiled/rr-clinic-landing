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
  /** Fills its grid column at the carousel card's proportions (the surgeons page) instead of 340 × 544. */
  fluid?: boolean;
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
export function DoctorCard({ doctor, index, onMore, fluid = false }: DoctorCardProps) {
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
      className={`team-card relative overflow-hidden rounded-[24px] bg-[#f5f2f0] ${
        fluid ? 'aspect-[340/544] w-full' : 'h-[544px] w-[340px] shrink-0 snap-start max-md:h-[514px] max-md:w-[calc(100vw-45px)]'
      }`}
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
        <ul className="absolute inset-x-[16px] top-[16px] flex flex-wrap gap-1.5 overflow-hidden max-md:flex-nowrap" aria-label="Операции">
          {text.tags.map((tag) => (
            <li
              key={tag}
              className="team-card__tag shrink-0 rounded-pill px-2 py-1 font-text text-[12px] leading-4 whitespace-nowrap text-[#4f7468] max-md:text-[10px] max-md:leading-3"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div className="team-card__panel absolute inset-x-[16px] bottom-[16px] rounded-[20px] p-4">
        {text?.role && <p className="font-text text-[14px] leading-[18px] text-[#5e8b7b]">{text.role}</p>}
        <h3 id={nameId} className="mt-2 font-display text-[19px] leading-[23px] font-normal tracking-[-0.01em] text-[#1b1919] max-md:text-[18px] max-md:leading-[22px]">
          {doctor.lastName}
          <br />
          {given}
        </h3>

        <p className="mt-2.5 min-h-[54px] overflow-hidden font-text text-[14px] leading-[18px] text-[#625f5e] max-md:line-clamp-3 max-md:h-[54px]">{bio}</p>

        {text?.stats && (
          <dl className="mt-2.5 flex gap-3 max-md:gap-5">
            {text.stats.map((stat) => (
              <div key={stat.label} className="flex min-w-0 flex-col">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="order-first font-display text-[17px] leading-5 text-[#1b1919]">{stat.value}</dd>
                <dd className="font-text text-[13px] leading-4 whitespace-nowrap text-[#7c7876]" aria-hidden="true">
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
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="mr-1.5 md:hidden">
                <path d="M9 1.6a7.4 7.4 0 0 0-6.4 11.1L1.6 16.4l3.8-1a7.4 7.4 0 1 0 3.6-13.8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M6.3 5.5c.2-.4.4-.4.6-.4h.4c.2 0 .3 0 .5.4l.6 1.4c0 .2 0 .3-.1.4l-.4.5c-.1.1-.2.3 0 .5.3.5.7 1 1.1 1.4.5.4 1 .7 1.5.9.2.1.4 0 .5-.1l.5-.6c.1-.2.3-.2.5-.1l1.3.6c.2.1.3.2.3.3 0 .2 0 .8-.4 1.2-.4.4-1.1.6-1.6.5-.9-.1-2.2-.6-3.3-1.6-1-.9-1.7-2-2-2.9-.2-.8 0-1.6.5-2.4Z" fill="currentColor" />
              </svg>
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
