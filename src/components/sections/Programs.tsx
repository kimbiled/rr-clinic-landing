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
          className="mt-[30px] font-display text-[40px] leading-[44px] font-normal tracking-[-0.025em] text-[#1b1919]"
          {...revealItem(1)}
        >
          {programs.title}
        </h2>
        <p className="mt-3 font-text text-[16px] leading-5 tracking-[-0.01em] text-[#585656]" {...revealItem(2)}>
          {programs.text}
        </p>

        <ul className="rr-programs mt-[30px] flex h-[510px] gap-4">
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
                <h3 className="font-display text-[28px] leading-8 font-normal tracking-[-0.04em] text-[#1b1919]">
                  {withBreaks(item.title)}
                </h3>
                <p className="mt-2 font-text text-[14px] leading-4 text-[#7c7876]">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
