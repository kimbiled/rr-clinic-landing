import { useEffect, useState, type CSSProperties } from 'react';
import { asset } from '../../data/hero';
import { trust, type RichText as RichTextValue } from '../../data/landing';
import { CtaButton } from '../hero/CtaButton';
import { RichText, withBreaks } from './RichText';
import { revealItem, revealScope, useInView } from './useInView';
import { WorldMap } from './WorldMap';
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
  const lines: (RichTextValue[number])[][] = [[]];
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
 * "Нам доверяют пациенты из 15 стран" (design 2026-10-22): headline, text and four key figures on the left,
 * the world map with the patients' countries on the right; below, the founders photo card (1240×476)
 * with a white panel — clinic headline, text and CTAs.
 */
export function Trust() {
  const { ref, inView } = useInView<HTMLElement>();
  const panel = useInView<HTMLDivElement>();
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
                    <StatValue value={stat.value} />
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
          <div
            ref={panel.ref}
            className="relative mt-[38px] mb-[58px] ml-8 flex w-[490px] flex-col rounded-[32px] bg-white px-10 pt-[38px] pb-6 text-left"
          >
            {/* Each line rises out of its own mask once the panel is in view */}
            <h3
              className="rr-lines font-display text-[32px] leading-[1.1] font-normal tracking-[-0.02em] text-neutral-900"
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

            <p className="mt-4 font-text text-[17px] leading-[23px] text-[#625f5e]">{withBreaks(card.text)}</p>

            <div className="mt-[22px] -ml-2 flex gap-[11px]">
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
