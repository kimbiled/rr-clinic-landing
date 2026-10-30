import { asset, heroData } from '../../data/hero';
import { footer, operations } from '../../data/landing';
import { whatsappLink } from './whatsapp';
import './sections.css';

/** Phones: "© … | Лицензии" on one row, the two policies on the next. */
const LEGAL_MOBILE = ['max-md:mt-6 max-md:justify-self-end', 'max-md:mt-3', 'max-md:mt-3 max-md:justify-self-end'];

function Arrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" className="rr-foot__arrow">
      <path d="M1 5h8M5.5 1.5 9 5 5.5 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Footer (design 2026-10-29): logo, tagline and socials; "Клиника" / "Популярные услуги" / "Контакты" columns
 * with the map card; legal row; the designer's outlined "RR Clinic" SVG below.
 */
export function Footer() {
  const { clinic } = heroData;
  const { contacts, services } = footer;

  return (
    <footer id={footer.id} className="rr-section relative overflow-hidden bg-white pt-[60px] text-neutral-900 max-md:pt-6">
      <span className="rr-rule rr-rule--warm pointer-events-none absolute inset-x-0" aria-hidden="true" />
      <div className="mx-auto max-w-[1440px] px-(--sec-pad)">
        <div className="rr-frame rr-frame--warm relative grid grid-cols-[396px_218px_272px_1fr] px-6 pt-6 pb-8 max-md:grid-cols-2 max-md:gap-x-4 max-md:px-0 max-md:pb-6">
          <div className="max-md:col-span-2 max-md:grid max-md:grid-cols-[auto_1fr] max-md:items-start max-md:gap-x-4">
            <a href="#hero" aria-label="RR Clinic — наверх" className="inline-block">
              <img src={asset('assets/icons/logo-gold.svg')} width={35} height={32} alt="" className="h-8 w-[35px]" />
            </a>
            <p className="mt-5 max-w-[262px] font-text text-[15px] leading-[1.2] text-[#625f5e] max-md:mt-0 max-md:max-w-none max-md:text-[12px] max-md:leading-4">
              {footer.tagline}
            </p>
            <div className="mt-9 flex gap-3 max-md:col-span-2 max-md:mt-3">
              <a
                href={footer.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram RR Clinic"
                className="rr-foot__social grid size-10 place-items-center rounded-full"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <rect x="1.5" y="1.5" width="15" height="15" rx="4.5" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="9" cy="9" r="3.4" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="13.3" cy="4.7" r="0.9" fill="currentColor" />
                </svg>
              </a>
              <a
                {...whatsappLink('Здравствуйте!')}
                data-analytics-id="footer_whatsapp"
                aria-label="WhatsApp RR Clinic"
                className="rr-foot__social grid size-10 place-items-center rounded-full"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path
                    d="M9 1.6a7.4 7.4 0 0 0-6.4 11.1L1.6 16.4l3.8-1a7.4 7.4 0 1 0 3.6-13.8Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.3 5.5c.2-.4.4-.4.6-.4h.4c.2 0 .3 0 .5.4l.6 1.4c0 .2 0 .3-.1.4l-.4.5c-.1.1-.2.3 0 .5.3.5.7 1 1.1 1.4.5.4 1 .7 1.5.9.2.1.4 0 .5-.1l.5-.6c.1-.2.3-.2.5-.1l1.3.6c.2.1.3.2.3.3 0 .2 0 .8-.4 1.2-.4.4-1.1.6-1.6.5-.9-.1-2.2-.6-3.3-1.6-1-.9-1.7-2-2-2.9-.2-.8 0-1.6.5-2.4Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
            </div>
          </div>

          {footer.columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="max-md:mt-8">
              <h2 className="rr-foot__title">{column.title}</h2>
              <ul className="mt-7 flex flex-col gap-[15px] max-md:mt-4 max-md:gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="rr-foot__link">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <nav aria-label={services.title} className="max-md:mt-8">
            <h2 className="rr-foot__title">{services.title}</h2>
            <ul className="mt-7 flex flex-col gap-[15px] max-md:mt-4 max-md:gap-3">
              {services.items.map((name) => (
                <li key={name}>
                  <a {...whatsappLink(operations.message.replace('{name}', name))} data-analytics-id="footer_service_enquiry" className="rr-foot__link">
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="max-md:col-span-2 max-md:mt-8">
            <h2 className="rr-foot__title">{contacts.title}</h2>
            <address className="mt-7 flex flex-col items-start gap-[15px] not-italic">
              <span className="rr-foot__text">{contacts.address}</span>
              {clinic.phone && (
                <a href={clinic.phoneHref} data-analytics-id="footer_phone" className="rr-foot__link inline-flex items-center gap-2">
                  {clinic.phone}
                  <Arrow />
                </a>
              )}
              <a href={`mailto:${contacts.email}`} data-analytics-id="footer_email" className="rr-foot__link inline-flex items-center gap-2">
                {contacts.email}
                <Arrow />
              </a>
            </address>

            <a
              href={contacts.map.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rr-foot__map relative mt-7 block h-[152px] w-[295px] overflow-hidden rounded-[24px] max-md:mt-5 max-md:h-[146px] max-md:w-[284px] max-md:rounded-[20px]"
              aria-label={`${contacts.map.alt} — открыть в 2GIS`}
            >
              <img
                src={asset(contacts.map.src)}
                width={contacts.map.width}
                height={contacts.map.height}
                alt=""
                loading="lazy"
                decoding="async"
                className="rr-foot__map-img size-full object-cover"
              />
              <span className="absolute top-[54%] left-1/2 size-[11px] -translate-1/2 rounded-full border-2 border-white bg-[#c39b62]" />
              <span className="absolute top-[54%] left-1/2 -translate-y-[calc(100%+10px)] rounded-pill bg-[#c39b62] px-3 py-1 font-text text-[13px] leading-4 text-white">
                RR Clinic
              </span>
              <span className="absolute right-2 bottom-1 font-text text-[9px] leading-3 text-[#8c8784]">© OpenStreetMap</span>
            </a>
          </div>

          <p className="rr-foot__muted col-start-1 mt-8 max-md:mt-6">{footer.copyright}</p>
          {footer.legal.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              className={`rr-foot__legal mt-8 justify-self-start ${LEGAL_MOBILE[i] ?? ''}`}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <span className="rr-rule rr-rule--warm pointer-events-none absolute inset-x-0" aria-hidden="true" />

      {/* Designer export includes the outline and gradient. */}
      <div className="mx-auto max-w-[1440px] px-(--sec-pad)" aria-hidden="true">
        <img
          src={asset(footer.wordmark.src)}
          width={footer.wordmark.width}
          height={footer.wordmark.height}
          alt=""
          loading="lazy"
          decoding="async"
          className="rr-foot__mark"
        />
      </div>
    </footer>
  );
}
