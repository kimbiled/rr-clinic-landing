import { asset, heroData } from '../../data/hero';
import { whatsappLink } from '../../components/sections/whatsapp';
import { HeroProvider } from '../../components/hero/HeroContext';
import { MobileNav } from '../../components/mobile/MobileNav';
import { DeferredSurgeonMenu } from '../../components/surgeon-menu/DeferredSurgeonMenu';
import { useIsMobile } from '../../hooks/useIsMobile';
import './site-header.css';

/** Inner pages' section links: back to the home page's blocks, "Врачи" to the surgeons page. */
const LINKS = [
  { label: 'О клинике', href: '/#trust' },
  { label: 'Услуги', href: '/#services' },
  { label: 'Врачи', href: '/doctors/' },
  { label: 'До/после', href: '/#works' },
  { label: 'Цены', href: '/#operations' },
  { label: 'Контакты', href: '#contacts' },
];

export function WhatsAppIcon({ size = 18 }: { size?: number }) {
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

/**
 * Header of the inner pages: logo, section links, phone, "Связаться" + WhatsApp. `light` sits on white
 * (the surgeons page); `overlay` sits on a photo (a doctor's hero): white logo and phone, glass links.
 */
export function SiteHeader({ tone = 'light', current }: { tone?: 'light' | 'overlay'; current?: string }) {
  const { clinic } = heroData;
  const isMobile = useIsMobile();

  // Phones: the home page's header (logo · phone · menu), fixed so it stays with the page, and its menu.
  // The spacer keeps the page's first block where the in-flow header used to push it.
  if (isMobile) {
    return (
      <HeroProvider>
        <MobileNav homeHref="/" solid={tone === 'light'} />
        <div className="h-20" aria-hidden="true" />
        <DeferredSurgeonMenu />
      </HeroProvider>
    );
  }

  return (
    <header className="site-header mx-auto flex h-[80px] max-w-[1440px] items-center gap-6 px-(--sec-pad) max-md:h-16" data-tone={tone}>
      <a href="/" aria-label="RR Clinic — на главную" className="shrink-0">
        <img src={asset(tone === 'overlay' ? 'assets/icons/logo.svg' : 'assets/icons/logo-gold.svg')} width={35} height={32} alt="" className="h-8 w-[35px]" />
      </a>
      <nav aria-label="Разделы клиники" className="max-md:hidden">
        <ul className="site-header__nav flex h-10 items-center gap-5 rounded-[14px] px-4">
          {LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                aria-current={link.href === current ? 'page' : undefined}
                className="site-header__link font-text text-[14px] leading-4 font-medium whitespace-nowrap"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="ml-auto flex items-center gap-6 max-md:gap-3">
        <a href={clinic.phoneHref} data-analytics-id="header_phone" className="site-header__phone font-text text-[14px] leading-4 whitespace-nowrap">
          {clinic.phone}
        </a>
        {/* As on the home page: the "Связаться" pill fused with the WhatsApp disc, both open WhatsApp. */}
        <a
          {...whatsappLink('Здравствуйте!')}
          data-analytics-id="header_whatsapp"
          aria-label="Связаться в WhatsApp"
          className="site-header__contact flex h-10 items-center text-[#2e2c2c]"
        >
          <span className="site-header__pill flex h-full items-center rounded-[14px] pr-[18px] pl-4 font-text text-[14px] font-medium whitespace-nowrap max-md:hidden">
            Связаться
          </span>
          <span className="site-header__icon -ml-1 grid size-10 place-items-center rounded-full max-md:ml-0">
            <img src={asset('assets/icons/whatsapp.svg')} width={16} height={16} alt="" className="size-4" />
          </span>
        </a>
      </div>
    </header>
  );
}
