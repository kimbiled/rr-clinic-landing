import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { operations, type OperationCategory, type OperationIcon } from '../../data/landing';
import { revealItem, revealScope, useInView } from './useInView';
import { useIsMobile } from '../../hooks/useIsMobile';
import { whatsappLink } from './whatsapp';
import './sections.css';

/** window event (detail = category id): a "Пластическая хирургия" card asks the catalog to open its category. */
export const OPEN_CATEGORY_EVENT = 'rr:open-operation-category';

/** 20 px line icons for the category list. */
const ICONS: Record<OperationIcon, ReactNode> = {
  face: (
    <path d="M11.5 2.5c-3.6 0-6 2.7-6 6.3 0 1 .2 1.9.5 2.6L4.5 14l1.8.4V16c0 .9.7 1.5 1.6 1.4l2-.2.4 2.3M11.5 2.5c2.6 0 4.5 1.6 5.2 3.8M14 9.5c.8.6 1.3 1.6 1.3 2.7 0 2.2-1.7 4-3.8 4.3M9 8.8h.01" />
  ),
  eye: (
    <>
      <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z" />
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2v1.2M4.6 3.6l.7 1M15.4 3.6l-.7 1" />
    </>
  ),
  nose: <path d="M9.5 2.5c0 4-1.2 7.5-3.6 10.4-1.2 1.4-.9 3.2.9 3.6 1 .2 1.7-.4 2.2-1.2.4.8 1.2 1.3 2 1.3s1.6-.5 2-1.3c.5.8 1.2 1.4 2.2 1.2 1.8-.4 2.1-2.2.9-3.6" />,
  lips: (
    <>
      <path d="M2 10c2-.6 3.6-3.6 5.6-3.6 1 0 1.7.6 2.4.6s1.4-.6 2.4-.6c2 0 3.6 3 5.6 3.6-2.4 2.8-4.8 4.2-8 4.2s-5.6-1.4-8-4.2Z" />
      <path d="M2 10h16" />
    </>
  ),
  breast: (
    <path d="M3 4.5c0 3-1 5.5-1 7.4 0 2.5 2 3.9 4.2 3.9 2 0 3.3-1.2 3.8-2.6.5 1.4 1.8 2.6 3.8 2.6 2.2 0 4.2-1.4 4.2-3.9 0-1.9-1-4.4-1-7.4M6.2 12.3h.01M13.8 12.3h.01" />
  ),
  body: (
    <path d="M6.5 2c.3 3-.8 4.6-.8 6.6 0 1.6 1 2.4 1 4 0 1.4-1.5 2.9-1.5 5.4M13.5 2c-.3 3 .8 4.6.8 6.6 0 1.6-1 2.4-1 4 0 1.4 1.5 2.9 1.5 5.4M8.2 7.5c1.1.6 2.5.6 3.6 0M10 11.6v.4" />
  ),
  intimate: (
    <>
      <path d="M10 17c-3-1.6-4.2-4.5-4.2-7.2C5.8 7 7.6 4.6 10 3c2.4 1.6 4.2 4 4.2 6.8 0 2.7-1.2 5.6-4.2 7.2Z" />
      <path d="M10 17c-3.6.1-6.8-1.8-8-5.6 1.6-.4 3-.3 4.2.2M10 17c3.6.1 6.8-1.8 8-5.6-1.6-.4-3-.3-4.2.2" />
    </>
  ),
};

export function CategoryIcon({ name }: { name: OperationIcon }) {
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
      {ICONS[name]}
    </svg>
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
  name: string;
  category: OperationCategory;
}

/** Every query word must appear in the operation's name, its category's names or the category keywords. */
function search(query: string): Match[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const matches: Match[] = [];
  for (const category of operations.categories) {
    const shared = normalize([category.label, category.title, ...category.keywords].join(' '));
    for (const name of category.items) {
      const text = `${normalize(name)} ${shared}`;
      if (words.every((w) => text.includes(w))) matches.push({ name, category });
    }
  }
  return matches;
}

