import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { asset, heroData } from '../../data/hero';
import { programs, type ProgramIcon as ProgramIconName } from '../../data/landing';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { CategoryIcon } from './Operations';
import { revealItem, revealScope, useInView } from './useInView';
import { whatsappLink } from './whatsapp';
import './sections.css';

/** Auto-advance period; the ring around the play button fills over the same time. */
const SLIDE_MS = 7000;

/** 20 px line icons for the program points that the operations list has no icon for (phone design). */
const PROGRAM_ICONS: Partial<Record<ProgramIconName, ReactNode>> = {
  clipboard: (
    <>
      <rect x="4.5" y="3.5" width="11" height="14" rx="1.6" />
      <path d="M8 3.5V2.6c0-.3.3-.6.6-.6h2.8c.3 0 .6.3.6.6v.9M7.5 8h5M7.5 11h5M7.5 14h3" />
    </>
  ),
  drip: (
    <>
      <path d="M7 2.5h6M8 2.5v3.5a2 2 0 0 0 4 0V2.5M10 8v3" />
      <path d="M10 11c-1.4 1.6-2.2 2.8-2.2 3.8a2.2 2.2 0 0 0 4.4 0c0-1-.8-2.2-2.2-3.8ZM15 4v13.5" />
    </>
  ),
  combo: <path d="M10 2.5v4M10 13.5v4M2.5 10h4M13.5 10h4M5 5l2.5 2.5M12.5 12.5 15 15M15 5l-2.5 2.5M7.5 12.5 5 15" />,
  calendar: (
    <>
      <rect x="2.5" y="4" width="15" height="13.5" rx="2" />
      <path d="M2.5 8.5h15M6.5 2.5v3M13.5 2.5v3M7 12.5l2 2 4-4" />
    </>
  ),
  car: (
    <>
      <path d="M3 13.5V10l1.6-4c.3-.7.9-1 1.6-1h7.6c.7 0 1.3.3 1.6 1L17 10v3.5H3ZM3 10h14" />
      <path d="M4.5 13.5v2M15.5 13.5v2M6 11.8h.01M14 11.8h.01" />
    </>
  ),
  hotel: <path d="M2.5 16V5M2.5 12.5h15V16M17.5 12.5V10a2 2 0 0 0-2-2H9v4.5M5.8 10.3a1.3 1.3 0 1 0 0-.01" />,
  nurse: (
    <>
      <circle cx="10" cy="7.5" r="3" />
      <path d="M4 17.5c.5-3 3-4.8 6-4.8s5.5 1.8 6 4.8M7 3.5c1.8-1.3 4.2-1.3 6 0M10 2.2v2" />
    </>
  ),
  headset: (
    <>
      <path d="M4 11V9.5a6 6 0 0 1 12 0V11" />
      <rect x="3" y="11" width="3" height="4.5" rx="1.2" />
      <rect x="14" y="11" width="3" height="4.5" rx="1.2" />
      <path d="M15.5 15.5c0 1.2-1.4 2-3.5 2H10" />
    </>
  ),
  video: (
    <>
      <rect x="2.5" y="5.5" width="11" height="9" rx="2" />
      <path d="m13.5 9 4-2.2v6.4l-4-2.2" />
    </>
  ),
};

function ProgramIcon({ name }: { name: ProgramIconName }) {
  const own = PROGRAM_ICONS[name];
  if (!own) return <CategoryIcon name={name as Parameters<typeof CategoryIcon>[0]['name']} />;
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {own}
    </svg>
  );
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
 * "Авторские программы" (design 2026-10-22): heading + "Есть другой запрос?" card inside the gold grid frame,
 * then one 1176×356 photo card per program that cross-fades (autoplay with a progress ring, arrows, dots).
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
                              <span className="text-[#c39b62]">
                                <ProgramIcon name={item.icons[j] ?? 'body'} />
                              </span>
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
                className="rr-prog relative mt-8 h-[356px] overflow-hidden rounded-[56px] bg-[#9c8270] outline-offset-4"
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
                        className="rr-prog__img absolute inset-0 -z-10 size-full object-cover"
                      />

                      <div className="rr-prog__text absolute top-9 left-10 text-white">
                        <p className="font-text text-[18px] leading-6">{item.kicker}</p>
                        <h3 className="mt-[9px] font-display text-[40px] leading-[48px] font-light tracking-[-0.01em]">
                          {item.title}
                        </h3>
                        <ul className="mt-[13px] list-disc pl-[20px] font-text text-[16px] leading-[18px] marker:text-[13px]">
                          {item.points.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="rr-prog__ctas absolute bottom-[37px] left-10 flex items-center gap-[24px]">
                        <a
                          href={heroData.clinic.whatsappHref || '#contacts'}
                          target={heroData.clinic.whatsappHref ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          className="rr-prog__consult inline-flex h-12 items-center gap-2.5 rounded-pill pr-6 pl-5 font-display text-[15px] leading-6 text-[#2e2c2c]"
                        >
                          <img
                            src={asset('assets/icons/whatsapp.svg')}
                            width={20}
                            height={20}
                            alt=""
                            className="size-5"
                          />
                          {programs.consultLabel}
                        </a>
                        <a
                          href={surgeon.href}
                          className="rr-prog__surgeon font-display text-[15px] leading-6 text-white"
                        >
                          {surgeon.label} <span aria-hidden="true">→</span>
                        </a>
                      </div>
                    </div>
                  );
                })}

                {/* Controls: autoplay toggle with progress ring, prev, next (32 px, 5 px apart) */}
                <div className="absolute right-[38px] bottom-[33px] flex gap-[5px]">
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
