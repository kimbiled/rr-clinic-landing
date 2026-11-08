import { useId, useMemo, useRef, useState } from 'react';
import { asset } from '../../data/hero';
import { operations, type Operation, type OperationCategory, type OperationIcon } from '../../data/landing';
import { revealItem, revealScope, useInView } from './useInView';
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

const normalize = (s: string) => s.toLowerCase().replace(/ё/g, 'е');

const categoryItems = (c: OperationCategory): Operation[] => c.items ?? c.groups?.flatMap((g) => g.items) ?? [];

/** Every query word must appear in the operation's name or description, its direction or sub-direction, or the keywords. */
function search(query: string): Operation[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const matches: Operation[] = [];
  for (const category of operations.categories) {
    const shared = [category.label, category.title, ...category.keywords].join(' ');
    const lists = category.groups ?? [{ label: '', title: '', items: category.items ?? [] }];
    for (const group of lists) {
      for (const item of group.items) {
        const text = normalize(`${item.name} ${item.description ?? ''} ${group.label} ${group.title} ${shared}`);
        if (words.every((w) => text.includes(w))) matches.push(item);
      }
    }
  }
  return matches;
}

const ArrowRight = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true" className="rr-opcard__arrow">
    <path d="M1 5h12M9 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Chevron = ({ open }: { open: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-90' : ''}`}>
    <path d="m4.5 2.5 3.5 3.5-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Photo, name, short description, price "от" and a full-width "Подробнее" that opens WhatsApp. */
function OperationCard({ item }: { item: Operation }) {
  return (
    <li className="rr-opcard flex min-h-[468px] flex-col rounded-[24px] p-4 max-md:min-h-0">
      {item.image && (
        <img
          src={asset(item.image.src)}
          width={item.image.width}
          height={item.image.height}
          alt={item.image.alt}
          loading="lazy"
          decoding="async"
          className="aspect-[263/210] w-full rounded-[18px] bg-[#eae6e2] object-cover"
        />
      )}
      <h4 className="mt-4 font-display text-[22px] leading-6 font-normal tracking-[-0.01em] text-[#2e2c2c] max-md:text-[20px]">{item.name}</h4>
      {item.description && <p className="mt-2 font-text text-[13px] leading-[17px] text-[#625f5e] max-md:text-[14px] max-md:leading-[18px]">{item.description}</p>}
      <p className="mt-auto pt-6 font-display text-[20px] leading-6 text-[#2e2c2c]">{item.price ?? operations.noPrice}</p>
      <a
        {...whatsappLink(operations.message.replace('{name}', item.name))}
        data-analytics-id="operation_enquiry"
        className="rr-opcard__btn mt-3.5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-pill px-5 font-display text-[14px] leading-5 font-medium"
        aria-label={`${operations.moreLabel}: ${item.name}`}
      >
        {operations.moreLabel}
        <ArrowRight />
      </a>
    </li>
  );
}

function ConsultCard() {
  const { cta } = operations;
  return (
    <div className="rr-opcta flex min-h-[340px] flex-col rounded-[24px] p-6 text-white max-md:min-h-0 max-md:p-5">
      <span className="rr-opcta__icon grid size-12 place-items-center rounded-full" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v6a2.5 2.5 0 0 1-2.5 2.5H9l-4 3v-3A2.5 2.5 0 0 1 3 11.5v-6Z" />
          <path d="M7 7.5h6M7 10.5h4" />
        </svg>
      </span>
      <h4 className="mt-5 font-display text-[22px] leading-[26px] font-light tracking-[-0.01em]">{cta.title}</h4>
      <p className="mt-3 font-text text-[15px] leading-[21px] text-white/85">{cta.text}</p>
      <a
        {...whatsappLink(cta.message)}
        data-analytics-id="operations_consultation"
        className="rr-opcta__btn mt-auto inline-flex h-14 items-center justify-center rounded-pill bg-white px-4 text-center font-text text-[15px] leading-5 font-medium whitespace-nowrap text-[#2f4a44] max-md:mt-6"
      >
        {cta.label}
      </a>
    </div>
  );
}

interface Selection {
  category: string;
  /** Sub-direction id, for a direction that has them. */
  group?: string;
}