function OperationRow({ name, category }: { name: string; category?: string }) {
  return (
    <li>
      <a
        {...whatsappLink(operations.message.replace('{name}', name))}
        className="rr-op flex h-[70px] items-center justify-between gap-6 border-b border-[#ebe6e1] max-md:h-auto max-md:min-h-12 max-md:gap-3 max-md:py-3 max-md:pl-9"
      >
        <span className="font-display text-[18px] leading-6 text-[#2e2c2c] max-md:text-[15px] max-md:leading-5">{name}</span>
        <span className="flex items-center gap-5">
          {category && <span className="font-text text-[15px] leading-5 text-[#a4a09d] max-md:hidden">{category}</span>}
          <svg className="rr-op__arrow" width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
            <path d="M1 6h14M10 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </a>
    </li>
  );
}

/**
 * "Все операции" (design 2026-10-27): search over the whole catalog, categories on the left (vertical tabs),
 * the chosen category's operations on the right, then the "Не знаете, с чего начать?" bar. Each operation opens
 * WhatsApp with its name prefilled.
 */
export function Operations() {
  const { ref, inView } = useInView<HTMLElement>();
  const [activeId, setActiveId] = useState(operations.categories[0].id);
  const [query, setQuery] = useState('');
  /** Phones: the open accordion category (none at first, as in the design). */
  const [openId, setOpenId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const uid = useId();

  const { categories, cta } = operations;
  const activeIndex = Math.max(0, categories.findIndex((c) => c.id === activeId));
  const active = categories[activeIndex];
  const searching = query.trim().length > 0;
  const results = useMemo(() => (searching ? search(query) : []), [query, searching]);
  const panelId = `${uid}-panel`;

  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (!categories.some((c) => c.id === id)) return;
      setQuery('');
      setActiveId(id);
      setOpenId(id);
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener(OPEN_CATEGORY_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CATEGORY_EVENT, onOpen);
  }, [categories, ref]);

  const onTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (activeIndex + step + categories.length) % categories.length;
    setQuery('');
    setActiveId(categories[next].id);
    tabs.current[next]?.focus();
  };

  return (
    <section
      ref={ref}
      id={operations.id}
      aria-labelledby="operations-title"
      className="rr-section relative bg-white text-neutral-900"
      {...revealScope(inView)}
    >
      <span className="rr-rule pointer-events-none absolute inset-x-0 top-0" aria-hidden="true" />
      <span className="rr-rule pointer-events-none absolute inset-x-0 bottom-0" aria-hidden="true" />
      <div className="mx-auto max-w-[1440px] px-(--sec-pad)">
        <div className="rr-frame relative px-8 pt-[44px] pb-[78px] max-md:px-0 max-md:pt-10 max-md:pb-12">
          <h2
            id="operations-title"
            className="font-display text-[36px] leading-[44px] font-normal tracking-[-0.02em] text-[#1b1919] max-md:text-[26px] max-md:leading-8"
            {...revealItem(0)}
          >
            {operations.title}
          </h2>

          <label className="rr-search relative mt-[40px] flex h-[72px] items-center gap-4 rounded-[20px] px-6 max-md:mt-4 max-md:h-[52px] max-md:gap-3 max-md:rounded-[16px] max-md:px-4" {...revealItem(1)}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0 text-[#625f5e]">
              <circle cx="7" cy="7" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
              <path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span className="sr-only">Поиск операции</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={operations.searchPlaceholder}
              className="rr-search__input h-full min-w-0 flex-1 bg-transparent font-text text-[17px] text-[#2e2c2c] outline-none max-md:text-[13px]"
              aria-controls={panelId}
            />
          </label>

          {isMobile && !searching ? (
            // Phones: the categories as an accordion — a tap opens the operations under it
            <ul className="mt-5 flex flex-col" {...revealItem(2)}>
              {categories.map((c) => {
                const open = c.id === openId;
                return (
                  <li key={c.id} className="border-b border-[#f1ede9] last:border-0">
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={`${uid}-${c.id}`}
                      data-active={open || undefined}
                      className="rr-cat flex h-[52px] w-full items-center gap-3 rounded-[12px] px-1 text-left"
                      onClick={() => setOpenId(open ? null : c.id)}
                    >
                      <CategoryIcon name={c.icon} />
                      <span className="flex-1 font-text text-[14px] leading-5 text-[#2e2c2c]">{c.label}</span>
                      <span className="font-text text-[12px] leading-4 text-[#b9b4b0]">{c.items.length}</span>
                    </button>
                    {open && (
                      <ul id={`${uid}-${c.id}`} className="rr-op-list pb-2">
                        {c.items.map((name) => (
                          <OperationRow key={name} name={name} />
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
          <div className="mt-[34px] grid grid-cols-[284px_1fr] gap-[52px] max-md:mt-6 max-md:grid-cols-1" {...revealItem(2)}>
            <div
              role="tablist"
              aria-orientation="vertical"
              aria-label="Направления"
              className="flex flex-col gap-[4px] max-md:hidden"
              onKeyDown={onTabKeyDown}
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
                    data-active={selected || undefined}
                    className="rr-cat flex h-[59px] items-center gap-4 rounded-[14px] px-4 text-left"
                    onClick={() => {
                      setQuery('');
                      setActiveId(c.id);
                    }}
                  >
                    <CategoryIcon name={c.icon} />
                    <span className="flex-1 font-text text-[16px] leading-5 text-[#2e2c2c]">{c.label}</span>
                    <span className="font-text text-[13px] leading-4 text-[#b9b4b0]">{c.items.length}</span>
                  </button>
                );
              })}
            </div>

            <div id={panelId} role="tabpanel" aria-live="polite" className="min-h-[440px] max-md:min-h-0">
              {searching ? (
                <>
                  <h3 className="font-display text-[24px] leading-8 font-normal text-[#1b1919]">Результаты поиска</h3>
                  <p className="mt-[6px] font-text text-[13px] leading-4 text-[#a4a09d]">{countLabel(results.length)}</p>
                  {results.length > 0 ? (
                    <ul className="rr-op-list mt-[22px]">
                      {results.map((m) => (
                        <OperationRow key={`${m.category.id}-${m.name}`} name={m.name} category={m.category.label} />
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-[28px] max-w-[460px] font-text text-[17px] leading-[22px] text-[#625f5e]">
                      {operations.empty}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="font-display text-[24px] leading-8 font-normal text-[#1b1919]">{active.title}</h3>
                  <p className="mt-[6px] font-text text-[13px] leading-4 text-[#a4a09d]">{countLabel(active.items.length)}</p>
                  <ul key={active.id} className="rr-op-list mt-[22px]">
                    {active.items.map((name) => (
                      <OperationRow key={name} name={name} />
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
          )}

          <div
            className="rr-start mt-[34px] flex h-[112px] items-center justify-between gap-8 rounded-[24px] px-6 max-md:mt-6 max-md:h-auto max-md:flex-col max-md:items-stretch max-md:gap-4 max-md:rounded-[20px] max-md:p-4"
            {...revealItem(3)}
          >
            <div>
              <h3 className="font-display text-[24px] leading-8 font-normal text-[#2e2c2c] max-md:text-[20px] max-md:leading-6">{cta.title}</h3>
              <p className="mt-[2px] font-text text-[17px] leading-[22px] text-[#8c8784] max-md:text-[13px] max-md:leading-[18px]">{cta.text}</p>
            </div>
            <a
              {...whatsappLink(cta.message)}
              className="rr-start__btn inline-flex h-[68px] shrink-0 items-center rounded-pill px-6 font-display text-[16px] leading-6 text-white max-md:h-12 max-md:justify-center max-md:text-[14px]"
            >
              {isMobile ? (cta.mobileLabel ?? cta.label) : cta.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
