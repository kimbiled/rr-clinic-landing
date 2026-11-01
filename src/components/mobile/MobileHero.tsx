import { asset } from '../../data/hero';
import { mobileHero } from '../../data/mobileHero';
import { ParticlesCanvas } from '../fx/ParticlesCanvas';
import { CtaButton } from '../hero/CtaButton';
import { useHero } from '../hero/HeroContext';
import { openSurgeonMenu, useSurgeonMenuTrigger } from '../surgeon-menu/menuTrigger';
import { MobileCases } from './MobileCases';
import './mobile.css';

/**
 * Five gold stars; the last one shows the fraction of the rating. A star has almost no area in its right
 * tip, so a literal 90 % fill reads as a full star — the fraction is mapped onto the visible 15–75 % of its
 * width (4.9 → 69 %, as in the design), the rest stays grey.
 */
function Stars({ value, max }: { value: number; max: number }) {
  const STAR = 'M8 1.2l2.06 4.3 4.72.6-3.47 3.27.9 4.68L8 11.77 3.8 14.05l.9-4.68L1.22 6.1l4.72-.6z';
  return (
    <span className="flex gap-[7px]" aria-hidden="true">
      {Array.from({ length: max }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        const visible = fill >= 1 ? 100 : fill <= 0 ? 0 : 15 + fill * 60;
        return (
          <span key={i} className="relative size-4">
            <svg viewBox="0 0 16 16" className="absolute inset-0 size-full">
              <path d={STAR} fill="#5a5552" stroke="#5a5552" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            <svg viewBox="0 0 16 16" className="absolute inset-0 size-full" style={{ clipPath: `inset(0 ${100 - visible}% 0 0)` }}>
              <path d={STAR} fill="#dcb46e" stroke="#dcb46e" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </span>
        );
      })}
    </span>
  );
}

/**
 * Phone hero (design 2026-10-22, "01_Hero" 393 px): header (logo, phone, menu button), the statue over the
 * columns, location chip, headline, consultation CTA and the 2GIS row; then a white sheet with "Смотреть работы"
 * (before/after cases) and the clinic line. Replaces the desktop stage + navbar below 768 px.
 */
