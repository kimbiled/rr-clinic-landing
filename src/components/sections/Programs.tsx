import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { asset, heroData } from '../../data/hero';
import { programs } from '../../data/landing';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { revealItem, revealScope, useInView } from './useInView';
import './sections.css';

/** Auto-advance period; the ring around the play button fills over the same time. */
const SLIDE_MS = 7000;

/**
 * "Авторские программы" (design 2026-10-22): heading + "Есть другой запрос?" card inside the gold grid frame,
 * then one 1176×356 photo card per program that cross-fades (autoplay with a progress ring, arrows, dots).
 */
export function Programs() {
  const { ref, inView } = useInView<HTMLElement>();
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const { items, request, surgeon } = programs;
  const count = items.length;
  const running = playing && !hovered && inView && !reducedMotion;

  // Time left on the current slide: hover / pause / scrolling away only freeze it, a slide change resets it.
  const remaining = useRef(SLIDE_MS);

  const go = (step: number) => setActive((i) => (i + step + count) % count);

  // Declared before the timer so that on a slide change the reset runs before the new countdown starts.
  useEffect(() => {
    remaining.current = SLIDE_MS;
  }, [active]);

  useEffect(() => {
    if (!running) return;
    const started = performance.now();
    const t = window.setTimeout(() => setActive((i) => (i + 1) % count), remaining.current);
    return () => {
      window.clearTimeout(t);
      remaining.current = Math.max(0, remaining.current - (performance.now() - started));
    };
  }, [active, running, count]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      go(e.key === 'ArrowRight' ? 1 : -1);
    }
  };

  return (
    <section
      ref={ref}
      id={programs.id}
      aria-labelledby="programs-title"
      className="rr-section rr-programs relative bg-white pt-8 text-neutral-900 max-md:pt-4"
      {...revealScope(inView)}
    >
      <div className="mx-auto max-w-[1440px] px-(--sec-pad) pb-[60px] max-md:pb-12">
        <div className="relative px-8 max-md:px-0">
          <div className="flex h-[196px] items-start justify-between gap-10 max-md:h-auto max-md:flex-col max-md:gap-0">
            <div className="pt-[34px] max-md:pt-6">
              <p className="rr-eyebrow max-md:!text-[11px]" {...revealItem(0)}>
                {programs.eyebrow}
              </p>
              <h2
                id="programs-title"
                className="mt-[17px] font-display text-[36px] leading-[44px] font-normal tracking-[-0.02em] text-[#1b1919] max-md:mt-3 max-md:text-[26px] max-md:leading-8"
                {...revealItem(1)}
              >
                {programs.title}
              </h2>
              <p
                className="mt-[7px] max-w-[540px] font-text text-[18px] leading-[20px] text-[#625f5e] max-md:text-[14px] max-md:leading-[18px]"
                {...revealItem(2)}
              >
                {programs.text}
              </p>
            </div>

            <div
              className="rr-request mt-[33px] h-[130px] w-[373px] shrink-0 rounded-[24px] px-6 pt-[22px] max-md:mt-5 max-md:h-auto max-md:w-full max-md:rounded-[20px] max-md:px-4 max-md:py-4"
              {...revealItem(3)}
            >
              <h3 className="font-display text-[26.5px] leading-[32px] font-light tracking-[-0.03em] text-[#8b6a3e] max-md:text-[20px] max-md:leading-6">{request.title}</h3>
              <p className="mt-[9px] font-text text-[16px] leading-[17px] tracking-[-0.02em] text-[#8c7a66] max-md:mt-1.5 max-md:text-[13px]">
                <a
                  href={heroData.clinic.whatsappHref || request.link.href}
                  target={heroData.clinic.whatsappHref ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="rr-request__link underline decoration-1 underline-offset-2"
                >
                  {request.link.label}
                </a>{' '}
                {request.text}
              </p>
            </div>
          </div>

          <div
            className="rr-prog relative mt-8 h-[356px] overflow-hidden rounded-[56px] bg-[#9c8270] outline-offset-4 max-md:mt-6 max-md:h-[540px] max-md:rounded-[24px]"
            role="region"
            aria-roledescription="карусель"
            aria-label={programs.eyebrow}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            {...revealItem(4)}
          >
            {items.map((item, i) => {
              const isActive = i === active;
              return (
                <div
                  key={item.title}
                  className="rr-prog__slide absolute inset-0"
                  data-active={isActive || undefined}
                  aria-roledescription="слайд"
                  aria-label={`${i + 1} из ${count}: ${item.title}`}
                  aria-hidden={!isActive}
                  inert={!isActive}
                >
                  <img
                    src={asset(item.image.src)}
                    width={item.image.width}
                    height={item.image.height}
                    alt={item.image.alt}
                    loading="lazy"
                    decoding="async"
                    className="rr-prog__img absolute inset-0 -z-10 size-full object-cover max-md:object-[78%_center]"
                  />

                  <div className="rr-prog__text absolute top-9 left-10 text-white max-md:top-6 max-md:right-5 max-md:left-5">
                    <p className="font-text text-[18px] leading-6 max-md:text-[14px] max-md:leading-5">{item.kicker}</p>
                    <h3 className="mt-[9px] font-display text-[40px] leading-[48px] font-light tracking-[-0.01em] max-md:mt-1 max-md:text-[28px] max-md:leading-[34px]">
                      {item.title}
                    </h3>
                    <ul className="mt-[13px] list-disc pl-[20px] font-text text-[16px] leading-[18px] marker:text-[13px] max-md:text-[14px] max-md:leading-[19px]">
                      {item.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rr-prog__ctas absolute bottom-[37px] left-10 flex items-center gap-[24px] max-md:right-5 max-md:bottom-5 max-md:left-5 max-md:flex-col max-md:items-stretch max-md:gap-3">
                    <a
                      href={heroData.clinic.whatsappHref || '#contacts'}
                      target={heroData.clinic.whatsappHref ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="rr-prog__consult inline-flex h-12 items-center gap-2.5 rounded-pill pr-6 pl-5 font-display text-[15px] leading-6 text-[#2e2c2c] max-md:justify-center"
                    >
                      <img src={asset('assets/icons/whatsapp.svg')} width={20} height={20} alt="" className="size-5" />
                      {programs.consultLabel}
                    </a>
                    <a
                      href={surgeon.href}
                      className="rr-prog__surgeon font-display text-[15px] leading-6 text-white max-md:text-center"
                    >
                      {surgeon.label} <span aria-hidden="true">→</span>
                    </a>
                  </div>
                </div>
              );
            })}

            {/* Controls: autoplay toggle with progress ring, prev, next (32 px, 5 px apart) */}
            <div className="absolute right-[38px] bottom-[33px] flex gap-[5px] max-md:hidden">
              <button
                type="button"
                className="rr-prog__btn rr-prog__play relative grid size-8 place-items-center rounded-full"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? 'Остановить автопрокрутку' : 'Запустить автопрокрутку'}
                aria-pressed={!playing}
              >
                <svg className="absolute -inset-px size-[34px] -rotate-90" viewBox="0 0 34 34" aria-hidden="true">
                  <circle
                    key={active}
                    className="rr-prog__ring"
                    cx="17"
                    cy="17"
                    r="16"
                    pathLength={1}
                    data-running={running || undefined}
                    style={{ '--slide-ms': `${SLIDE_MS}ms` } as CSSProperties}
                  />
                </svg>
                {playing ? (
                  <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
                    <rect x="1" width="2.6" height="12" rx="0.8" fill="#fff" />
                    <rect x="6.4" width="2.6" height="12" rx="0.8" fill="#fff" />
                  </svg>
                ) : (
                  <svg width="11" height="13" viewBox="0 0 11 13" aria-hidden="true">
                    <path d="M1 1.2v10.6c0 .6.6.9 1.1.6l8.2-5.3a.7.7 0 0 0 0-1.2L2.1.6C1.6.3 1 .6 1 1.2Z" fill="#fff" />
                  </svg>
                )}
              </button>
              {[-1, 1].map((step) => (
                <button
                  key={step}
                  type="button"
                  className="rr-prog__btn rr-prog__arrow grid size-8 place-items-center rounded-full"
                  onClick={() => go(step)}
                  aria-label={step < 0 ? 'Предыдущая программа' : 'Следующая программа'}
                >
                  <svg width="8" height="12" viewBox="0 0 8 12" aria-hidden="true">
                    <path
                      d={step < 0 ? 'M6 1.5 1.8 6 6 10.5' : 'M2 1.5 6.2 6 2 10.5'}
                      fill="none"
                      stroke="#1b1919"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-[18px] flex justify-center gap-2.5" {...revealItem(5)}>
            {items.map((item, i) => (
              <button
                key={item.title}
                type="button"
                className="rr-prog__dot relative size-[5px] rounded-full"
                data-active={i === active || undefined}
                onClick={() => setActive(i)}
                aria-label={item.title}
                aria-current={i === active || undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
