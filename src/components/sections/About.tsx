import { about } from '../../data/landing';
import { asset } from '../../data/hero';
import { CtaButton } from '../hero/CtaButton';
import { RichText, withBreaks } from './RichText';
import { revealItem, revealScope, useInView } from './useInView';
import './sections.css';

// The hero CtaButton, restyled for a white background. `!` beats the button's base utilities.
const CTA_BASE = 'h-16! rounded-pill! font-text! text-[20px]! leading-6! font-medium! tracking-[-0.01em]!';
const CTA_CLASS = {
  primary: `${CTA_BASE} w-[241px] bg-none bg-[#d9b272]`,
  secondary: `${CTA_BASE} rr-cta--light w-[244px] text-[#96918e]! hover:text-neutral-900! focus-visible:text-neutral-900!`,
} as const;

/** "О клинике" (Figma "Desktop - 4", 1440×731): text column left, founders photo right, hairline dividers. */
export function About() {
  const { ref, inView } = useInView<HTMLElement>();
  const { photo } = about;

  return (
    <section
      ref={ref}
      id={about.id}
      aria-labelledby="about-title"
      className="rr-section relative overflow-hidden bg-white text-neutral-900"
      {...revealScope(inView)}
    >
      <div className="relative mx-auto grid max-w-[1440px] grid-cols-[710fr_730fr]">
        {/* Left column: x 100, 505 wide */}
        <div className="pt-[55px] pb-12 pl-(--sec-pad)">
          <div className="max-w-[505px]">
            <p
              className="font-text text-[18px] leading-6 font-normal tracking-[0.1em] text-taupe-400 uppercase"
              {...revealItem(0)}
            >
              {about.eyebrow}
            </p>

            <h2
              id="about-title"
              className="mt-[26px] font-display text-[40px] leading-[42px] font-normal tracking-[-0.045em] text-[#1b1919]"
              {...revealItem(1)}
            >
              <RichText value={about.title} accentClassName="text-[#c3914d]" />
            </h2>

            <ol className="mt-[46px] flex flex-col gap-5">
              {about.benefits.map((benefit, i) => (
                <li key={benefit.title} className="grid grid-cols-[24px_1fr] gap-x-4" {...revealItem(2 + i)}>
                  <span className="font-text text-[20px] leading-[26px] tracking-[-0.02em] text-[#ababab] tabular-nums" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="max-w-[444px]">
                    <h3 className="font-text text-[20px] leading-[26px] font-medium tracking-[-0.02em] text-neutral-900">{benefit.title}</h3>
                    <p className="mt-[5px] font-text text-[20px] leading-[23px] font-normal tracking-[-0.02em] text-[#585656]">
                      {withBreaks(benefit.text)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-[52px] flex gap-5" {...revealItem(5)}>
              {about.ctas.map((cta) => (
                <CtaButton
                  key={cta.label}
                  variant={cta.variant}
                  href={cta.href}
                  label={cta.label}
                  className={CTA_CLASS[cta.variant]}
                  data-arrow="hover"
                  data-flat={cta.variant === 'primary' ? '' : undefined}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right column: x 730, 610 wide */}
        <div className="relative pt-[79px] pr-(--sec-pad) pl-5">
          <span className="rr-about__vline absolute inset-y-0 -left-px w-0.5" aria-hidden="true" />
          <span className="rr-about__hline absolute top-[63px] right-0 left-px h-0.5" aria-hidden="true" />

          <figure className="max-w-[610px]">
            <img
              // TEMPORARY low-res placeholder (610×494 crop of the design screenshot) — swap for the client's original.
              src={asset(photo.src)}
              width={photo.width}
              height={photo.height}
              alt={photo.alt}
              loading="lazy"
              decoding="async"
              className="block aspect-[610/494] h-auto w-full rounded-[20px] object-cover"
              {...revealItem(2)}
            />
            <figcaption
              className="mt-6 font-text text-[20px] leading-[26px] font-normal tracking-[-0.02em] text-[#625f5e]"
              {...revealItem(3)}
            >
              <RichText value={about.caption} strongClassName="font-medium text-[#1b1919]" />
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
