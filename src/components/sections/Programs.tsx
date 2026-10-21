import { asset } from '../../data/hero';
import { programs } from '../../data/landing';
import { withBreaks } from './RichText';
import { revealItem, revealScope, useInView } from './useInView';
import './sections.css';

/**
 * "Авторские программы" (design 2026-10): heading block + a row of tall cards. One card is open
 * (wider, deeper tone): the first by default, then whichever the pointer is on.
 */
export function Programs() {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section
      ref={ref}
      id={programs.id}
      aria-labelledby="programs-title"
      className="rr-section relative bg-white text-neutral-900"
      {...revealScope(inView)}
    >
      <div className="mx-auto max-w-[1440px] px-(--sec-pad) pt-[42px] pb-[100px]">
        <p className="rr-eyebrow" {...revealItem(0)}>
          {programs.eyebrow}
        </p>
        <h2
          id="programs-title"
          className="mt-[30px] font-display text-[40px] leading-[48px] font-normal text-[#1b1919]"
          {...revealItem(1)}
        >
          {programs.title}
        </h2>
        <p className="mt-3 max-w-[843px] font-text text-[18px] leading-[1.2] text-[#625f5e]" {...revealItem(2)}>
          {programs.text}
        </p>

        {/* Runs to the right edge like the design (511 / 400 / 400 at 1440) */}
        <ul className="rr-programs mt-[30px] mr-[calc(-1*var(--sec-pad))] flex h-[510px] gap-4">
          {programs.items.map((item, i) => (
            <li key={item.title} className="rr-program relative overflow-hidden rounded-[24px]" {...revealItem(3 + i)}>
              {item.image && (
                <img
                  src={asset(item.image.src)}
                  width={item.image.width}
                  height={item.image.height}
                  alt={item.image.alt}
                  loading="lazy"
                  decoding="async"
                  className="rr-program__img absolute inset-0 size-full object-cover"
                />
              )}
              <div className="absolute inset-x-6 bottom-[22px]">
                <h3 className="font-display text-[28px] leading-[1.15] font-normal tracking-[-0.02em] text-[#1b1919]">
                  {withBreaks(item.title)}
                </h3>
                <p className="mt-2 font-text text-[14px] leading-[1.2] text-[#625f5e]">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
