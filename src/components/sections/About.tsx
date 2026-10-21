import { useEffect, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { about } from '../../data/landing';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { CtaButton } from '../hero/CtaButton';
import { RichText } from './RichText';
import { revealItem, revealScope, useInView } from './useInView';
import './sections.css';

/** Auto-advance period of the numbered slides; paused while the pointer or focus is inside. */
const SLIDE_MS = 7000;

/**
 * "О клинике" (design 2026-10): centred eyebrow + two-tone title over the arches pattern, then numbered
 * slides — the active one centred, its neighbours faded at the sides (click one to bring it in) — and CTAs.
 */
export function About() {
  const { ref, inView } = useInView<HTMLElement>();
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = about.slides.length;

  useEffect(() => {
    if (!inView || paused || reducedMotion || count < 2) return;
    const t = window.setTimeout(() => setActive((i) => (i + 1) % count), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [active, inView, paused, reducedMotion, count]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const step = e.key === 'ArrowRight' ? 1 : -1;
      setActive((i) => Math.min(count - 1, Math.max(0, i + step)));
    }
  };

  return (
    <section
      ref={ref}
      id={about.id}
      aria-labelledby="about-title"
      className="rr-section rr-about relative overflow-hidden bg-white text-neutral-900"
      {...revealScope(inView)}
    >
      <span className="rr-about__pattern pointer-events-none absolute inset-0" aria-hidden="true" />
      {/* from the buttons' centre line (60 px padding + 29 px half-button) to the section's end */}
      <span className="rr-about__veil pointer-events-none absolute inset-x-0 bottom-0 h-[89px]" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1440px] pt-10 pb-[60px] text-center">
        <p className="rr-eyebrow" {...revealItem(0)}>
          {about.eyebrow}
        </p>

        <h2
          id="about-title"
          className="mt-[30px] font-display text-[40px] leading-[1.1] font-normal tracking-[-0.02em] text-neutral-900"
          {...revealItem(1)}
        >
          {about.title[0]}
          <br />
          <span className="text-[#b3a697]">{about.title[1]}</span>
        </h2>

        <div
          className="rr-about__slider mt-[34px] outline-offset-4"
          role="region"
          aria-roledescription="карусель"
          aria-label="О клинике"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          {...revealItem(2)}
        >
          <ol className="rr-about__track" style={{ '--slide': active } as CSSProperties}>
            {about.slides.map((slide, i) => (
              <li
                key={i}
                className="rr-about__slide"
                data-active={i === active || undefined}
                aria-roledescription="слайд"
                aria-label={`${i + 1} из ${count}`}
                aria-current={i === active || undefined}
                onClick={() => setActive(i)}
              >
                <span className="rr-about__num block font-text text-[16px] leading-5 font-medium tabular-nums" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="mt-[9px] font-text text-[18px] leading-[1.2] font-normal text-[#625f5e]">
                  <RichText value={slide} strongClassName="font-medium text-neutral-900" />
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-[44px] flex justify-center gap-4" {...revealItem(3)}>
          {about.ctas.map((cta) =>
            cta.variant === 'primary' ? (
              <CtaButton
                key={cta.label}
                variant="primary"
                href={cta.href}
                label={cta.label}
                className="rr-about__cta h-[58px]! w-[292px] rounded-pill! bg-none bg-[#d3b47b] font-display! text-[16px]! leading-6! font-normal! tracking-[-0.01em]!"
                data-arrow="hover"
                data-flat=""
              />
            ) : (
              <a
                key={cta.label}
                href={cta.href}
                className="rr-pill-light inline-flex h-[58px] w-[178px] items-center justify-center rounded-pill font-display text-[16px] leading-6 font-normal tracking-[-0.01em] text-[#504943] underline decoration-1 underline-offset-[4px]"
              >
                {cta.label}
              </a>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
