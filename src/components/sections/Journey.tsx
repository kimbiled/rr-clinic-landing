import { useRef, useState, type KeyboardEvent } from 'react';
import { journey } from '../../data/landing';
import { withBreaks } from './RichText';
import { revealItem, revealScope, useInView } from './useInView';
import './sections.css';

/**
 * "Ваш путь к преображению" (design 2026-10-27): heading + "Для жителей Астаны / Для иногородних" toggle,
 * then five numbered steps in three columns. The toggle swaps the steps (they fade in again on each switch).
 */
export function Journey() {
  const { ref, inView } = useInView<HTMLElement>();
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const { variants } = journey;
  const variant = variants[active];

  const select = (i: number) => {
    setActive(i);
    tabs.current[i]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      select((active + (e.key === 'ArrowRight' ? 1 : -1) + variants.length) % variants.length);
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
        <div className="rr-frame relative px-8 pt-[52px] pb-[64px] max-md:px-0 max-md:pt-10 max-md:pb-12">
          <div className="flex items-start justify-between gap-10 max-md:flex-col max-md:gap-5">
            <div>
              <h2
                id="journey-title"
                className="font-display text-[36px] leading-[44px] font-normal tracking-[-0.02em] text-[#1b1919] max-md:text-[26px] max-md:leading-8"
                {...revealItem(0)}
              >
                {journey.title}
              </h2>
              <p className="mt-[7px] font-text text-[18px] leading-[20px] text-[#625f5e] max-md:text-[14px] max-md:leading-[18px]" {...revealItem(1)}>
                {journey.text}
              </p>
            </div>

            <div
              className="rr-toggle relative mt-[-6px] grid shrink-0 grid-cols-2 rounded-pill p-[7px] max-md:mt-0 max-md:w-full"
              role="tablist"
              aria-label="Маршрут пациента"
              onKeyDown={onKeyDown}
              {...revealItem(2)}
            >
              <span
                className="rr-toggle__thumb absolute top-[7px] bottom-[7px] left-[7px] w-[calc(50%-7px)] rounded-pill"
                style={{ translate: `${active * 100}% 0` }}
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
                  aria-selected={i === active}
                  aria-controls="journey-steps"
                  tabIndex={i === active ? 0 : -1}
                  className="rr-toggle__tab relative h-11 rounded-pill px-6 font-display text-[14px] leading-5 font-medium whitespace-nowrap max-md:h-10 max-md:px-2 max-md:text-[13px]"
                  onClick={() => setActive(i)}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <ol
            key={variant.id}
            id="journey-steps"
            role="tabpanel"
            aria-labelledby={`journey-tab-${variant.id}`}
            className="rr-journey__steps mt-[46px] grid grid-cols-3 gap-x-[46px] gap-y-[40px] max-md:mt-8 max-md:grid-cols-1 max-md:gap-y-7"
          >
            {variant.steps.map((step, i) => (
              <li key={step.title} className="rr-journey__step" {...revealItem(3 + i)}>
                <span className="rr-journey__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-[18px] font-display text-[18px] leading-6 font-medium text-[#1b1919] max-md:mt-3 max-md:text-[16px]">{step.title}</h3>
                <p className="mt-[6px] font-text text-[17px] leading-[22px] text-[#625f5e] max-md:text-[14px] max-md:leading-5 max-md:[&_br]:hidden">
                  {withBreaks(step.text)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
