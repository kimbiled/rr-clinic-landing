import { asset } from '../../data/hero';
import { trust } from '../../data/landing';
import { CtaButton } from '../hero/CtaButton';
import { RichText, withBreaks } from './RichText';
import { revealItem, revealScope, useInView } from './useInView';
import { WorldMap } from './WorldMap';
import './sections.css';

/**
 * "Нам доверяют пациенты из 14 стран" (design 2026-10-22): headline, text and four key figures on the left,
 * the world map with the patients' countries on the right; below, the founders photo card (1240×476)
 * with a white panel — clinic headline, text and CTAs.
 */
export function Trust() {
  const { ref, inView } = useInView<HTMLElement>();
  const { card } = trust;

  return (
    <section
      ref={ref}
      id={trust.id}
      aria-labelledby="trust-title"
      className="rr-section relative bg-white"
      {...revealScope(inView)}
    >
      <div className="mx-auto max-w-[1440px] px-(--sec-pad) pt-6">
        <div className="flex items-start justify-between gap-10">
          <div className="pt-[62px]">
            <h2
              id="trust-title"
              className="font-display text-[32px] leading-[1.1] font-normal tracking-[-0.02em] text-neutral-900"
              {...revealItem(0)}
            >
              {trust.title[0]}
              <br />
              <span className="text-[#5e8d7e]">{trust.title[1]}</span>
            </h2>

            <p className="mt-[34px] font-text text-[18px] leading-[1.25] text-[#625f5e]" {...revealItem(1)}>
              {withBreaks(trust.text)}
            </p>

            <dl className="mt-10 grid grid-cols-[216px_216px] gap-x-5 gap-y-6" {...revealItem(2)}>
              {trust.stats.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-2.5">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="rr-trim-cap order-first font-display text-[36px] leading-none font-light tracking-[-0.02em] text-[#5e8d7e]">
                    {stat.value}
                  </dd>
                  <dd
                    className="rr-trim-cap max-w-[195.5px] font-text text-[16px] leading-none tracking-[-0.02em] text-[#625f5e]"
                    aria-hidden="true"
                  >
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <WorldMap className="w-[716px] shrink-0" />
        </div>

        <div
          className="rr-trust relative isolate mt-4 flex overflow-hidden rounded-[48px] bg-[#8a7562]"
          {...revealItem(3)}
        >
          <img
            src={asset(card.photo.src)}
            width={card.photo.width}
            height={card.photo.height}
            alt={card.photo.alt}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 -z-10 size-full object-cover object-top"
          />

          {card.people.map((person) => (
            <span
              key={person.name}
              className="rr-trust__chip absolute inline-flex h-10 -translate-x-1/2 items-center gap-2 rounded-pill px-4 font-text text-[15px] leading-4 whitespace-nowrap text-white"
              style={{ left: person.left, top: person.top }}
              aria-hidden="true"
            >
              <span className="size-1 rounded-full bg-white" />
              {person.name}
            </span>
          ))}

          {/* White panel (490 × 378 @ 32, 38) */}
          <div className="relative mt-[38px] mb-[58px] ml-8 flex w-[490px] flex-col rounded-[32px] bg-white px-10 pt-[38px] pb-6 text-left">
            <h3 className="font-display text-[32px] leading-[1.1] font-normal tracking-[-0.02em] text-neutral-900">
              <RichText value={card.title} accentClassName="text-[#9b8c7e]" />
            </h3>

            <p className="mt-4 font-text text-[17px] leading-[23px] text-[#625f5e]">{withBreaks(card.text)}</p>

            <div className="mt-[22px] flex gap-[11px]">
              {card.ctas.map((cta) =>
                cta.variant === 'primary' ? (
                  <CtaButton
                    key={cta.label}
                    variant="primary"
                    href={cta.href}
                    label={cta.label}
                    className="h-[55px]! w-[259px] rounded-pill! bg-none bg-[#c8a66b] font-display! text-[15px]! leading-6! font-normal! tracking-[-0.01em]!"
                    data-arrow="hover"
                    data-flat=""
                  />
                ) : (
                  <a
                    key={cta.label}
                    href={cta.href}
                    className="rr-pill-light inline-flex h-[55px] w-[141px] items-center justify-center rounded-pill font-display text-[15px] leading-6 font-normal tracking-[-0.01em] text-[#2e2c2c]"
                  >
                    {cta.label}
                  </a>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
