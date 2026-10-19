import { trust } from '../../data/landing';
import { RichText } from './RichText';
import { revealItem, revealScope, useInView } from './useInView';
import './sections.css';

/** "Почему нам доверяют" (Figma 1730:5971, 1440×314): headline + four reasons, one per line. */
export function Trust() {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section
      ref={ref}
      id={trust.id}
      aria-labelledby="trust-title"
      className="rr-section relative bg-white"
      {...revealScope(inView)}
    >
      <div className="mx-auto max-w-[1440px] px-(--sec-pad) pt-[57px] pb-[55px]">
        <h2
          id="trust-title"
          className="font-display text-[40px] leading-[42px] font-normal tracking-[-0.045em] text-gold-950"
          {...revealItem(0)}
        >
          <RichText value={trust.title} accentClassName="text-[#c3914d]" />
        </h2>
        <ul className="mt-[56px] font-text text-[20px] leading-[26px] font-normal tracking-[-0.02em] text-[#625f5e]">
          {trust.points.map((point, i) => (
            <li key={point} {...revealItem(1 + i)}>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
