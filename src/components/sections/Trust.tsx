import { useEffect, useState, type CSSProperties } from 'react';
import { asset } from '../../data/hero';
import { trust, type RichText as RichTextValue } from '../../data/landing';
import { CtaButton } from '../hero/CtaButton';
import { RichText, withBreaks } from './RichText';
import { revealItem, revealScope, useInView } from './useInView';
import { WorldMap } from './WorldMap';
import { useIsMobile } from '../../hooks/useIsMobile';
import './sections.css';

const COUNT_FROM = 0.1; // "1000+" starts at 100+
const COUNT_DELAY_MS = 250;
const COUNT_MS = 1800;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A "1000+"-style figure counts up from a tenth of its value once it scrolls into view; anything else renders as is. */
function StatValue({ value }: { value: string }) {
  const match = /^(\d+)(\+?)$/.exec(value);
  const to = match ? Number(match[1]) : 0;
  const suffix = match?.[2] ?? '';
  const from = Math.round(to * COUNT_FROM);
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [n, setN] = useState(() => (prefersReducedMotion() ? to : from));

  useEffect(() => {
    if (!suffix || !inView || prefersReducedMotion()) return undefined;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, Math.max(0, (now - start - COUNT_DELAY_MS) / COUNT_MS));
      setN(Math.round(from + (to - from) * easeOutCubic(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, from, to, suffix]);

  if (!suffix) return <>{value}</>;
  return (
    <span ref={ref}>
      <span aria-hidden="true">
        {n}
        {suffix}
      </span>
      <span className="sr-only">{value}</span>
    </span>
  );
}

/** Splits a RichText value at its "\n"s into one RichText per line (accent/strong fragments keep their tone). */
function richLines(value: RichTextValue): RichTextValue[] {
  const lines: RichTextValue[number][][] = [[]];
  for (const part of value) {
    const text = typeof part === 'string' ? part : part.text;
    text.split('\n').forEach((chunk, i) => {
      if (i > 0) lines.push([]);
      if (chunk) lines[lines.length - 1].push(typeof part === 'string' ? chunk : { ...part, text: chunk });
    });
  }
  return lines;
}

/**
 * "Нам доверяют пациенты из 14 стран" (design 2026-10-28): centred headline and text, the world map with the
 * patients' countries, four key figures in a row; below, the founders photo card (1240×476) with a white
 * panel — clinic headline, text and CTAs.
 */
export function Trust() {
  const { ref, inView } = useInView<HTMLElement>();
  const panel = useInView<HTMLDivElement>();
  const { card } = trust;
  const isMobile = useIsMobile();

  return (
    <section
      ref={ref}
      id={trust.id}
      aria-labelledby="trust-title"
      className="rr-section relative bg-white"
      {...revealScope(inView)}
    >
      <div className="mx-auto max-w-[1440px] px-(--sec-pad) pt-[72px] max-md:pt-12">
        <div className="text-center">
          <h2
            id="trust-title"
            className="font-display text-[48px] leading-[1.1] font-normal tracking-[-0.03em] text-neutral-900 max-md:text-[32px]"
            {...revealItem(0)}
          >
            {trust.title[0]} <span className="text-[#5e8d7e] max-md:block">{trust.title[1]}</span>
          </h2>

          <p
            className="mt-6 font-text text-[20px] leading-[1.35] text-[#625f5e] max-md:mt-3 max-md:text-[14px] max-md:[&_br]:hidden"
            {...revealItem(1)}
          >
            {withBreaks(trust.text)}
          </p>
        </div>

        <WorldMap className="mx-auto mt-12 w-full max-w-[1164px] max-md:-mx-(--sec-pad) max-md:mt-5 max-md:w-auto" />

        <dl
          className="mt-12 flex justify-between gap-6 max-md:mt-8 max-md:grid max-md:grid-cols-2 max-md:gap-x-4 max-md:gap-y-8"
          {...revealItem(2)}
        >
          {trust.stats.map((stat) => (
            <div
              key={stat.label}
              className="flex w-[244px] flex-col gap-5 border-l border-[#e3e0de] pl-6 max-md:w-auto max-md:gap-3 max-md:border-0 max-md:pl-0"
            >
              <dt className="sr-only">{stat.label.replace('\n', ' ')}</dt>
              <dd className="rr-trim-cap order-first font-display text-[72px] leading-none font-light tracking-[-0.04em] text-[#5e8d7e] max-md:text-[44px]">
                <StatValue value={stat.value} />
                {stat.unit && (
                  <span className="ml-2 text-[30px] tracking-[-0.02em] max-md:ml-1 max-md:text-[20px]">
                    {stat.unit}
                  </span>
                )}
              </dd>
              <dd
                className="font-text text-[18px] leading-[1.2] tracking-[-0.01em] text-[#625f5e] max-md:text-[13px] max-md:[&_br]:hidden"
                aria-hidden="true"
              >
                {withBreaks(stat.label)}
              </dd>
            </div>
          ))}
        </dl>

        <div
          className="rr-trust relative isolate mt-20 flex overflow-hidden rounded-[48px] bg-[#8a7562] max-md:mt-12 max-md:flex-col max-md:rounded-[24px] max-md:pt-[calc(100%*576/714)]"
          {...revealItem(3)}
        >
          {/* Phones get the founders crop above the panel; the card's brown fills in behind the panel */}
          <picture>
            <source media="(max-width: 767px)" srcSet={asset(card.photoMobile.src)} />
            <img
              src={asset(card.photo.src)}
              width={card.photo.width}
              height={card.photo.height}
              alt={card.photo.alt}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 -z-10 size-full object-cover object-top max-md:bottom-auto max-md:h-auto"
            />
          </picture>

          {/* Chip layer: the whole card on desktop, just the photo on phones */}
          <div className="pointer-events-none absolute inset-0 max-md:bottom-auto max-md:aspect-[714/576]">
            {card.people.map((person) => (
              <span
                key={person.name}
                className="rr-trust__chip absolute top-(--top) left-(--left) inline-flex h-10 -translate-x-1/2 items-center gap-2 rounded-pill px-4 font-text text-[15px] leading-4 whitespace-nowrap text-white max-md:top-(--m-top) max-md:left-(--m-left) max-md:h-8 max-md:px-3 max-md:text-[13px]"
                style={
                  {
                    '--left': person.left,
                    '--top': person.top,
                    '--m-left': person.mobile.left,
                    '--m-top': person.mobile.top,
                  } as CSSProperties
                }
                aria-hidden="true"
              >
                <span className="size-1 rounded-full bg-white" />
                {person.name}
              </span>
            ))}
          </div>

          {/* White panel (490 × 378 @ 32, 38) */}
          <div
            ref={panel.ref}
            className="relative mt-[38px] mb-[58px] ml-8 flex w-[490px] flex-col rounded-[32px] bg-white px-10 pt-[38px] pb-6 text-left max-md:mx-2.5 max-md:mt-[-56px] max-md:mb-2.5 max-md:w-auto max-md:rounded-[20px] max-md:px-4 max-md:pt-5 max-md:pb-4"
          >
            {/* Each line rises out of its own mask once the panel is in view */}
            <h3
              className="rr-lines font-display text-[32px] leading-[1.1] font-normal tracking-[-0.02em] text-neutral-900 max-md:text-[20px]"
              data-lines={panel.inView ? 'in' : 'out'}
            >
              {richLines(card.title).map((line, i) => (
                <span key={i} className="-mx-1 -mb-2 block overflow-hidden px-1 pb-2">
                  <span className="block" data-line="" style={{ '--ln-i': i } as CSSProperties}>
                    <RichText value={line} accentClassName="text-[#9b8c7e]" />
                  </span>
                </span>
              ))}
            </h3>

            <p className="mt-4 font-text text-[17px] leading-[23px] text-[#625f5e] max-md:mt-2 max-md:text-[13px] max-md:leading-[18px] max-md:[&_br]:hidden">
              {withBreaks(card.text)}
            </p>

            <div className="mt-[22px] -ml-2 flex gap-[11px] max-md:mt-4 max-md:ml-0 max-md:grid max-md:grid-cols-2 max-md:gap-2">
              {card.ctas.map((cta) =>
                cta.variant === 'primary' ? (
                  <CtaButton
                    key={cta.label}
                    variant="primary"
                    href={cta.href}
                    label={isMobile ? (cta.mobileLabel ?? cta.label) : cta.label}
                    className="h-[55px]! w-[259px] rounded-pill! bg-none bg-[#c8a66b] font-display! text-[15px]! leading-6! font-normal! tracking-[-0.01em]! max-md:h-12! max-md:w-auto max-md:justify-center max-md:text-[14px]!"
                    data-arrow="hover"
                    data-flat=""
                  />
                ) : (
                  <a
                    key={cta.label}
                    href={cta.href}
                    className="rr-pill-light inline-flex h-[55px] w-[141px] items-center justify-center rounded-pill font-display text-[15px] leading-6 font-normal tracking-[-0.01em] text-[#2e2c2c] max-md:h-12 max-md:w-auto max-md:text-[14px]"
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
