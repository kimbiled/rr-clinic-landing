import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { asset } from '../../data/hero';
import { operations, type Operation, type OperationCategory, type OperationIcon } from '../../data/landing';
import { revealItem, revealScope, useInView } from './useInView';
import { OPEN_WORKS_EVENT } from './Works';
import { whatsappLink } from './whatsapp';
import './sections.css';

/** Designer exports of the operation directions. */
export function CategoryIcon({ name }: { name: OperationIcon }) {
  const url = `url("${asset(`assets/icons/operation-${name}.svg`)}")`;
  return (
    <span
      aria-hidden="true"
      className="rr-category-icon"
      style={{ maskImage: url, WebkitMaskImage: url }}
    />
  );
}

/** "5 операций", "2 операции", "1 операция". */
function countLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} операция`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} операции`;
  return `${n} операций`;
}

const normalize = (s: string) => s.toLowerCase().replace(/ё/g, 'е');

interface Match {
  item: Operation;
  category: OperationCategory;
}

/** Every query word must appear in the operation's name, its category's names or the category keywords. */
function search(query: string): Match[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const matches: Match[] = [];
  for (const category of operations.categories) {
    const shared = normalize([category.label, category.title, ...category.keywords].join(' '));
    for (const item of category.items) {
      const text = `${normalize(item.name)} ${shared}`;
      if (words.every((w) => text.includes(w))) matches.push({ item, category });
    }
  }
  return matches;
}

const ArrowRight = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true" className="rr-opcard__arrow">
    <path d="M1 5h12M9 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Photo card; an operation without a photo yet keeps the same layout with its direction's icon. */
function OperationCard({ item, icon }: { item: Operation; icon: OperationIcon }) {
  return (
    <li className="rr-opcard flex min-h-[479px] flex-col rounded-[24px] p-3 max-md:min-h-[465px]">
      {item.image ? (
        <img
          src={asset(item.image.src)}
          width={item.image.width}
          height={item.image.height}
          alt={item.image.alt}
          loading="lazy"
          decoding="async"
          className="aspect-[376/260] w-full rounded-[18px] object-cover max-md:aspect-[339/251]"
        />
      ) : (
        <span className="rr-opcard__blank grid aspect-[376/260] w-full place-items-center rounded-[18px] max-md:aspect-[339/251]">
          <CategoryIcon name={icon} />
        </span>
      )}
      <h4 className="mt-4 px-2 font-display text-[22px] leading-[28px] font-normal tracking-[-0.01em] text-[#2e2c2c] max-md:text-[20px] max-md:leading-[26px] max-md:tracking-normal">
        {item.name}
      </h4>
      {item.description && <p className="mt-2 px-2 font-text text-[16px] leading-5 text-[#625f5e] max-md:text-[14px] max-md:leading-[18px]">{item.description}</p>}
      <div className="mt-auto flex items-end justify-between gap-3 px-2 pt-5 pb-1.5">
        <p className="min-w-0">
          <span className="block font-text text-[13px] leading-4 text-[#a4a09d]">{operations.priceLabel}</span>
          <span className="mt-0.5 block font-display text-[19px] leading-6 text-[#2e2c2c] max-md:text-[18px]">{item.price ?? operations.noPrice}</span>
        </p>
        <a
          {...whatsappLink(operations.message.replace('{name}', item.name))}
          data-analytics-id="operation_enquiry"
          className="rr-opcard__btn inline-flex h-[46px] shrink-0 items-center gap-2 rounded-pill px-5 font-display text-[14px] leading-5 max-md:h-11 max-md:font-text max-md:text-[15px] max-md:font-medium"
          aria-label={`${operations.moreLabel}: ${item.name}`}
        >
          {operations.moreLabel}
          <ArrowRight />
        </a>
      </div>
    </li>
  );
}

