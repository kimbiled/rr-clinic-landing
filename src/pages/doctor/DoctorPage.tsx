import { useId, useState, type CSSProperties } from 'react';
import { asset } from '../../data/hero';
import rawWorks from '../../data/works.json';
import { Compare, type Work } from '../../components/sections/Works';
import { Footer } from '../../components/sections/Footer';
import { whatsappLink } from '../../components/sections/whatsapp';
import { SiteHeader, WhatsAppIcon } from '../shared/SiteHeader';
import type { DoctorProfile, EducationGroup, PriceGroup, VideoReview } from './profiles';
import '../../components/sections/sections.css';
import './doctor.css';

const tenge = (value: number) => `${value.toLocaleString('ru-RU')} ₸`;

function ArrowDownRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 3l8 8M11 4.5V11H4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A round play mark: the disc takes currentColor, the triangle the contrasting `mark`. */
function Play({ size = 14, mark = '#fff' }: { size?: number; mark?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path d="M6.5 5.2v5.6L11 8z" fill={mark} />
    </svg>
  );
}

/** Breadcrumb, role and operation chips, the white card with the figures and prices; the portrait on the right. */
function Hero({ profile }: { profile: DoctorProfile }) {
  const { hero, consultation } = profile;
  return (
    <section className="dp-hero relative overflow-hidden" aria-labelledby="dp-name">
      <img src={asset(hero.background.src)} width={hero.background.width} height={hero.background.height} alt="" fetchPriority="high" className="absolute inset-0 size-full object-cover" />
      <span className="dp-hero__shade pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative min-h-[690px] max-md:min-h-0">
        <SiteHeader tone="overlay" current="/doctors/" />
        <div className="mx-auto max-w-[1440px] px-(--sec-pad) pt-3 pb-10 max-md:pb-6">
          <nav aria-label="Навигация по сайту">
            <ol className="flex items-center gap-2 font-text text-[14px] leading-4 text-white/80">
              <li className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 6.2 7 2l5 4.2V12H8.5V9h-3v3H2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
                <a href="/" className="hover:text-white">Главная</a>
              </li>
              <li aria-hidden="true">›</li>
              <li><a href="/doctors/" className="hover:text-white">Хирурги</a></li>
              <li aria-hidden="true">›</li>
              <li aria-current="page" className="font-medium text-white">{profile.shortName}</li>
            </ol>
          </nav>

          <ul className="mt-6 flex flex-wrap gap-2 max-md:mt-4" aria-label="Специализация">
            <li className="dp-chip dp-chip--light">{profile.role}</li>
            {profile.tags.map((tag) => (
              <li key={tag} className="dp-chip dp-chip--green">{tag}</li>
            ))}
          </ul>

          <img
            src={asset(hero.photo.src)}
            width={hero.photo.width}
            height={hero.photo.height}
            alt={hero.photo.alt}
            fetchPriority="high"
            className="dp-hero__photo pointer-events-none"
          />

          <div className="dp-hero__card relative mt-4 w-[620px] rounded-[32px] bg-white p-6 text-[#2e2c2c] max-md:mt-0 max-md:w-full max-md:rounded-[24px] max-md:p-5">
            <p className="inline-flex h-8 items-center gap-2 rounded-[10px] bg-[#f5f2f0] px-3 font-text text-[13px] text-[#625f5e]">
              <svg width="11" height="13" viewBox="0 0 12 14" fill="none" aria-hidden="true" className="text-[#c9c1b8]">
                <path d="M6 0c3.3 0 6 2.7 6 5.9C12 9.2 8.3 13.3 6 13.3S0 9.2 0 5.9C0 2.7 2.7 0 6 0Zm0 3.6a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6Z" fill="currentColor" />
              </svg>
              <span className="text-[#bb9358]">{profile.cities[0]}</span> {profile.cities[1]}
            </p>
            <h1 id="dp-name" className="mt-4 font-display text-[36px] leading-[1.15] font-normal tracking-[-0.02em] max-md:text-[28px]">
              {profile.lastName}
              <br />
              {profile.givenNames}
            </h1>
            <p className="mt-3 max-w-[520px] font-text text-[15px] leading-[1.3] text-[#625f5e]">{profile.about}</p>
            <dl className="mt-6 grid grid-cols-4 gap-5 max-md:grid-cols-2 max-md:gap-y-4">
              {profile.stats.map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <dt className="order-last mt-1.5 font-text text-[13px] leading-[1.15] text-[#7c7876]">{stat.label}</dt>
                  <dd className="font-display text-[34px] leading-none font-light tracking-[-0.02em] max-md:text-[28px]">{stat.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4">
              <a
                {...whatsappLink(profile.consultationMessage)}
                data-analytics-id={`doctor_page_booking_${profile.doctorId}`}
                className="dp-cta inline-flex h-[52px] items-center gap-2.5 rounded-pill px-6 font-text text-[16px] font-medium text-white max-md:w-full max-md:justify-center"
              >
                Записаться на консультацию
                <ArrowDownRight />
              </a>
              <dl className="flex gap-8">
                <div className="flex flex-col">
                  <dt className="font-text text-[13px] text-[#9a9490]">Очная</dt>
                  <dd className="font-text text-[17px] font-medium text-[#497f75]">{tenge(consultation.inPerson)}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="font-text text-[13px] text-[#9a9490]">Онлайн</dt>
                  <dd className="font-text text-[17px] font-medium text-[#497f75]">{tenge(consultation.online)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <a
        href={profile.interview.href}
        target="_blank"
        rel="noopener noreferrer"
        className="dp-hero__video max-md:hidden"
        aria-label={profile.interview.label}
      >
        <img src={asset(hero.story.src)} width={hero.story.width} height={hero.story.height} alt="" className="size-full object-cover" />
        <span className="absolute bottom-2.5 left-2.5 text-white/90">
          <Play size={22} mark="#2e2c2c" />
        </span>
      </a>
    </section>
  );
}

function OfferCard({ name, price, message }: { name: string; price: number; message: string }) {
  return (
    <>
      <p className="font-text text-[16px] leading-[1.2]">{name}</p>
      <p className="mt-1 font-display text-[30px] leading-[1.15] font-normal tracking-[-0.02em]">от {tenge(price)}</p>
      <p className="mt-4 font-text text-[12px] text-white/75">Сообщение в WhatsApp</p>
      <p className="mt-2 rounded-[12px] bg-[#e5efec] p-3 font-text text-[14px] leading-[1.25] text-[#2e2c2c]">{message}</p>
      <a
        {...whatsappLink(message)}
        data-analytics-id="doctor_page_price_whatsapp"
        className="dp-offer__btn mt-4 flex h-[48px] items-center justify-center gap-2 rounded-pill bg-white font-text text-[15px] font-medium text-[#2f4a44]"
      >
        <WhatsAppIcon size={16} />
        Отправить сообщение
      </a>
    </>
  );
}

/** "Направления и стоимость": area tabs, the area's price list, and the green WhatsApp card for the chosen line. */
function Prices({ groups }: { groups: PriceGroup[] }) {
  const [groupIndex, setGroupIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);
  const group = groups[groupIndex];
  const item = group.items[itemIndex] ?? group.items[0];
  const message = `Здравствуйте! Хочу записаться на консультацию по ${item.dative}.`;

  return (
    <section className="mx-auto grid max-w-[1440px] grid-cols-[300px_1fr] gap-x-14 px-(--sec-pad) pt-[72px] max-md:grid-cols-1 max-md:pt-12" aria-labelledby="dp-prices">
      <div>
        <h2 id="dp-prices" className="font-display text-[34px] leading-[1.1] font-normal tracking-[-0.02em] text-[#1b1919] max-md:text-[28px]">
          Направления
          <br />
          <span className="text-[#497f75]">и стоимость</span>
        </h2>
        <p className="mt-3 font-text text-[15px] leading-[1.3] text-[#7c7876]">
          Вид и объём операции определяются на консультации. Хирург оценит ваш запрос и объяснит возможные варианты коррекции.
        </p>
        <aside className="dp-offer sticky top-6 mt-8 rounded-[24px] p-5 text-white max-md:hidden" aria-live="polite">
          <OfferCard name={item.name} price={item.price} message={message} />
        </aside>
      </div>

      <div className="max-md:mt-6">
        <div role="group" aria-label="Направления" className="dp-tabs grid grid-cols-3 gap-x-3 gap-y-1.5 rounded-[32px] p-3 max-md:grid-cols-2">
          {groups.map((g, i) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={i === groupIndex}
              onClick={() => {
                setGroupIndex(i);
                setItemIndex(0);
              }}
              className="dp-tab flex min-h-[52px] items-center gap-3 rounded-pill py-1.5 pr-3 pl-1.5 text-left font-text text-[14px] leading-[1.15] font-medium max-md:gap-2 max-md:text-[13px]"
            >
              <span className="dp-tab__icon grid size-[38px] shrink-0 place-items-center rounded-full">
                <img src={asset(g.icon)} width={20} height={20} alt="" className="size-5" />
              </span>
              <span className="whitespace-pre-line">{g.tab}</span>
              <span className="dp-tab__count ml-auto grid h-[22px] min-w-[22px] shrink-0 place-items-center rounded-pill px-1.5 text-[12px] leading-none">{g.items.length}</span>
            </button>
          ))}
        </div>

        <h3 className="mt-8 font-display text-[24px] leading-[1.2] font-normal tracking-[-0.01em] text-[#1b1919]">{group.title}</h3>
        <ul key={group.id} className="dp-price-list mt-4 flex flex-col gap-2">
          {group.items.map((line, i) => (
            <li key={line.name}>
              <button
                type="button"
                aria-pressed={line === item}
                onClick={() => setItemIndex(i)}
                className="dp-price flex min-h-[54px] w-full items-center justify-between gap-6 rounded-[14px] px-5 py-3 text-left font-text text-[16px] leading-[1.2] text-[#2e2c2c] max-md:text-[14px]"
              >
                <span>{line.name}</span>
                <span className="shrink-0 whitespace-nowrap">от {tenge(line.price)}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Phones: the WhatsApp card follows the list instead of sticking beside it. */}
        <aside className="dp-offer mt-4 rounded-[24px] p-5 text-white md:hidden" aria-live="polite">
          <OfferCard name={item.name} price={item.price} message={message} />
        </aside>
      </div>
    </section>
  );
}

/** Section title in the design's two tones: dark first line, muted second ("Результаты / операций"). */
function TwoToneTitle({ id, first, second }: { id: string; first: string; second: string }) {
  return (
    <h2 id={id} className="font-display text-[34px] leading-[1.1] font-normal tracking-[-0.02em] text-[#1b1919] max-md:text-[28px]">
      {first}
      <br />
      <span className="text-[#b3a89f]">{second}</span>
    </h2>
  );
}

const WORKS_STEP = 3;

/** "Результаты операций" (design 2026-11-05): filter pills on the right, three before/after cards, "Показать ещё работы". */
function Works({ profile }: { profile: DoctorProfile }) {
  const all = (rawWorks as Work[]).filter((work) => work.doctorId === profile.doctorId);
  const filters = profile.workFilters
    .map((filter) => ({ ...filter, works: all.filter((work) => filter.titles.includes(work.title)) }))
    .filter((filter) => filter.works.length > 0);
  const [active, setActive] = useState(() => (filters[profile.workFilterDefault] ? profile.workFilterDefault : -1));
  const [shown, setShown] = useState(WORKS_STEP);
  const works = active < 0 ? all : filters[active].works;

  if (!all.length) return null;

  const tabs = [{ label: 'Все работы', count: all.length, index: -1 }, ...filters.map((f, i) => ({ label: f.label, count: f.works.length, index: i }))];

  return (
    <section className="mx-auto mt-[88px] max-w-[1440px] px-(--sec-pad) max-md:mt-14" aria-labelledby="dp-works">
      <div className="flex items-center justify-between gap-8 max-lg:flex-col max-lg:items-start max-md:gap-5">
        <TwoToneTitle id="dp-works" first="Результаты" second="операций" />
        <div className="dp-works-tabs-scroll max-md:-mx-4 max-md:w-[calc(100%+32px)] max-md:overflow-x-auto max-md:px-4">
          <div role="group" aria-label="Операции" className="dp-tabs inline-flex gap-1.5 rounded-pill p-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                type="button"
                aria-pressed={tab.index === active}
                onClick={() => {
                  setActive(tab.index);
                  setShown(WORKS_STEP);
                }}
                className="dp-tab flex h-11 shrink-0 items-center gap-2 rounded-pill px-4 font-text text-[14px] font-medium whitespace-nowrap"
              >
                {tab.label}
                <span className="dp-tab__count grid h-[22px] min-w-[22px] place-items-center rounded-pill px-1.5 text-[12px] leading-none">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <ul key={active} className="dp-works-grid mt-8 grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:mt-6 max-md:grid-cols-1 max-md:gap-3">
        {works.slice(0, shown).map((work, i) => (
          <li
            key={work.id}
            className="dp-work rr-ba relative aspect-[400/440] overflow-hidden rounded-[24px] bg-[#b4a294]"
            style={{ '--i': i % WORKS_STEP } as CSSProperties}
          >
            <Compare work={work} />
            <p className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] px-5 pb-5 font-text text-[20px] leading-6 font-medium text-white">{work.title}</p>
          </li>
        ))}
      </ul>

      {shown < works.length && (
        <div className="mt-8 flex justify-center max-md:mt-6">
          <button
            type="button"
            onClick={() => setShown((n) => n + WORKS_STEP)}
            className="dp-more flex h-12 items-center gap-2 rounded-pill px-8 font-text text-[14px] font-medium text-[#2f4a44]"
          >
            Показать ещё работы
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
              <path d="m1 1 4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}

function EducationGroupItem({ group, defaultOpen }: { group: EducationGroup; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <li className="dp-acc border-b border-[#ece8e4]" data-open={open || undefined}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-6 py-6 text-left font-display text-[22px] leading-[1.2] font-normal tracking-[-0.01em] text-[#2e2c2c] max-md:py-5 max-md:text-[18px]"
        >
          {group.title}
          <span className="dp-acc__icon grid size-8 shrink-0 place-items-center rounded-full" aria-hidden="true">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="m1 1 4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </h3>
      <div id={id} role="region" className="dp-acc__panel grid" aria-hidden={!open}>
        <div className="overflow-hidden">
          <ul className="flex flex-col gap-5 pb-7 pl-6 max-md:pl-0">
            {group.items.map((item) => (
              <li key={`${item.year}-${item.title}`}>
                <p className="font-text text-[16px] leading-[1.3] font-medium text-[#1b1919] max-md:text-[15px]">
                  {item.year} · {item.title}
                </p>
                <p className="mt-1 font-text text-[14px] leading-[1.35] text-[#7c7876]">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

/** "Образование и квалификация": the specialist certificate card beside the title, the accordion of studies below. */
function Education({ profile }: { profile: DoctorProfile }) {
  const { certificate, groups } = profile.education;
  return (
    <section className="mx-auto mt-[88px] max-w-[1440px] px-(--sec-pad) max-md:mt-14" aria-labelledby="dp-edu">
      <div className="flex items-start justify-between gap-8 max-md:flex-col max-md:gap-5">
        <TwoToneTitle id="dp-edu" first="Образование" second="и квалификация" />
        <div className="dp-cert relative flex w-[520px] items-center overflow-hidden rounded-[24px] p-6 max-md:w-full max-md:p-5">
          <div className="relative z-[1] flex flex-col items-start">
            <p className="font-text text-[13px] leading-none text-[#625f5e]">№ {certificate.number}</p>
            <p className="mt-3 font-display text-[20px] leading-[1.2] text-[#1b1919]">Сертификат специалиста</p>
            <a
              href={certificate.href}
              target="_blank"
              rel="noopener noreferrer"
              data-analytics-id={`doctor_page_certificate_${profile.doctorId}`}
              className="dp-cert__btn mt-5 flex h-11 items-center gap-2 rounded-pill px-5 font-text text-[14px] font-medium text-white"
            >
              Посмотреть сертификат
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M2 8 8 2M3 2h5v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
          {/* A blurred sheet standing in for the certificate itself, as in the design (the real one opens on click). */}
          <span className="dp-cert__sheet absolute top-4 right-4 bottom-4 w-[46%] rounded-[12px] max-md:w-[42%]" aria-hidden="true" />
        </div>
      </div>
      <ul className="mt-6 border-t border-[#ece8e4]">
        {groups.map((group) => (
          <EducationGroupItem key={group.title} group={group} defaultOpen={false} />
        ))}
      </ul>
    </section>
  );
}

/** "Достижения и опыт": a warm band, the achievements on the left, the cut-out portrait and a "10 000+" badge on the right. */
function Achievements({ profile }: { profile: DoctorProfile }) {
  const { items, photo, badge, instagram } = profile.achievements;
  return (
    <section className="dp-achieve relative mt-[88px] overflow-hidden max-md:mt-14" aria-labelledby="dp-achieve">
      <div className="relative mx-auto grid max-w-[1440px] grid-cols-[1fr_1fr] px-(--sec-pad) max-md:grid-cols-1">
        <div className="py-[72px] max-md:pt-12 max-md:pb-6">
          <h2 id="dp-achieve" className="font-display text-[34px] leading-[1.1] font-normal tracking-[-0.02em] text-white max-md:text-[28px]">
            Достижения
            <br />
            <span className="text-white/60">и опыт</span>
          </h2>
          <ul className="mt-10 flex max-w-[520px] flex-col gap-7 max-md:mt-7 max-md:gap-5">
            {items.map((item) => (
              <li key={item.title}>
                <p className="font-display text-[20px] leading-[1.25] whitespace-pre-line text-white max-md:text-[18px]">{item.title}</p>
                <p className="mt-1.5 font-text text-[14px] leading-[1.4] text-white/75">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative min-h-[560px] max-md:min-h-[400px]">
          <img
            src={asset(photo.src)}
            width={photo.width}
            height={photo.height}
            alt={photo.alt}
            loading="lazy"
            decoding="async"
            className="absolute bottom-0 left-1/2 h-[94%] w-auto max-w-none -translate-x-1/2 object-contain object-bottom max-md:h-full"
          />
          <div className="dp-glass absolute right-0 bottom-8 flex items-center gap-3 rounded-pill py-2 pr-2 pl-3 max-md:right-auto max-md:bottom-5 max-md:left-0">
            <span className="flex -space-x-2.5">
              {profile.reviews.patients.map((src) => (
                <img key={src} src={asset(src)} width={32} height={32} alt="" loading="lazy" className="size-8 rounded-full object-cover ring-2 ring-white/70" />
              ))}
            </span>
            <span className="flex flex-col font-text leading-none text-[#2e2c2c]">
              <span className="text-[16px] font-medium">{badge}</span>
              <span className="mt-1 text-[12px] text-[#625f5e]">операций</span>
            </span>
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              data-analytics-id={`doctor_page_instagram_${profile.doctorId}`}
              aria-label={`Instagram: ${profile.shortName}`}
              className="dp-insta grid size-10 place-items-center rounded-full text-white"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="9" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="13.2" cy="4.8" r="0.9" fill="currentColor" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A review video card: topic at the top, play mark and title at the bottom, 24 px in from the edges (design). */
function VideoCard({ review, className = '', imgClassName = '' }: { review: VideoReview; className?: string; imgClassName?: string }) {
  return (
    <a
      href={review.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`dp-video relative block overflow-hidden rounded-[24px] ${className}`}
      aria-label={`${review.title}: ${review.topic.replace('\n', ' ')}`}
    >
      <img src={asset(review.poster.src)} width={review.poster.width} height={review.poster.height} alt="" loading="lazy" className={`absolute inset-0 size-full object-cover ${imgClassName}`} />
      <span className="dp-video__shade pointer-events-none absolute inset-0" aria-hidden="true" />
      <span className="absolute top-6 left-6 max-w-[70%] font-text text-[15px] leading-[1.15] whitespace-pre-line text-white max-md:top-5 max-md:left-5">{review.topic}</span>
      <span className="absolute bottom-6 left-6 flex flex-col items-start gap-3 font-text text-[16px] leading-[1.2] text-white max-md:bottom-5 max-md:left-5">
        <span className="text-white/80">
          <Play size={22} mark="#2e2c2c" />
        </span>
        {review.title}
      </span>
    </a>
  );
}

function Reviews({ profile }: { profile: DoctorProfile }) {
  const { reviews } = profile;
  return (
    <section className="mx-auto mt-[88px] max-w-[1440px] px-(--sec-pad) max-md:mt-14" aria-labelledby="dp-reviews">
      <div className="flex items-end justify-between gap-4">
        <h2 id="dp-reviews" className="font-display text-[34px] leading-[1.1] font-normal tracking-[-0.02em] text-[#1b1919] max-md:text-[28px]">
          Отзывы пациентов
        </h2>
        <a href={reviews.all} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-text text-[15px] text-[#625f5e] hover:text-[#2e2c2c]">
          Смотреть все
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 8 8 2M3 2h5v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
      {/* Design at 1440: columns 400 / 505 / 295 with 20 px gaps; 158 + 346 on the left, 252 + 252 in the middle, the
          side card 504 tall. Every card: radius 24, padding 24. */}
      <div className="mt-6 grid grid-cols-[400fr_505fr_295fr] items-start gap-5 max-md:grid-cols-1 max-md:gap-3">
        <div className="grid h-[524px] grid-rows-[158fr_346fr] gap-5 max-md:h-auto max-md:grid-rows-none max-md:gap-3">
          <article className="overflow-hidden rounded-[24px] bg-[#f3f1ef] p-6 max-md:p-5">
            <p className="font-display text-[18px] leading-[1.2] text-[#1b1919]">
              {reviews.text.author} <span className="ml-1 text-[#9a9490]">{reviews.text.date}</span>
            </p>
            <p className="mt-2 line-clamp-4 font-text text-[13px] leading-[1.35] text-[#4b4846]">{reviews.text.text}</p>
          </article>
          <VideoCard review={reviews.tall} imgClassName="object-top" className="max-md:aspect-[400/346]" />
        </div>
        <div className="grid h-[524px] grid-rows-2 gap-5 max-md:h-auto max-md:grid-rows-none max-md:gap-3">
          <VideoCard review={reviews.wide} className="dp-video--wide max-md:aspect-[505/252]" />
          <div className="flex flex-col rounded-[24px] bg-[#f3f1ef] p-6 max-md:p-5">
            <div className="flex -space-x-3">
              {reviews.patients.map((src) => (
                <img key={src} src={asset(src)} width={48} height={48} alt="" loading="lazy" className="size-12 rounded-full object-cover ring-2 ring-[#f3f1ef]" />
              ))}
            </div>
            <p className="mt-auto pt-4 font-display text-[24px] leading-none text-[#1b1919]">10 000+</p>
            <p className="mt-2 max-w-[300px] font-text text-[14px] leading-[1.3] text-[#625f5e]">
              Пациентов, прошедших путь до результата. Начните свой с платной консультации
            </p>
            <a {...whatsappLink(profile.consultationMessage)} className="dp-book mt-4 flex items-center gap-1 self-start" aria-label="Записаться на консультацию в WhatsApp">
              <span className="flex h-10 items-center rounded-pill px-5 font-text text-[15px] text-[#2e2c2c]">Записаться</span>
              <span className="grid size-10 place-items-center rounded-full text-[#2e2c2c]">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2 8 8 2M3 2h5v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </a>
          </div>
        </div>
        <VideoCard review={reviews.side} className="h-[504px] max-md:h-[460px]" />
      </div>
    </section>
  );
}

function Question({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <li className="rr-faq__item" data-open={open || undefined}>
      <h3>
        <button
          type="button"
          className="rr-faq__q flex w-full items-center justify-between gap-8 py-[25px] text-left font-display text-[17px] leading-6 font-normal tracking-[-0.01em] text-[#2e2c2c] max-md:gap-4 max-md:py-4 max-md:text-[15px]"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
        >
          {question}
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="rr-faq__icon shrink-0">
            <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </h3>
      <div id={id} role="region" className="rr-faq__a grid" aria-hidden={!open}>
        <div className="overflow-hidden">
          <p className="max-w-[860px] pb-7 font-text text-[17px] leading-[1.4] text-[#625f5e] max-md:pb-4 max-md:text-[14px]">{answer}</p>
        </div>
      </div>
    </li>
  );
}

function Faq({ profile }: { profile: DoctorProfile }) {
  return (
    <section className="mx-auto mt-[88px] max-w-[1440px] px-(--sec-pad) pb-16 max-md:mt-14" aria-labelledby="dp-faq">
      <h2 id="dp-faq" className="font-display text-[34px] leading-[1.1] font-normal tracking-[-0.02em] text-[#1b1919] max-md:text-[28px]">
        Частые вопросы
      </h2>
      <ul className="rr-faq__list mt-4">
        {profile.faq.map((item) => (
          <Question key={item.question} question={item.question} answer={item.answer} />
        ))}
      </ul>
    </section>
  );
}

/**
 * A surgeon's own page (design 2026-11-05, Рустам Курманбаев): hero card, prices with a WhatsApp message for the
 * chosen operation, filtered before/after works, education with the certificate, achievements, reviews, the doctor's
 * FAQ and the footer.
 */
export function DoctorPage({ profile }: { profile: DoctorProfile }) {
  return (
    <>
      <div className="rr-section bg-white text-neutral-900">
        <Hero profile={profile} />
        <main>
          <Prices groups={profile.prices} />
          <Works profile={profile} />
          <Education profile={profile} />
          <Achievements profile={profile} />
          <Reviews profile={profile} />
          <Faq profile={profile} />
        </main>
      </div>
      <Footer linkBase="/" />
    </>
  );
}
