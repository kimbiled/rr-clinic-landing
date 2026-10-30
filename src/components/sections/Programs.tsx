import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { asset, heroData } from '../../data/hero';
import { programs, type ProgramIcon as ProgramIconName } from '../../data/landing';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { revealItem, revealScope, useInView } from './useInView';
import { whatsappLink } from './whatsapp';
import './sections.css';

/** Auto-advance period; the ring around the play button fills over the same time. */
const SLIDE_MS = 7000;

/** 20 px gold line icon before a program point. */
function ProgramIcon({ name }: { name: ProgramIconName }) {
  return <img src={asset(`assets/icons/program-${name}.svg`)} width={20} height={20} alt="" className="size-5 shrink-0" />;
}

const PlayIcon = ({ playing, color }: { playing: boolean; color: string }) =>
  playing ? (
    <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
      <rect x="1" width="2.6" height="12" rx="0.8" fill={color} />
      <rect x="6.4" width="2.6" height="12" rx="0.8" fill={color} />
    </svg>
  ) : (
    <svg width="11" height="13" viewBox="0 0 11 13" aria-hidden="true">
      <path d="M1 1.2v10.6c0 .6.6.9 1.1.6l8.2-5.3a.7.7 0 0 0 0-1.2L2.1.6C1.6.3 1 .6 1 1.2Z" fill={color} />
    </svg>
  );

/**
 * "Авторские программы" (design 2026-10-30): heading + "Есть другой запрос?" card, then one 1240×460 photo card per
 * program with a white panel on it; the cards cross-fade (autoplay with a progress ring, arrows, dots).
 */