function ConsultCard() {
  const { cta } = operations;
  return (
    <li className="rr-opcta flex min-h-[479px] flex-col rounded-[24px] p-8 text-white max-md:min-h-0 max-md:p-5">
      <span className="rr-opcta__icon grid size-[58px] place-items-center rounded-full max-md:size-[46px]" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v6a2.5 2.5 0 0 1-2.5 2.5H9l-4 3v-3A2.5 2.5 0 0 1 3 11.5v-6Z" />
          <path d="M7 7.5h6M7 10.5h4" />
        </svg>
      </span>
      <h4 className="mt-6 font-display text-[29px] leading-[34px] font-light tracking-[-0.01em] max-md:text-[22px] max-md:leading-7">{cta.title}</h4>
      <p className="mt-4 font-text text-[16px] leading-[21px] text-white/85 max-md:mt-3 max-md:text-[15px] max-md:leading-5">{cta.text}</p>
      <a
        {...whatsappLink(cta.message)}
        data-analytics-id="operations_consultation"
        className="rr-opcta__btn mt-auto inline-flex h-[58px] items-center justify-center rounded-pill bg-white px-5 font-display text-[15px] leading-5 text-[#2f4a44] max-md:mt-6 max-md:h-[54px] max-md:font-text max-md:text-[16px] max-md:font-medium"
      >
        {cta.label}
      </a>
    </li>
  );
}

/**
 * "Каталог операций" (design 2026-10-30): heading + search, capsule tabs with the directions, then a card per
 * operation and the consultation card. The search looks through every direction. "Подробнее" opens WhatsApp with
 * the operation's name prefilled; "Смотреть результаты" sets the matching filter in the works section below.
 * Phones (design 2026-11-01): the search folds into a round button next to the heading.
 */
