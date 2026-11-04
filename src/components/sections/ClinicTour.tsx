import { asset } from '../../data/hero';
import { clinicTour } from '../../data/landing';
import { revealItem, revealScope, useInView } from './useInView';
import './sections.css';

/**
 * "Знакомство с RR Clinic" (design 2026-11-04): heading and a photo grid of the clinic on a beige band, before the FAQ.
 * Desktop: 3 columns, rows 236 / 236 / 326 at 1440 — the facade two rows tall on the left, the hall two columns wide
 * at the bottom; auto-placement puts the rest in order. Phones: two columns, the facade across both.
 */
export function ClinicTour() {
  const { ref, inView } = useInView<HTMLElement>();
  const last = clinicTour.items.length - 1;

  return (
    <section
      ref={ref}
      id={clinicTour.id}
      aria-labelledby="clinic-tour-title"
      className="rr-section bg-[#f5f2ef] text-neutral-900"
      {...revealScope(inView)}
    >
      <div className="mx-auto max-w-[1440px] px-(--sec-pad) pt-[52px] pb-[60px] max-md:pt-10 max-md:pb-10">
        <h2
          id="clinic-tour-title"
          className="font-display text-[40px] leading-[48px] font-normal tracking-[-0.02em] text-[#1b1919] max-md:text-[28px] max-md:leading-9"
          {...revealItem(0)}
        >
          {clinicTour.title}
        </h2>
        <p className="mt-3 font-text text-[15px] leading-[20px] text-[#625f5e] max-md:mt-2 max-md:text-[13px] max-md:leading-[17px]" {...revealItem(1)}>
          {clinicTour.text}
        </p>

        <ul
          className="mt-9 grid grid-cols-3 grid-rows-[236px_236px_326px] gap-3 max-lg:grid-rows-[200px_200px_280px] max-md:mt-5 max-md:grid-cols-2 max-md:grid-rows-none max-md:auto-rows-[150px] max-md:gap-2"
          {...revealItem(2)}
        >
          {clinicTour.items.map((item, i) => (
            <li
              key={item.label}
              className={`rr-tour relative overflow-hidden rounded-[18px] bg-[#e6dfd8] max-md:rounded-[14px] ${
                i === 0 ? 'row-span-2 max-md:col-span-2' : ''
              } ${i === last ? 'col-span-2 max-md:col-span-1' : ''}`}
            >
              <img
                src={asset(item.image.src)}
                width={item.image.width}
                height={item.image.height}
                alt={item.image.alt}
                loading="lazy"
                decoding="async"
                className="rr-tour__img absolute inset-0 size-full object-cover"
              />
              <span className="rr-tour__blur pointer-events-none absolute inset-0" aria-hidden="true" />
              <span className="rr-tour__shade pointer-events-none absolute inset-0" aria-hidden="true" />
              <p className="absolute bottom-5 left-5 font-text text-[17px] leading-5 font-medium text-white max-md:bottom-3 max-md:left-3 max-md:text-[13px] max-md:leading-4">
                {item.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
