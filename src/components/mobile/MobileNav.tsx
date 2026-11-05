import { useEffect, useState, type MouseEvent } from 'react';
import { asset } from '../../data/hero';
import { useHero } from '../hero/HeroContext';
import { openSurgeonMenu, useSurgeonMenuTrigger } from '../surgeon-menu/menuTrigger';
import './mobile-nav.css';

/** Past this scroll the bar turns into the dark-glass pill; back above `EXPAND_AT` it is transparent again. */
const COLLAPSE_AT = 48;
const EXPAND_AT = 16;

interface MobileNavProps {
  /** Logo target: the hero on the home page, "/" elsewhere. */
  homeHref?: string;
  /** Always the dark-glass pill (pages whose top is white, e.g. /doctors/). */
  solid?: boolean;
}

/**
 * Phone header (design "01_Hero" 393 px: logo · phone · menu). Fixed, so it travels with the page: over the top
 * of the page it is transparent like the design, and once the page scrolls it gathers into a dark-glass pill
 * (as the desktop navbar island does). Used on the home page and on the inner pages.
 */
export function MobileNav({ homeHref = '#hero', solid = false }: MobileNavProps) {
  const { data, surgeonMenuOpen, setSurgeonMenuOpen } = useHero();
  const { clinic } = data;
  const menuTrigger = useSurgeonMenuTrigger('nav', surgeonMenuOpen);
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > COLLAPSE_AT);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      setScrolled((cur) => (!cur && y > COLLAPSE_AT ? true : cur && y <= EXPAND_AT ? false : cur));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onLogo = (event: MouseEvent<HTMLAnchorElement>) => {
    if (homeHref !== '#hero') return;
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="m-nav md:hidden" data-state={solid || scrolled ? 'solid' : 'clear'}>
      <div className="m-nav__bar">
        <a href={homeHref} onClick={onLogo} aria-label={`${clinic.name} — на главную`} className="m-nav__logo block">
          <img src={asset('assets/icons/logo.svg')} width={44} height={40} alt="" className="h-10 w-11" />
        </a>
        <a
          href={clinic.phoneHref}
          data-analytics-id="header_phone"
          className="absolute left-1/2 -translate-x-1/2 font-text text-[14px] leading-4 tracking-[-0.01em] whitespace-nowrap text-white"
        >
          {clinic.phone}
        </a>
        <button
          type="button"
          className="m-nav__menu grid size-[42px] place-items-center rounded-full bg-white"
          aria-label="Меню"
          {...menuTrigger}
          onClick={(e) => openSurgeonMenu(e.currentTarget, setSurgeonMenuOpen, 'nav')}
        >
          <svg viewBox="0 0 16 12" width={16} height={12} fill="none" aria-hidden="true">
            <path d="M1 1.5h14M4 6h11M8 10.5h7" stroke="#2e2c2c" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}
