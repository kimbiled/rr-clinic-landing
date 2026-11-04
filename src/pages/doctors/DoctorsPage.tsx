import { useState } from 'react';
import { asset, heroData } from '../../data/hero';
import { DoctorCard } from '../../components/team/DoctorCard';
import { Faq } from '../../components/sections/Faq';
import { Footer } from '../../components/sections/Footer';
import { whatsappLink } from '../../components/sections/whatsapp';
import { CATEGORIES, SURGEONS, page, surgeonsIn, type CategoryId } from './doctorsData';
import '../../components/sections/sections.css';
import '../../components/team/team.css';
import './doctors.css';

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 1.6a7.4 7.4 0 0 0-6.4 11.1L1.6 16.4l3.8-1a7.4 7.4 0 1 0 3.6-13.8Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path
        d="M6.3 5.5c.2-.4.4-.4.6-.4h.4c.2 0 .3 0 .5.4l.6 1.4c0 .2 0 .3-.1.4l-.4.5c-.1.1-.2.3 0 .5.3.5.7 1 1.1 1.4.5.4 1 .7 1.5.9.2.1.4 0 .5-.1l.5-.6c.1-.2.3-.2.5-.1l1.3.6c.2.1.3.2.3.3 0 .2 0 .8-.4 1.2-.4.4-1.1.6-1.6.5-.9-.1-2.2-.6-3.3-1.6-1-.9-1.7-2-2-2.9-.2-.8 0-1.6.5-2.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Light header of the inner pages: logo, section links back to the home page, phone, "Связаться" + WhatsApp. */