export function Programs() {
  const { ref, inView } = useInView<HTMLElement>();
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
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

  const requestCard = (
    <div className="rr-request mt-[33px] h-[130px] w-[373px] shrink-0 rounded-[24px] px-6 pt-[22px] max-md:mt-6 max-md:h-auto max-md:w-full max-md:rounded-[20px] max-md:px-4 max-md:py-4">
      <h3 className="font-display text-[26.5px] leading-[32px] font-light tracking-[-0.03em] text-[#8b6a3e] max-md:text-[20px] max-md:leading-6">
        {request.title}
      </h3>
      <p className="mt-[9px] font-text text-[16px] leading-[17px] tracking-[-0.02em] text-[#8c7a66] max-md:mt-1.5 max-md:text-[13px]">
        <a
          href={heroData.clinic.whatsappHref || request.link.href}
          data-analytics-id="custom_request"
          target={heroData.clinic.whatsappHref ? '_blank' : undefined}
          rel="noopener noreferrer"
          className="rr-request__link underline decoration-1 underline-offset-2"
        >
          {request.link.label}
        </a>{' '}
        {request.text}
      </p>
    </div>
  );

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
        <div className="relative">
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

            {!isMobile && requestCard}
          </div>

          {isMobile ? (
            <>
              {/* Phones (design 2026-10-29): white panel with the points over the photo, surgeon link + WhatsApp at
                  the bottom; play / ← → under the card; "Есть другой запрос?" after the slider */}
              <div
                className="relative mt-6 h-[576px] overflow-hidden rounded-[24px] bg-[#9c8270]"
                role="region"
                aria-roledescription="карусель"
                aria-label={programs.eyebrow}
                {...revealItem(4)}
              >
                {items.map((item, i) => {
                  const isActive = i === active;
                  const image = item.mobileImage ?? item.image;
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
                        src={asset(image.src)}
                        width={image.width}
                        height={image.height}
                        alt={image.alt}
                        loading="lazy"
                        decoding="async"
                        className={item.mobileImage
                          ? 'rr-prog__img absolute inset-0 -z-10 h-full w-full object-cover object-center'
                          : 'rr-prog__img rr-mprog__img absolute inset-x-0 bottom-0 -z-10 h-[360px] w-full object-cover object-[92%_center]'}
                      />
                      <div className="absolute inset-x-[15px] top-[15px] rounded-[20px] bg-white px-4 pt-[18px] pb-5 text-[#1b1919]">
                        <p className="font-text text-[13px] leading-4 text-[#8c8784]">{item.kicker}</p>
                        <h3 className="mt-2 font-display text-[30px] leading-[36px] font-light tracking-[-0.01em]">
                          {item.title}
                        </h3>
                        <ul className="mt-4 flex flex-col gap-3">
                          {item.points.map((point, j) => (
                            <li
                              key={point}
                              className="flex items-center gap-3 font-text text-[13px] leading-4 text-[#625f5e]"
                            >
                              <ProgramIcon name={item.icons[j]} />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="absolute inset-x-[15px] bottom-[15px] flex items-center justify-between">
                        <a
                          href={surgeon.href}
                          className="rr-prog__surgeon font-display text-[17px] leading-6 text-white"
                        >
                          {surgeon.label} <span aria-hidden="true">→</span>
                        </a>
                        <a
                          {...whatsappLink(`Здравствуйте! Хочу узнать о программе «${item.title}»`)}
                          data-analytics-id={`program_consultation_${i + 1}`}
                          className="rr-prog__consult grid h-[43px] w-[58px] place-items-center rounded-pill"
                          aria-label={`${programs.consultLabel}: ${item.title}`}
                        >
                          <img
                            src={asset('assets/icons/whatsapp.svg')}
                            width={22}
                            height={22}
                            alt=""
                            className="size-[22px]"
                          />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-4" {...revealItem(5)}>
                <button
                  type="button"
                  className="rr-mprog__play relative grid size-14 shrink-0 place-items-center rounded-full"
                  onClick={() => setPlaying((p) => !p)}
                  aria-label={playing ? 'Остановить автопрокрутку' : 'Запустить автопрокрутку'}
                  aria-pressed={!playing}
                >
                  <svg className="absolute inset-0 size-14 -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
                    <circle
                      key={active}
                      className="rr-prog__ring rr-mprog__ring"
                      cx="28"
                      cy="28"
                      r="27"
                      pathLength={1}
                      data-running={running || undefined}
                      style={{ '--slide-ms': `${SLIDE_MS}ms` } as CSSProperties}
                    />
                  </svg>
                  <PlayIcon playing={playing} color="#c9a463" />
                </button>
                <span className="h-px flex-1 bg-[#dbbb7f]" aria-hidden="true" />
                {[-1, 1].map((step) => (
                  <button
                    key={step}
                    type="button"
                    className="m-cases__nav m-cases__nav--next grid size-14 shrink-0 place-items-center rounded-full"
                    onClick={() => go(step)}
                    aria-label={step < 0 ? 'Предыдущая программа' : 'Следующая программа'}
                  >
                    <svg
                      viewBox="0 0 22 16"
                      width={22}
                      height={16}
                      fill="none"
                      aria-hidden="true"
                      className={step < 0 ? 'rotate-180' : undefined}
                    >
                      <path
                        d="M1 8h19M13.5 1.5 20 8l-6.5 6.5"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ))}
              </div>

              {requestCard}
            </>
          ) : (
            <>
              <div
                className="rr-prog relative mt-8 h-[460px] overflow-hidden rounded-[56px] bg-[#9c8270] outline-offset-4"
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
                        className="rr-prog__img absolute inset-0 -z-10 size-full object-cover object-right"
                      />

                      <div className="rr-prog__panel absolute top-[42px] bottom-[42px] left-[42px] flex w-[590px] flex-col rounded-[28px] bg-white px-[34px] pt-[30px] pb-[24px] text-[#1b1919]">
                        <p className="font-text text-[15px] leading-5 text-[#a4a09d]">{item.kicker}</p>
                        <h3 className="mt-1.5 font-display text-[36px] leading-[44px] font-light tracking-[-0.01em]">{item.title}</h3>
                        <ul className="mt-3 flex flex-col gap-3 font-text text-[16px] leading-5 text-[#625f5e]">
                          {item.points.map((point, j) => (
                            <li key={point} className="flex items-center gap-3">
                              <ProgramIcon name={item.icons[j]} />
                              {point}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-auto flex items-center gap-[11px]">
                          <a
                            href={heroData.clinic.whatsappHref || '#contacts'}
                            data-analytics-id={`program_consultation_${i + 1}`}
                            target={heroData.clinic.whatsappHref ? '_blank' : undefined}
                            rel="noopener noreferrer"
                            className="rr-prog__gold inline-flex h-[58px] flex-1 items-center justify-center gap-2.5 rounded-pill font-display text-[15px] leading-6 text-white"
                          >
                            <img
                              src={asset('assets/icons/whatsapp.svg')}
                              width={20}
                              height={20}
                              alt=""
                              className="size-5 brightness-0 invert"
                            />
                            {programs.consultLabel}
                          </a>
                          <a
                            href={surgeon.href}
                            className="rr-prog__light inline-flex h-[58px] flex-1 items-center justify-center rounded-pill font-display text-[15px] leading-6 text-[#2e2c2c]"
                          >
                            {surgeon.label}
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Controls: autoplay toggle with progress ring, prev, next (32 px, 5 px apart) */}
                <div className="absolute right-[42px] bottom-[42px] flex gap-[5px]">
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
                    <PlayIcon playing={playing} color="#fff" />
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
            </>
          )}
        </div>
      </div>
    </section>
  );
}
