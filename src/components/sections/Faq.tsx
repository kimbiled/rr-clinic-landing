import { useId, useState } from 'react';
import { faq, type FaqTopic } from '../../data/landing';
import { withBreaks } from './RichText';
import { revealItem, revealScope, useInView } from './useInView';
import { whatsappLink } from './whatsapp';
import './sections.css';

type TabId = FaqTopic | 'all';

function Question({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <li className="rr-faq__item" data-open={open || undefined}>
      <h3>
        <button
          type="button"
          className="rr-faq__q flex w-full items-center justify-between gap-8 py-[25px] text-left font-display text-[17px] max-md:gap-4 max-md:py-4 max-md:text-[14px] max-md:leading-5 leading-6 font-normal tracking-[-0.01em] text-[#2e2c2c]"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
        >
          {question}
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="rr-faq__icon shrink-0 text-[#2e2c2c]">
            <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </h3>
      {/* 0fr → 1fr rows animate the answer's height without measuring it */}
      <div id={id} role="region" className="rr-faq__a grid" aria-hidden={!open}>
        <div className="overflow-hidden">
          <p className="max-w-[860px] pb-7 font-text text-[17px] leading-[1.4] text-[#625f5e] max-md:pb-4 max-md:text-[13px]">{answer}</p>
        </div>
      </div>
    </li>
  );
}

/**
 * "Ответы на вопросы, которые задают чаще всего" (design 2026-10-29): heading, topic tabs, an accordion inside
 * the thin section frame, and the green "Не нашли ответ на свой вопрос?" bar with a WhatsApp button.
 */
export function Faq() {
  const { ref, inView } = useInView<HTMLElement>();
  const [tab, setTab] = useState<TabId>('all');
  const items = tab === 'all' ? faq.items : faq.items.filter((item) => item.topic === tab);
  const { cta } = faq;

  return (
    <section
      ref={ref}
      id={faq.id}
      aria-labelledby="faq-title"
      className="rr-section relative bg-white pt-[72px] pb-16 text-neutral-900 max-md:pt-12 max-md:pb-12"
      {...revealScope(inView)}
    >
      <div className="mx-auto max-w-[1440px] px-(--sec-pad)">
        <h2
          id="faq-title"
          className="font-display text-[36px] leading-[44px] font-normal tracking-[-0.02em] text-[#1b1919] max-md:text-[26px] max-md:leading-8"
          {...revealItem(0)}
        >
          <span className="max-md:hidden">{faq.title}</span>
          <span className="md:hidden">{faq.mobileTitle}</span>
        </h2>
        <p className="mt-3 font-text text-[17px] leading-[20px] text-[#8c8784] max-md:mt-2 max-md:text-[13px] max-md:leading-[17px] max-md:[&_br]:hidden" {...revealItem(1)}>
          {withBreaks(faq.text)}
        </p>

        <div
          role="tablist"
          aria-label="Темы вопросов"
          className="rr-faq__tabs mt-6 inline-flex gap-1 rounded-pill p-2 max-md:mt-4 max-md:flex max-md:overflow-x-auto max-md:p-1.5"
          {...revealItem(2)}
        >
          {faq.tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className="rr-faq__tab h-10 shrink-0 rounded-pill px-5 font-text text-[16px] leading-none font-medium max-md:h-9 max-md:px-3.5 max-md:text-[13px]"
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <span className="rr-rule pointer-events-none absolute inset-x-0 mt-9 max-md:mt-5" aria-hidden="true" />
      <div className="mx-auto mt-9 max-w-[1440px] px-(--sec-pad) max-md:mt-5">
        <div className="rr-frame relative px-10 pt-2 pb-3 max-md:px-0 max-md:py-0" {...revealItem(3)}>
          <ul key={tab} className="rr-faq__list" role="tabpanel" aria-label={faq.tabs.find((t) => t.id === tab)?.label}>
            {items.map((item) => (
              <Question key={item.question} question={item.question} answer={item.answer} />
            ))}
          </ul>
        </div>
      </div>
      <span className="rr-rule pointer-events-none absolute inset-x-0" aria-hidden="true" />

      <div className="mx-auto mt-6 max-w-[1440px] px-(--sec-pad)">
        <div
          className="rr-ask flex h-[112px] items-center justify-between gap-8 rounded-[28px] pr-6 pl-6 max-md:h-auto max-md:flex-col max-md:items-stretch max-md:gap-4 max-md:rounded-[20px] max-md:p-4"
          {...revealItem(4)}
        >
          <div>
            <h3 className="font-display text-[24px] leading-8 font-normal text-white max-md:text-[18px] max-md:leading-6">{cta.title}</h3>
            <p className="mt-[2px] font-text text-[17px] leading-[22px] text-white/75 max-md:text-[12px] max-md:leading-4">{cta.text}</p>
          </div>
          <a
            {...whatsappLink(cta.message)}
            className="rr-ask__btn inline-flex h-[64px] shrink-0 items-center rounded-pill bg-white px-7 font-display text-[18px] leading-6 text-[#1b1919] max-md:h-12 max-md:justify-center max-md:text-[15px]"
          >
            {cta.label}
          </a>
        </div>
      </div>
    </section>
  );
}
