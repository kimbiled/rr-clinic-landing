import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { asset } from '../../data/hero';
import { journey } from '../../data/landing';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { revealItem, revealScope, useInView } from './useInView';
import './sections.css';

/** Auto-advance period; the active step's bar fills over the same time. */
const STEP_MS = 6000;

const Arrow = ({ dir }: { dir: -1 | 1 }) => (
  <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true" className={dir < 0 ? 'rotate-180' : undefined}>
    <path d="M1 6h14M10 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * "Ваш путь к преображению" (design 2026-10-30): centered heading, "Для жителей Астаны / Для иногородних" toggle,
 * five photo cards with a progress bar under each. The steps advance on their own (hover / focus / scrolling away
 * pause them); every passed step keeps its bar filled. Phones (design 2026-11-01): left-aligned heading and a swipeable
 * strip of cards that follows the current step, and a swipe chooses the step.
 */
export function Journey() {
  const { ref, inView } = useInView<HTMLElement>();
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const [activeVariant, setActiveVariant] = useState(0);
  const [step, setStep] = useState(0);
  const [held, setHeld] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const strip = useRef<HTMLOListElement>(null);
  const stripSettle = useRef(0);
  const { variants } = journey;
  const variant = variants[activeVariant];
  const count = variant.steps.length;
  const running = inView && !held && !reducedMotion;

  // Time left on the current step: a pause only freezes it, a step change resets it.
  const remaining = useRef(STEP_MS);
  const go = (dir: number) => setStep((i) => (i + dir + count) % count);

  // Declared before the timer so that on a step change the reset runs before the new countdown starts.
  useEffect(() => {
    remaining.current = STEP_MS;
  }, [step, activeVariant]);

  useEffect(() => {
    if (!running) return;
    const started = performance.now();
    const t = window.setTimeout(() => setStep((i) => (i + 1) % count), remaining.current);
    return () => {
      window.clearTimeout(t);
      remaining.current = Math.max(0, remaining.current - (performance.now() - started));
    };
  }, [step, activeVariant, running, count]);

  useEffect(() => {
    const el = strip.current;
    const card = el?.children[step] as HTMLElement | undefined;
    if (!isMobile || !el || !card) return;
    el.scrollTo({ left: card.offsetLeft - (el.children[0] as HTMLElement).offsetLeft, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [step, activeVariant, isMobile, reducedMotion]);

  useEffect(() => () => window.clearTimeout(stripSettle.current), []);

  // Scroll events stop once a swipe (or the smooth scroll above) settles: the card at the left edge is the step.
  const onStripScroll = () => {
    window.clearTimeout(stripSettle.current);
    stripSettle.current = window.setTimeout(() => {
      const el = strip.current;
      if (!el) return;
      const [first, second] = el.children as unknown as HTMLElement[];
      setStep(Math.min(count - 1, Math.round(el.scrollLeft / (second.offsetLeft - first.offsetLeft))));
    }, 140);
  };

  const chooseVariant = (i: number) => {
    setActiveVariant(i);
    setStep(0);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = (activeVariant + (e.key === 'ArrowRight' ? 1 : -1) + variants.length) % variants.length;
      chooseVariant(next);
      tabs.current[next]?.focus();
    }
  };

  return (
    <section
      ref={ref}
      id={journey.id}
      aria-labelledby="journey-title"
      className="rr-section relative bg-white text-neutral-900"
      {...revealScope(inView)}
    >
      <div className="mx-auto max-w-[1440px] px-(--sec-pad)">
        <div className="rr-frame rr-frame--wide relative pt-[52px] pb-[64px] max-md:pt-10 max-md:pb-12">
          <div className="flex flex-col items-center text-center max-md:items-start max-md:text-left">
            <h2
              id="journey-title"
              className="font-display text-[44px] leading-[52px] font-normal tracking-[-0.02em] text-[#1b1919] max-md:text-[32px] max-md:leading-[38px] max-md:tracking-normal"
              {...revealItem(0)}
            >
              {journey.title[0]}
              <span className="max-md:block">
                <span className="max-md:text-[#5e8b7b]">{journey.title[1]}</span>
                <span className="text-[#5e8b7b]">{journey.title[2]}</span>
              </span>
            </h2>
            <p className="mt-2 font-text text-[18px] leading-[22px] text-[#625f5e] max-md:max-w-[335px] max-md:text-[16px] max-md:text-[#8c8784]" {...revealItem(1)}>
              {journey.text}
            </p>

            <div
              className="rr-toggle relative mt-7 grid grid-cols-2 rounded-pill p-[7px] max-md:mt-5 max-md:w-full"
              role="tablist"
              aria-label="Маршрут пациента"
              onKeyDown={onKeyDown}
              {...revealItem(2)}
            >
              <span
                className="rr-toggle__thumb absolute top-[7px] bottom-[7px] left-[7px] w-[calc(50%-7px)] rounded-pill"
                style={{ translate: `${activeVariant * 100}% 0` }}
                aria-hidden="true"
              />
              {variants.map((v, i) => (
                <button
                  key={v.id}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`journey-tab-${v.id}`}
                  aria-selected={i === activeVariant}
                  aria-controls="journey-steps"
                  tabIndex={i === activeVariant ? 0 : -1}
                  className="rr-toggle__tab relative h-11 rounded-pill px-6 font-display text-[14px] leading-5 font-medium whitespace-nowrap max-md:h-10 max-md:px-2 max-md:font-text max-md:text-[16px]"
                  onClick={() => chooseVariant(i)}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div
            id="journey-steps"
            role="tabpanel"
            aria-labelledby={`journey-tab-${variant.id}`}
            className="mt-[46px] max-md:mt-6"
            onPointerEnter={() => setHeld(true)}
            onPointerLeave={() => setHeld(false)}
            onFocus={() => setHeld(true)}
            onBlur={() => setHeld(false)}
            {...revealItem(3)}
          >
            <ol
              ref={strip}
              key={variant.id}
              className="rr-path grid grid-cols-5 gap-5 max-md:-mx-(--sec-pad) max-md:flex max-md:snap-x max-md:snap-mandatory max-md:scroll-pl-(--sec-pad) max-md:gap-[19px] max-md:overflow-x-auto max-md:py-3 max-md:pr-[calc(100vw-228px)] max-md:pl-(--sec-pad)"
              onScroll={isMobile ? onStripScroll : undefined}
            >
              {variant.steps.map((item, i) => (
                <li key={item.title} className="rr-path__item max-md:w-[212px] max-md:shrink-0 max-md:snap-start">
                  <button
                    type="button"
                    className="rr-path__card flex h-full w-full flex-col rounded-[24px] p-2.5 text-left"
                    aria-current={i === step ? 'step' : undefined}
                    onClick={() => setStep(i)}
                  >
                    <span className="relative block aspect-[212/232] w-full overflow-hidden rounded-[18px] max-md:aspect-[193/223]">
                      <img
                        src={asset(item.image.src)}
                        width={item.image.width}
                        height={item.image.height}
                        alt={item.image.alt}
                        loading="lazy"
                        decoding="async"
                        className="rr-path__img size-full object-cover"
                      />
                      <span className="rr-path__num absolute top-2.5 left-2.5 grid size-[34px] place-items-center rounded-full font-text text-[14px] leading-none" aria-hidden="true">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </span>
                    <span className="rr-path__title mt-4 block px-2 font-display text-[19px] leading-[24px] font-normal tracking-[-0.01em] max-md:text-[17px] max-md:tracking-normal">
                      {item.title}
                    </span>
                    <span className="rr-path__text mt-2 mb-3 block px-2 font-text text-[14px] leading-[18px]">{item.text}</span>
                  </button>
                </li>
              ))}
            </ol>

            <div className="mt-10 grid grid-cols-5 gap-5 max-md:mt-6 max-md:gap-2" aria-hidden="true">
              {variant.steps.map((item, i) => (
                <span key={item.title} className="rr-path__bar" data-state={i < step ? 'done' : i === step ? 'active' : undefined}>
                  <span
                    key={i === step ? `${variant.id}-${step}` : undefined}
                    data-running={i === step && running ? '' : undefined}
                    style={{ '--step-ms': `${STEP_MS}ms` } as CSSProperties}
                  />
                </span>
              ))}
            </div>

            <div className="mt-[30px] flex items-center justify-between gap-4 max-md:mt-5">
              <p aria-live="polite" className="flex min-w-0 items-baseline gap-3">
                <span className="shrink-0 font-display text-[20px] leading-7 tracking-[-0.01em] text-[#1b1919] max-md:text-[17px]">
                  Шаг {step + 1} из {count}
                </span>
                <span className="truncate font-text text-[15px] leading-5 text-[#8c8784] max-md:text-[13px]">{variant.steps[step].title}</span>
              </p>
              <div className="flex shrink-0 gap-3">
                <button type="button" className="rr-round-btn" onClick={() => go(-1)} aria-label="Предыдущий шаг">
                  <Arrow dir={-1} />
                </button>
                <button type="button" className="rr-round-btn" onClick={() => go(1)} aria-label="Следующий шаг">
                  <Arrow dir={1} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
