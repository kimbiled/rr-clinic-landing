import { useEffect, useRef, useState } from 'react';
import { asset, getDoctor, heroData } from '../../data/hero';
import { reviews } from '../../data/landing';
import { revealItem, revealScope, useInView } from './useInView';
import { DoctorAvatar } from './Works';
import './sections.css';

/** Card width + gap: the ← → step. */
const STEP = 300;

/** "1 оценка", "264 оценки", "25 оценок". */
function ratingsLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} оценка`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} оценки`;
  return `${n} оценок`;
}

const Stars = () => (
  <span className="flex gap-1" aria-hidden="true">
    {[0, 1, 2, 3, 4].map((i) => (
      <svg key={i} width="14" height="14" viewBox="0 0 14 14">
        <path d="m7 .8 1.9 3.9 4.3.6-3.1 3 .7 4.3L7 10.6l-3.8 2 .7-4.3-3.1-3 4.3-.6L7 .8Z" fill="#dba74f" />
      </svg>
    ))}
  </span>
);

/**
 * "Пациенты о RR Clinic" (design 2026-10-30): heading with the 2GIS rating (the licence card joins it once the data
 * is in), then a row of video reviews with a progress bar. A card opens the review on Instagram.
 */
export function Reviews() {
  const { ref, inView } = useInView<HTMLElement>();
  const row = useRef<HTMLUListElement>(null);
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });
  const { rating } = heroData.clinic;
  const { license } = reviews;

  const measure = () => {
    const el = row.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress((el.scrollLeft + el.clientWidth) / el.scrollWidth);
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 });
  };

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <section
      ref={ref}
      id={reviews.id}
      aria-labelledby="reviews-title"
      className="rr-section relative bg-white text-neutral-900"
      {...revealScope(inView)}
    >
      <div className="mx-auto max-w-[1440px] px-(--sec-pad) pt-[52px] pb-[60px] max-md:pt-10 max-md:pb-10">
        <div className="flex items-start justify-between gap-6 max-md:flex-col">
          <div className="min-w-0">
            <p className="rr-eyebrow !text-[14px] max-md:!text-[11px]" {...revealItem(0)}>
              {reviews.eyebrow}
            </p>
            <h2
              id="reviews-title"
              className="mt-3 font-display text-[40px] leading-[48px] font-normal tracking-[-0.02em] text-[#1b1919] max-md:text-[28px] max-md:leading-[34px]"
              {...revealItem(1)}
            >
              {reviews.title[0]}
              <span className="text-[#5e8b7b]">{reviews.title[1]}</span>
            </h2>
            <p className="mt-3 font-text text-[18px] leading-[22px] whitespace-pre-line text-[#625f5e] max-md:text-[14px] max-md:leading-[18px] max-md:whitespace-normal" {...revealItem(2)}>
              {reviews.text}
            </p>
          </div>

          <div className="flex shrink-0 gap-5 max-md:w-full max-md:flex-col max-md:gap-3" {...revealItem(2)}>
            <a
              href={rating.url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="rr-rating flex h-[134px] w-[343px] items-center gap-5 rounded-[24px] px-7 max-md:h-[116px] max-md:w-full max-md:px-5"
              aria-label={`Рейтинг RR Clinic в 2ГИС: ${String(rating.value).replace('.', ',')} из ${rating.max}, ${ratingsLabel(rating.count)}`}
            >
              <img src={asset(rating.logo.src)} width={64} height={64} alt="" loading="lazy" decoding="async" className="size-16 shrink-0" />
              <span className="min-w-0">
                <span className="block font-text text-[14px] leading-[18px] text-[#625f5e]">Рейтинг RR Clinic в 2ГИС</span>
                <span className="mt-1 flex items-center gap-3">
                  <span className="font-display text-[36px] leading-[42px] text-[#2e2c2c]">{String(rating.value).replace('.', ',')}</span>
                  <span className="flex flex-col gap-1">
                    <Stars />
                    <span className="font-text text-[14px] leading-4 text-[#8c8784]">{ratingsLabel(rating.count)}</span>
                  </span>
                </span>
              </span>
            </a>

            {license && (
              <div className="rr-license relative flex h-[134px] w-[343px] flex-col justify-center overflow-hidden rounded-[24px] px-7 max-md:w-full max-md:px-5">
                <p className="font-text text-[15px] leading-5 text-[#2e2c2c]">Государственная лицензия</p>
                <p className="mt-1 font-display text-[24px] leading-8 text-[#2e2c2c]">№ {license.number}</p>
                <p className="mt-1 font-text text-[15px] leading-5 text-[#625f5e]">от {license.date}</p>
                <img
                  src={asset(license.image.src)}
                  width={license.image.width}
                  height={license.image.height}
                  alt={license.image.alt}
                  loading="lazy"
                  decoding="async"
                  className="absolute top-5 -right-6 w-[116px] rounded-[4px] shadow-md"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between gap-6 max-md:mt-7" {...revealItem(3)}>
          <div className="flex min-w-0 items-baseline gap-3 max-md:flex-col max-md:gap-0.5">
            <h3 className="font-display text-[28px] leading-9 font-normal tracking-[-0.01em] text-[#1b1919] max-md:text-[22px] max-md:leading-7">
              {reviews.videosTitle}
            </h3>
            <p className="font-text text-[15px] leading-5 text-[#a4a09d] max-md:text-[13px]">{reviews.videosHint}</p>
          </div>
          <div className="flex shrink-0 gap-3">
            {[-1, 1].map((dir) => (
              <button
                key={dir}
                type="button"
                className="rr-round-btn"
                disabled={dir < 0 ? edges.start : edges.end}
                onClick={() => row.current?.scrollBy({ left: dir * STEP, behavior: 'smooth' })}
                aria-label={dir < 0 ? 'Предыдущие отзывы' : 'Следующие отзывы'}
              >
                <svg width="8" height="12" viewBox="0 0 8 12" aria-hidden="true">
                  <path d={dir < 0 ? 'M6 1.5 1.8 6 6 10.5' : 'M2 1.5 6.2 6 2 10.5'} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <ul ref={row} className="rr-reviews mt-6 flex gap-5 overflow-x-auto max-md:mt-4 max-md:gap-3" onScroll={measure} {...revealItem(4)}>
          {reviews.items.map((item) => {
            const doctor = getDoctor(item.doctorId);
            return (
              <li key={item.title} className="relative h-[500px] w-[280px] shrink-0 overflow-hidden rounded-[24px] bg-[#7d6f63] max-md:h-[460px] max-md:w-[258px]">
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="rr-review block size-full text-white" aria-label={`${item.title}: смотреть в Instagram`}>
                  <img
                    src={asset(item.poster.src)}
                    width={item.poster.width}
                    height={item.poster.height}
                    alt={item.poster.alt}
                    loading="lazy"
                    decoding="async"
                    className="rr-review__img absolute inset-0 size-full object-cover object-[50%_25%]"
                  />
                  <span className="rr-review__shade absolute inset-0" aria-hidden="true" />
                  <span className="rr-review__chip absolute top-4 left-4 inline-flex h-8 items-center gap-2 rounded-pill px-3 font-text text-[14px] leading-none" aria-hidden="true">
                    Instagram
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 8 8 1M2.5 1H8v5.5" />
                    </svg>
                  </span>
                  <span className="rr-review__play absolute top-1/2 left-1/2 grid size-[58px] -translate-1/2 place-items-center rounded-full" aria-hidden="true">
                    <svg width="11" height="13" viewBox="0 0 11 13">
                      <path d="M1 1.2v10.6c0 .6.6.9 1.1.6l8.2-5.3a.7.7 0 0 0 0-1.2L2.1.6C1.6.3 1 .6 1 1.2Z" fill="#fff" />
                    </svg>
                  </span>
                  <span className="absolute inset-x-5 bottom-5 block">
                    <span className="block font-display text-[20px] leading-6 font-medium tracking-[-0.01em]">{item.title}</span>
                    <span className="mt-2 block font-text text-[15px] leading-5 text-white/85">{item.operation}</span>
                    {doctor && (
                      <span className="mt-2 flex items-center gap-2 font-text text-[15px] leading-5 text-white/85">
                        <DoctorAvatar doctor={doctor} size={24} />
                        {doctor.lastName} {doctor.firstName[0]}.
                      </span>
                    )}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>

        <span className="mt-8 block h-1 overflow-hidden rounded-full bg-[#e6e3e0] max-md:mt-5" aria-hidden="true">
          <span className="rr-reviews__fill block h-full rounded-full bg-[#5a8478]" style={{ width: `${progress * 100}%` }} />
        </span>

        <p className="mt-6 font-text text-[13px] leading-4 text-[#a4a09d]">{reviews.disclaimer}</p>
      </div>
    </section>
  );
}