export function Operations() {
  const { ref, inView } = useInView<HTMLElement>();
  const [activeId, setActiveId] = useState(operations.categories[0].id);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const uid = useId();

  const { categories } = operations;
  const activeIndex = Math.max(0, categories.findIndex((c) => c.id === activeId));
  const active = categories[activeIndex];
  const searching = query.trim().length > 0;
  const results = useMemo(() => (searching ? search(query) : []), [query, searching]);
  const panelId = `${uid}-panel`;

  const select = (id: string) => {
    setQuery('');
    setActiveId(id);
  };

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  const onTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (activeIndex + step + categories.length) % categories.length;
    select(categories[next].id);
    tabs.current[next]?.focus();
  };

  const showResults = () => {
    if (active.results) window.dispatchEvent(new CustomEvent(OPEN_WORKS_EVENT, { detail: active.results.filter }));
  };

  return (
    <section
      ref={ref}
      id={operations.id}
      aria-labelledby="operations-title"
      className="rr-section relative bg-white text-neutral-900"
      {...revealScope(inView)}
    >
      <div className="mx-auto max-w-[1440px] px-(--sec-pad) pt-[52px] pb-[48px] max-md:pt-10 max-md:pb-10">
        <div className="flex items-end justify-between gap-10 max-md:flex-col max-md:items-stretch max-md:gap-4">
          <div className="relative">
            <button
              type="button"
              className="rr-round-btn absolute top-0 right-0 size-11! md:hidden"
              aria-expanded={searchOpen}
              aria-label={searchOpen ? 'Скрыть поиск' : 'Поиск операции'}
              onClick={() => {
                setQuery('');
                setSearchOpen((open) => !open);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="7" cy="7" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
            <p className="rr-eyebrow !text-[14px] max-md:hidden" {...revealItem(0)}>
              {operations.eyebrow}
            </p>
            <h2
              id="operations-title"
              className="mt-3 font-display text-[40px] leading-[48px] font-normal tracking-[-0.02em] text-[#1b1919] max-md:mt-0 max-md:pr-12 max-md:text-[30px] max-md:leading-[44px] max-md:tracking-normal"
              {...revealItem(1)}
            >
              {operations.title[0]}
              <span className="text-[#5e8b7b] max-md:text-inherit">{operations.title[1]}</span>
            </h2>
            <p className="mt-3 font-text text-[18px] leading-[22px] whitespace-pre-line text-[#625f5e] max-md:mt-1 max-md:text-[17px] max-md:whitespace-normal max-md:text-[#8c8784]" {...revealItem(2)}>
              {operations.text}
            </p>
          </div>

          <label
            className={`rr-search relative flex h-14 w-[440px] shrink-0 items-center gap-3 rounded-pill px-6 max-md:h-[50px] max-md:w-full max-md:px-4 ${searchOpen ? '' : 'max-md:hidden'}`}
            {...revealItem(2)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0 text-[#2e2c2c]">
              <circle cx="7" cy="7" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
              <path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span className="sr-only">Поиск операции</span>
            <input
              ref={searchInput}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={operations.searchPlaceholder}
              className="rr-search__input h-full min-w-0 flex-1 bg-transparent font-text text-[16px] text-[#2e2c2c] outline-none max-md:text-[14px]"
              aria-controls={panelId}
            />
          </label>
        </div>

        <div
          role="tablist"
          aria-label="Направления"
          className="rr-optabs mt-7 flex items-center justify-between gap-1 overflow-x-auto rounded-pill p-2 max-md:mt-4 max-md:-mr-(--sec-pad) max-md:justify-start max-md:rounded-r-none"
          onKeyDown={onTabKeyDown}
          {...revealItem(3)}
        >
          {categories.map((c, i) => {
            const selected = !searching && c.id === active.id;
            return (
              <button
                key={c.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={c.id === active.id ? 0 : -1}
                className="rr-optab flex h-[52px] shrink-0 items-center gap-2.5 rounded-pill py-2 pr-3 pl-2 font-display text-[14px] leading-5 font-medium whitespace-nowrap"
                onClick={() => select(c.id)}
              >
                <span className="rr-optab__icon grid size-9 place-items-center rounded-full">
                  <CategoryIcon name={c.icon} />
                </span>
                {c.label}
                <span className="rr-optab__count grid h-[22px] min-w-[22px] place-items-center rounded-pill px-1.5 font-text text-[12px] leading-none">
                  {c.items.length}
                </span>
              </button>
            );
          })}
        </div>

        <div id={panelId} role="tabpanel" aria-live="polite" className="mt-11 max-md:mt-7" {...revealItem(4)}>
          <div className="flex items-end justify-between gap-6 max-md:flex-col max-md:items-start max-md:gap-2">
            <div>
              <h3 className="font-display text-[28px] leading-9 font-normal tracking-[-0.01em] text-[#1b1919] max-md:text-[24px] max-md:leading-[30px] max-md:tracking-normal">
                {searching ? 'Результаты поиска' : active.title}
              </h3>
              <p className="mt-1 font-text text-[14px] leading-[18px] text-[#a4a09d] max-md:text-[13px] max-md:leading-4">
                {countLabel(searching ? results.length : active.items.length)} · {operations.note}
              </p>
            </div>
            {!searching && active.results && (
              <a href="#works" onClick={(e) => { e.preventDefault(); showResults(); }} className="rr-oplink inline-flex items-center gap-3 font-display text-[14px] leading-5 font-medium text-[#2f4a44] max-md:hidden">
                {active.results.label}
                <ArrowRight />
              </a>
            )}
          </div>

          {searching && results.length === 0 && (
            <p className="mt-6 max-w-[460px] font-text text-[17px] leading-[22px] text-[#625f5e]">{operations.empty}</p>
          )}

          <ul key={searching ? 'search' : active.id} className="rr-op-grid mt-7 grid grid-cols-3 gap-5 max-md:mt-5 max-md:grid-cols-1">
            {(searching ? results : active.items.map((item) => ({ item, category: active }))).map(({ item, category }) => (
              <OperationCard key={`${category.id}-${item.name}`} item={item} icon={category.icon} />
            ))}
            <ConsultCard />
          </ul>
        </div>

        <p className="mt-6 font-text text-[13px] leading-4 text-[#a4a09d]">{operations.disclaimer}</p>
      </div>
    </section>
  );
}