function Header() {
  const { clinic } = heroData;
  return (
    <header className="mx-auto flex h-[80px] max-w-[1440px] items-center gap-6 px-(--sec-pad) max-md:h-16">
      <a href="/" aria-label="RR Clinic — на главную" className="shrink-0">
        <img src={asset('assets/icons/logo-gold.svg')} width={35} height={32} alt="" className="h-8 w-[35px]" />
      </a>
      <nav aria-label="Разделы клиники" className="max-md:hidden">
        <ul className="docs-nav flex h-10 items-center gap-5 rounded-[14px] px-4">
          {page.links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                aria-current={link.href === '/doctors/' ? 'page' : undefined}
                className="docs-nav__link font-text text-[14px] leading-4 font-medium whitespace-nowrap"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="ml-auto flex items-center gap-6 max-md:gap-3">
        <a href={clinic.phoneHref} data-analytics-id="header_phone" className="font-text text-[14px] leading-4 whitespace-nowrap text-[#2e2c2c]">
          {clinic.phone}
        </a>
        <a
          {...whatsappLink('Здравствуйте!')}
          data-analytics-id="header_whatsapp"
          aria-label="Связаться в WhatsApp"
          className="docs-contact flex h-10 items-center gap-1 text-[#2e2c2c]"
        >
          <span className="docs-contact__pill flex h-full items-center rounded-[14px] px-4 font-text text-[14px] font-medium max-md:hidden">
            Связаться
          </span>
          <span className="docs-contact__icon grid size-10 place-items-center rounded-full">
            <WhatsAppIcon />
          </span>
        </a>
      </div>
    </header>
  );
}

/** Five gold stars, the last one filled only as far as the rating reaches (4,9 → 90 %). */
function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative block size-[11px]">
            <svg viewBox="0 0 10 10" className="absolute inset-0 size-full text-[#ece6df]">
              <path d="m5 .6 1.3 2.8 3 .3-2.3 2 .7 3L5 7.2 2.3 8.7l.7-3-2.3-2 3-.3z" fill="currentColor" />
            </svg>
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <svg viewBox="0 0 10 10" className="size-[11px] text-[#f2b230]">
                <path d="m5 .6 1.3 2.8 3 .3-2.3 2 .7 3L5 7.2 2.3 8.7l.7-3-2.3-2 3-.3z" fill="currentColor" />
              </svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** "Все хирурги": a person outline in the filter's disc, like the area icons beside it. */
function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-5 text-[#497f75]">
      <circle cx="10" cy="6.5" r="3.3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.8 17.2c.5-3.4 3.1-5.6 6.2-5.6s5.7 2.2 6.2 5.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function Intro() {
  const { clinic } = heroData;
  const { rating } = clinic;
  return (
    <div className="mx-auto mt-6 grid max-w-[1440px] grid-cols-[1fr_auto] items-start gap-8 px-(--sec-pad) max-md:mt-3 max-md:grid-cols-1 max-md:gap-6">
      <div>
        <div className="flex flex-wrap gap-0.5">
          <span className="docs-chip inline-flex h-[46px] items-center gap-3 rounded-[16px] px-4 font-text text-[16px] text-[#625f5e] max-md:h-10 max-md:px-3 max-md:text-[14px]">
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true" className="text-[#c9c1b8]">
              <path d="M6 0c3.3 0 6 2.7 6 5.9C12 9.2 8.3 13.3 6 13.3S0 9.2 0 5.9C0 2.7 2.7 0 6 0Zm0 3.6a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6Z" fill="currentColor" />
            </svg>
            {clinic.location}
          </span>
          <a
            href={rating.url ?? '#contacts'}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Рейтинг ${rating.value} из ${rating.max} в 2ГИС, ${rating.count} отзывов`}
            className="docs-chip inline-flex h-[46px] items-center gap-2 rounded-[16px] pr-4 pl-3 font-text text-[#2e2c2c] max-md:h-10 max-md:pl-2.5"
          >
            <img src={asset(rating.logo.src)} width={28} height={28} alt="" className="size-7 rounded-[7px]" />
            <span className="flex flex-col gap-0.5">
              <span className="flex items-baseline gap-1 text-[18px] leading-none">
                {String(rating.value).replace('.', ',')}
                <span className="text-[13px] text-[#9a9490]">({rating.count})</span>
              </span>
              <Stars value={rating.value} />
            </span>
          </a>
        </div>
        <h1 className="mt-4 font-display text-[56px] leading-[1.1] font-normal tracking-[-0.03em] text-[#1b1919] max-md:text-[36px]">
          {page.title} <span className="text-[#b3a89f]">{page.accent}</span>
        </h1>
        <p className="mt-3 font-text text-[18px] leading-[1.3] text-[#625f5e] max-md:text-[15px]">
          {SURGEONS.length} {page.subtitle[0]}
          <br />
          {page.subtitle[1]}
        </p>
      </div>
      <aside
        className="docs-help flex min-h-[181px] w-[280px] flex-col justify-between gap-5 rounded-[24px] px-[21px] pt-[22px] pb-6 max-md:min-h-0 max-md:w-full max-md:gap-4 max-md:rounded-[20px] max-md:p-4"
        aria-label={page.help.title}
      >
        <p className="font-display text-[26.5px] leading-[32px] font-light tracking-[-0.03em] text-[#8b6a3e] max-md:text-[20px] max-md:leading-6">
          {page.help.title}
        </p>
        <a
          {...whatsappLink('Здравствуйте! Помогите, пожалуйста, подобрать хирурга')}
          data-analytics-id="doctors_help_whatsapp"
          className="docs-help__btn inline-flex h-[46px] items-center justify-center gap-2 self-stretch rounded-pill px-4 font-text text-[14px] font-medium text-[#9a7440]"
        >
          <WhatsAppIcon size={16} />
          {page.help.button}
        </a>
      </aside>
    </div>
  );
}

/**
 * "Хирурги RR Clinic" (design 2026-11-03), opened from the menu's "Врачи": the clinic's surgeons as the home
 * page's team cards in a grid, filtered by body area, then the shared FAQ and footer.
 */
export function DoctorsPage() {
  const [category, setCategory] = useState<CategoryId>('all');
  const doctors = surgeonsIn(category);

  return (
    <>
      <div className="rr-section bg-white text-neutral-900">
        <Header />
        <main>
          <Intro />
          <div className="mx-auto mt-8 max-w-[1440px] px-(--sec-pad) max-md:mt-6">
            <div className="docs-filters-scroll max-md:-mx-4 max-md:overflow-x-auto max-md:px-4">
              <div role="group" aria-label="Направление" className="docs-filters flex w-full gap-1 rounded-pill p-2 max-md:inline-flex max-md:w-auto max-md:p-1.5">
                {CATEGORIES.map((item) => {
                  const count = surgeonsIn(item.id).length;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={category === item.id}
                      onClick={() => setCategory(item.id)}
                      className="docs-filter flex h-[54px] shrink-0 items-center gap-2.5 rounded-pill py-2 pr-5 pl-2 font-text text-[16px] font-medium whitespace-nowrap max-md:h-11 max-md:gap-2 max-md:pr-3 max-md:pl-1.5 max-md:text-[15px]"
                    >
                      <span className="docs-filter__icon grid size-[38px] place-items-center rounded-full max-md:size-8">
                        {item.id === 'all' ? <PersonIcon /> : <img src={asset(item.icon)} width={20} height={20} alt="" className="size-5" />}
                      </span>
                      {item.label}
                      <span className="docs-filter__count grid h-[22px] min-w-[22px] place-items-center rounded-pill px-1.5 text-[13px] leading-none">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <ul key={category} className="docs-grid mt-8 grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:mt-6 max-md:grid-cols-1 max-md:gap-4" aria-live="polite">
              {doctors.map((doctor, i) => (
                <DoctorCard key={doctor.id} doctor={doctor} index={i} fluid />
              ))}
            </ul>
          </div>
          <Faq />
        </main>
      </div>
      <Footer linkBase="/" />
    </>
  );
}