export function MobileHero() {
  const { data, surgeonMenuOpen, setSurgeonMenuOpen } = useHero();
  const { hero, clinic } = data;
  const { rating } = clinic;
  const menuTrigger = useSurgeonMenuTrigger('nav', surgeonMenuOpen);
  const ratingValue = rating.value.toFixed(1);
  const ratingSource = rating.source === '2GIS' ? '2ГИС' : rating.source;
  const { address } = mobileHero;

  return (
    <section id="hero" aria-label={clinic.name} className="m-hero relative overflow-hidden bg-[#44382e] text-white">
      <div className="relative h-[673px]">
        <img
          src={asset(hero.background.src)}
          alt=""
          fetchPriority="high"
          className="m-hero__bg pointer-events-none absolute inset-x-0 top-0 h-[560px] w-full max-w-none object-cover"
          aria-hidden="true"
        />
        <img
          src={asset(hero.statue.src)}
          alt=""
          fetchPriority="high"
          className="m-hero__statue pointer-events-none absolute top-[59px] h-[399px] w-[715px] max-w-none"
          aria-hidden="true"
        />
        <div className="m-hero__shade pointer-events-none absolute inset-0" aria-hidden="true" />
        {/* Same gold dust as the desktop stage; z-auto keeps it under the header, text and CTA that follow */}
        <ParticlesCanvas className="z-auto" />

        {/* Header: logo · phone · menu */}
        <div className="absolute inset-x-4 top-[31px] flex h-[42px] items-center justify-between">
          <a href="#hero" aria-label={`${clinic.name} — на главную`} className="block">
            <img src={asset('assets/icons/logo.svg')} width={44} height={40} alt="" className="h-10 w-11" />
          </a>
          <a href={clinic.phoneHref} className="absolute left-1/2 -translate-x-1/2 font-text text-[14px] leading-4 tracking-[-0.01em] whitespace-nowrap">
            {clinic.phone}
          </a>
          <button
            type="button"
            className="m-hero__menu grid size-[42px] place-items-center rounded-full bg-white"
            aria-label="Меню"
            {...menuTrigger}
            onClick={(e) => openSurgeonMenu(e.currentTarget, setSurgeonMenuOpen, 'nav')}
          >
            <svg viewBox="0 0 16 12" width={16} height={12} fill="none" aria-hidden="true">
              <path d="M1 1.5h14M4 6h11M8 10.5h7" stroke="#2e2c2c" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="m-hero__chip absolute top-[283px] left-1/2 flex h-[38px] w-[min(330px,calc(100%-32px))] -translate-x-1/2 items-center justify-center gap-2.5 rounded-[10px] font-text text-[14px] leading-none font-medium tracking-[-0.015em] whitespace-nowrap">
          <svg viewBox="0 0 12 15" width={12} height={15} aria-hidden="true">
            <path d="M6 0a6 6 0 0 0-6 6c0 4.2 5.1 8.5 5.4 8.7a.9.9 0 0 0 1.2 0C6.9 14.5 12 10.2 12 6a6 6 0 0 0-6-6Zm0 8.3A2.3 2.3 0 1 1 6 3.7a2.3 2.3 0 0 1 0 4.6Z" fill="#fff" />
          </svg>
          <span>
            {address.before}
            <span className="text-[#f1da96]">{address.city}</span>
            {address.after}
          </span>
        </p>

        <h1 className="absolute inset-x-4 top-[338px] text-center font-display text-[28px] leading-8 font-normal tracking-[-0.02em]">
          {mobileHero.titleLines.map((line, i) => (
            <span key={line} className="block">
              {i === mobileHero.titleLines.length - 1 ? line.replace(/^(\S{1,2}) /, '$1\u00a0') : line}
            </span>
          ))}
        </h1>

        <div className="absolute top-[452px] left-1/2 w-[min(330px,calc(100%-32px))] -translate-x-1/2">
          <CtaButton
            variant="primary"
            label={mobileHero.ctaLabel}
            data-analytics-id="hero_consultation"
            href={clinic.whatsappHref || '#contacts'}
            target={clinic.whatsappHref ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="m-hero__cta h-[54px]! w-full px-4! font-text! text-[16px]! leading-none! font-medium! tracking-normal!"
          />
        </div>

        <span className="absolute inset-x-0 top-[526px] h-px bg-white/10" aria-hidden="true" />
        <div className="m-hero__band absolute inset-x-0 top-[527px] bottom-0" aria-hidden="true" />

        <a
          href={rating.url ?? '#contacts'}
          target={rating.url ? '_blank' : undefined}
          rel="noopener noreferrer"
          className="m-hero__rating absolute inset-x-4 top-[542px] flex items-center"
          aria-label={`Рейтинг в ${ratingSource}: ${ratingValue} из ${rating.max ?? 5}${rating.url ? ' (открывается в новой вкладке)' : ''}`}
        >
          <img src={asset(rating.logo.src)} width={42} height={42} alt="" className="size-[42px] rounded-[9px]" />
          <span className="ml-3 flex flex-col gap-[6px]" aria-hidden="true">
            <span className="font-text text-[13px] leading-[13px] text-white/65">
              {ratingSource} <span className="mx-0.5">•</span> <span className="text-white">{ratingValue}</span>
            </span>
            <Stars value={rating.value} max={rating.max ?? 5} />
          </span>
          <span className="m-hero__rating-arrow ml-auto grid size-[46px] place-items-center rounded-full" aria-hidden="true">
            <svg viewBox="0 0 8 12" width={7} height={11} fill="none">
              <path d="M1.5 1.5 6 6l-4.5 4.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>
      </div>

      {/* White sheet over the brown band */}
      <div id="cases-mobile" className="relative -mt-10 rounded-t-[28px] bg-white px-4 pt-9 pb-10 text-[#2e2c2c]">
        <h2 className="text-center font-display text-[32px] leading-[1.1] font-normal tracking-[-0.02em]">
          {mobileHero.worksTitle[0]} <span className="text-[#b3a697]">{mobileHero.worksTitle[1]}</span>
        </h2>
        <div className="mt-[31px]">
          <MobileCases />
        </div>
        <p className="mt-[13px] w-[min(370px,calc(100vw-23px))] font-text text-[16px] leading-[1.15] tracking-[-0.02em] text-[#1b1919] opacity-80">
          {hero.subtitle}
        </p>
      </div>
    </section>
  );
}