const firstSelection = (c: OperationCategory): Selection => ({ category: c.id, group: c.groups?.[0]?.id });

/**
 * "Каталог операций" (design 2026-11-08): heading, then a side column with the search, the directions menu
 * ("Лицо и шея" opens into sub-directions) and the consultation card; to the right a breadcrumb, the heading and a
 * card per operation. The search looks through every direction. "Подробнее" opens WhatsApp with the operation's name.
 * Phones: the side column stacks above the cards, the consultation card goes last.
 */
export function Operations() {
  const { ref, inView } = useInView<HTMLElement>();
  const { categories } = operations;
  const [selection, setSelection] = useState<Selection>(() => firstSelection(categories[0]));
  const [expanded, setExpanded] = useState<string | null>(categories[0].groups ? categories[0].id : null);
  const [query, setQuery] = useState('');
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const uid = useId();
  const panelId = `${uid}-panel`;

  const category = categories.find((c) => c.id === selection.category) ?? categories[0];
  const group = category.groups?.find((g) => g.id === selection.group);
  const searching = query.trim().length > 0;
  const results = useMemo(() => (searching ? search(query) : []), [query, searching]);
  const items = searching ? results : (group?.items ?? category.items ?? []);

  /** On phones the cards are below the menu: bring them into view once a list is picked. */
  const revealResults = () => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      requestAnimationFrame(() => resultsHeading.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const pickCategory = (c: OperationCategory) => {
    setQuery('');
    if (c.groups) {
      // A direction with sub-directions only folds and unfolds; opening it shows its first sub-direction.
      if (expanded === c.id) {
        setExpanded(null);
        return;
      }
      setExpanded(c.id);
      if (selection.category !== c.id) setSelection(firstSelection(c));
      return;
    }
    setExpanded(null);
    setSelection({ category: c.id });
    revealResults();
  };

  const pickGroup = (c: OperationCategory, groupId: string) => {
    setQuery('');
    setSelection({ category: c.id, group: groupId });
    revealResults();
  };

  const crumbs = searching ? [operations.rootLabel, 'Поиск'] : group ? [category.label, group.label] : [operations.rootLabel, category.label];
  const heading = searching ? 'Результаты поиска' : (group?.title ?? category.title);

  return (
    <section
      ref={ref}
      id={operations.id}
      aria-labelledby="operations-title"
      className="rr-section relative bg-white text-neutral-900"
      {...revealScope(inView)}
    >
      <div className="mx-auto max-w-[1440px] px-(--sec-pad) pt-[52px] pb-[48px] max-md:pt-10 max-md:pb-10">
        <p className="rr-eyebrow !text-[14px] max-md:hidden" {...revealItem(0)}>
          {operations.eyebrow}
        </p>
        <h2
          id="operations-title"
          className="mt-3 font-display text-[40px] leading-[48px] font-normal tracking-[-0.02em] text-[#1b1919] max-md:mt-0 max-md:text-[30px] max-md:leading-[38px] max-md:tracking-normal"
          {...revealItem(1)}
        >
          {operations.title[0]}
          <span className="text-[#5e8b7b]">{operations.title[1]}</span>
        </h2>
        <p className="mt-3 font-text text-[18px] leading-[22px] text-[#625f5e] max-md:mt-2 max-md:text-[16px] max-md:leading-5 max-md:text-[#8c8784]" {...revealItem(2)}>
          {operations.text}
        </p>

        <div className="mt-10 grid gap-5 max-md:mt-6 max-md:gap-4 md:grid-cols-[minmax(260px,1fr)_2fr] md:grid-rows-[auto_1fr] xl:grid-cols-4">
          {/* Side column: search + directions */}
          <div className="md:col-start-1 md:row-start-1" {...revealItem(3)}>
            <label className="rr-search relative flex h-12 items-center gap-3 rounded-pill px-6 max-md:px-5">
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0 text-[#2e2c2c]">
                <circle cx="7" cy="7" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
                <path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span className="sr-only">Поиск операции</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={operations.searchPlaceholder}
                className="rr-search__input h-full min-w-0 flex-1 bg-transparent font-text text-[15px] text-[#2e2c2c] outline-none"
                aria-controls={panelId}
              />
            </label>

            <nav aria-label="Направления" className="rr-opnav mt-4 rounded-[24px] p-3">
              <ul className="flex flex-col gap-1">
                {categories.map((c) => {
                  const open = c.groups ? expanded === c.id : !searching && selection.category === c.id;
                  const current = !searching && selection.category === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="rr-opnav__item flex h-12 w-full items-center gap-3 rounded-pill pr-4 pl-1.5 text-left"
                        data-active={open || (current && !c.groups) ? '' : undefined}
                        aria-expanded={c.groups ? open : undefined}
                        aria-current={!c.groups && current ? 'true' : undefined}
                        aria-controls={c.groups ? undefined : panelId}
                        onClick={() => pickCategory(c)}
                      >
                        <span className="rr-opnav__icon grid size-9 shrink-0 place-items-center rounded-full">
                          <CategoryIcon name={c.icon} />
                        </span>
                        <span className="min-w-0 flex-1 font-text text-[15px] leading-5">{c.label}</span>
                        <span className="font-text text-[13px] leading-none text-[#a4a09d]">{categoryItems(c).length}</span>
                        <Chevron open={open} />
                      </button>
                      {c.groups && (
                        <div className={`grid transition-[grid-template-rows] duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                          <ul className="flex flex-col gap-1 overflow-hidden pl-6" inert={!open}>
                            {c.groups.map((g, i) => {
                              const selected = !searching && selection.category === c.id && selection.group === g.id;
                              return (
                                <li key={g.id} className={`${i === 0 ? 'pt-1' : ''} ${i === c.groups!.length - 1 ? 'pb-2' : ''}`}>
                                  <button
                                    type="button"
                                    className="rr-opnav__sub flex h-12 w-full items-center gap-3 rounded-pill pr-4 pl-5 text-left font-text text-[15px] leading-5"
                                    aria-current={selected ? 'true' : undefined}
                                    aria-controls={panelId}
                                    onClick={() => pickGroup(c, g.id)}
                                  >
                                    <span className="rr-opnav__dot size-1 shrink-0 rounded-full" aria-hidden="true" />
                                    <span className="min-w-0 flex-1">{g.label}</span>
                                    <span className="rr-opnav__count text-[13px] leading-none">{g.items.length}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Cards */}
          <div id={panelId} aria-live="polite" className="md:col-start-2 md:row-span-2 md:row-start-1 xl:col-span-3" {...revealItem(4)}>
            <nav aria-label="Вы здесь">
              <ol className="flex flex-wrap items-center gap-2 font-text text-[13px] leading-4 text-[#a4a09d]">
                {crumbs.map((c, i) => (
                  <li key={c} className="flex items-center gap-2">
                    {i > 0 && (
                      <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
                        <path d="m4.5 2.5 3.5 3.5-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <span className={i === crumbs.length - 1 ? 'text-[#2e2c2c]' : undefined} aria-current={i === crumbs.length - 1 ? 'page' : undefined}>
                      {c}
                    </span>
                  </li>
                ))}
              </ol>
            </nav>
            <h3
              ref={resultsHeading}
              className="mt-3 scroll-mt-24 font-display text-[28px] leading-9 font-normal tracking-[-0.01em] text-[#1b1919] max-md:text-[24px] max-md:leading-[30px] max-md:tracking-normal"
            >
              {heading}
            </h3>

            {searching && results.length === 0 && (
              <p className="mt-6 max-w-[460px] font-text text-[17px] leading-[22px] text-[#625f5e]">{operations.empty}</p>
            )}

            <ul
              key={searching ? 'search' : `${category.id}-${group?.id ?? ''}`}
              className="rr-op-grid mt-6 grid grid-cols-1 gap-5 max-md:mt-5 max-md:gap-4 min-[560px]:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
            >
              {items.map((item) => (
                <OperationCard key={item.name} item={item} />
              ))}
            </ul>
          </div>

          {/* Consultation card: under the menu on wide screens, after the cards on phones */}
          <div className="self-start md:col-start-1 md:row-start-2" {...revealItem(5)}>
            <ConsultCard />
          </div>
        </div>

        <p className="mt-6 font-text text-[13px] leading-4 text-[#a4a09d]">{operations.disclaimer}</p>
      </div>
    </section>
  );
}
