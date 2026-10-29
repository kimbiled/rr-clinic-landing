import { useId, useState, type CSSProperties, type MouseEvent } from 'react';
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
 * Design 2026-10-29 (desktop and phones): the Figma card photo fills the card, operation tags on top, and a
 * frosted panel at the bottom — role line, name, a one-line bio that ⌄ expands (with the doctor's figures),
 * then "Записаться" (WhatsApp) / "Подробнее" (the doctor's page).
 */
export function DoctorCard({ doctor, index, onMore }: DoctorCardProps) {
  const [expanded, setExpanded] = useState(false);
  const bioId = useId();
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
      className="team-card relative h-[466px] w-[300px] shrink-0 snap-start overflow-hidden rounded-[24px] bg-[#f5f2f0] max-md:h-[509px] max-md:w-[calc(100vw-45px)]"
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
        <ul className="absolute inset-x-3 top-3 flex gap-1 overflow-hidden" aria-label="Операции">
          {text.tags.map((tag) => (
            <li
              key={tag}
              className="team-card__tag shrink-0 rounded-pill px-[7px] py-1 font-text text-[9px] leading-3 whitespace-nowrap text-[#625f5e]"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div className="team-card__panel absolute inset-x-3 bottom-3 rounded-[20px] p-4">
        {text?.role && <p className="font-text text-[12px] leading-4 text-[#5e8b7b]">{text.role}</p>}
        <h3 id={nameId} className="mt-1.5 font-display text-[16px] leading-[1.2] font-normal tracking-[-0.02em] text-[#1b1919]">
          {doctor.lastName}
          <br />
          {given}
        </h3>

        <div className="mt-2.5 flex items-start gap-2">
          <p
            id={bioId}
            className={`min-w-0 flex-1 font-text text-[12px] leading-[1.35] text-[#625f5e] ${expanded ? '' : 'truncate'}`}
          >
            {bio}
          </p>
          <button
            type="button"
            className="team-card__toggle -mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[#8c8784]"
            aria-expanded={expanded}
            aria-controls={bioId}
            aria-label={expanded ? 'Свернуть описание' : 'Показать описание полностью'}
            onClick={() => setExpanded((v) => !v)}
          >
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {expanded && text?.stats && (
          <dl className="mt-3 flex gap-5">
            {text.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="order-first font-display text-[16px] leading-5 text-[#1b1919]">{stat.value}</dd>
                <dd className="font-text text-[11px] leading-4 text-[#7c7876]" aria-hidden="true">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <a
            {...whatsappLink(`Здравствуйте! Хочу записаться на консультацию к врачу: ${fullName}`)}
            draggable={false}
            className="team-card__btn team-card__btn--primary gap-1.5"
            aria-label={`Записаться к врачу: ${fullName}`}
          >
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M9 1.6a7.4 7.4 0 0 0-6.4 11.1L1.6 16.4l3.8-1a7.4 7.4 0 1 0 3.6-13.8Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            Записаться
          </a>
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
