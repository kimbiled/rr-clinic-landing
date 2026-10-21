import { useId } from 'react';
import { asset, heroData } from '../../data/hero';
import { trust } from '../../data/landing';
import { revealItem, revealScope, useInView } from './useInView';
import './sections.css';

/** Five gold stars, the last one filled to the fraction of the rating (4.9 → 90 %). */
function Stars({ value, max }: { value: number; max: number }) {
  const clipId = useId();
  return (
    <span className="flex gap-1" aria-hidden="true">
      {Array.from({ length: max }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <svg key={i} width="16" height="16" viewBox="0 0 16 16" className="size-4">
            {fill < 1 && (
              <defs>
                <clipPath id={`${clipId}-${i}`}>
                  <rect width={16 * fill} height="16" />
                </clipPath>
              </defs>
            )}
            <path d="M8 1.2l2.06 4.3 4.72.6-3.47 3.27.9 4.68L8 11.77 3.8 14.05l.9-4.68L1.22 6.1l4.72-.6z" fill="#efe2cc" />
            <path
              d="M8 1.2l2.06 4.3 4.72.6-3.47 3.27.9 4.68L8 11.77 3.8 14.05l.9-4.68L1.22 6.1l4.72-.6z"
              fill="#e1b155"
              clipPath={fill < 1 ? `url(#${clipId}-${i})` : undefined}
            />
          </svg>
        );
      })}
    </span>
  );
}

/**
 * "Почему нам доверяют" (design 2026-10): a 1240×560 photo card — the founders in front of the columns —
 * with a white panel on the left holding the headline, the reasons, four key figures and the 2GIS rating.
 */
export function Trust() {
  const { ref, inView } = useInView<HTMLElement>();
  const { rating } = heroData.clinic;
  const ratingValue = rating.value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const ratingLabel = `Рейтинг в 2ГИС: ${ratingValue} из ${rating.max ?? 5}`;

  const ratingRow = (
    <>
      <img src={asset(rating.logo.src)} width={26} height={26} alt="" className="size-[26px] rounded-[6px]" />
      <span className="ml-2.5 font-text text-[14px] leading-4 text-[#7c7876]" aria-hidden="true">
        2ГИС
      </span>
      <span className="mx-1.5 size-[3px] rounded-full bg-[#7c7876]" aria-hidden="true" />
      <span className="mr-3 font-text text-[14px] leading-4 font-medium text-neutral-900" aria-hidden="true">
        {ratingValue}
      </span>
      <Stars value={rating.value} max={rating.max ?? 5} />
      <span className="sr-only">
        {ratingLabel}
        {rating.url && ' (открывается в новой вкладке)'}
      </span>
    </>
  );

  return (
    <section ref={ref} id={trust.id} aria-labelledby="trust-title" className="rr-section relative bg-white" {...revealScope(inView)}>
      <div className="mx-auto max-w-[1440px] px-(--sec-pad)">
        <div className="rr-trust relative isolate flex min-h-[560px] overflow-hidden rounded-[56px] bg-[#8a7562]" {...revealItem(0)}>
          <img
            src={asset(trust.photo.src)}
            width={trust.photo.width}
            height={trust.photo.height}
            alt={trust.photo.alt}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 -z-10 size-full object-cover"
          />

          {trust.people.map((person) => (
            <span
              key={person.name}
              className="rr-trust__chip absolute inline-flex h-[34px] -translate-x-1/2 items-center gap-2 rounded-pill px-4 font-text text-[14px] leading-4 whitespace-nowrap text-white"
              style={{ left: person.left, top: person.top }}
              aria-hidden="true"
            >
              <span className="size-1 rounded-full bg-white" />
              {person.name}
            </span>
          ))}

          {/* White panel (488 × 493 @ 34, 32) */}
          <div className="relative my-8 ml-[34px] flex w-[488px] flex-col rounded-[24px] bg-white px-9 pt-[42px] pb-7 text-left">
            <h2 id="trust-title" className="font-display text-[36px] leading-10 font-normal tracking-[-0.025em] text-[#1b1919]">
              {trust.title[0]}
              <br />
              <span className="text-[#c3914d]">{trust.title[1]}</span>
            </h2>

            <p className="mt-[14px] font-text text-[16px] leading-[22px] tracking-[-0.01em] text-[#585656]">{trust.text}</p>

            <dl className="mt-[22px] grid grid-cols-2 gap-x-6 gap-y-[22px]">
              {trust.stats.map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="order-first font-display text-[34px] leading-[38px] font-normal tracking-[-0.025em] text-[#1b1919]">
                    {stat.value}
                  </dd>
                  <dd className="mt-1 max-w-[190px] font-text text-[14px] leading-4 text-[#7c7876]" aria-hidden="true">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-auto pt-6">
              <div className="h-px bg-neutral-200" aria-hidden="true" />
              {rating.url ? (
                <a
                  href={rating.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rr-trust__rating mt-4 inline-flex items-center rounded-md"
                >
                  {ratingRow}
                </a>
              ) : (
                <p className="mt-4 flex items-center">{ratingRow}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
