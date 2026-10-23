import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { asset } from '../../data/hero';
import { useHero } from '../hero/HeroContext';
import { openSurgeonMenu, useSurgeonMenuTrigger } from '../surgeon-menu/menuTrigger';
import { onAnchorClick, smoothScrollTo } from './smoothScroll';
import './navbar.css';

// Navbar (owner FE-3). Expanded bar (Figma 1610:466) ⇄ centred dark-glass island on scroll (spec §2.2, §9.6).
//
// m-6 (CLS 0): nothing changes layout when the state flips. Each item keeps its expanded box and gets a
// translateX() to its island slot (computed from the measured widths below); the surface is an island-sized
// box scaled onto the expanded bar. Transitions are plain CSS on transform/opacity, so an interrupted morph
// retargets smoothly.
// The nav is NOT inside the scaled hero stage: getBoundingClientRect/offset* here are real CSS px.
//
// M-3 contrast (white 14 px Futura PT 500 links vs the pill behind them, 1440 hero render, WCAG ratio):
//   Figma pill (white 20 % glass only) ......... median 2.9 : 1, mean 3.2, p05 2.3
//   + rgb(41 29 16 / .30) tint under the glass .. median 3.9 : 1, mean 4.2, p05 3.2 (+ soft dark text halo)
//   island surface rgb(41 29 16 / .74) ......... ≥ 7 : 1 over the hero and over Taupe/50
// 4.5 : 1 median would need a ≈ .40 tint, which turns the light-glass pill visibly brown (designer call).

const COLLAPSE_AT = 80;
const EXPAND_AT = 40;
const ROW = { top: 20, height: 40 };
const ISLAND = {
  top: 12,
  height: 56,
  padL: 22,
  padR: 8,
  logoGap: 18,
  menuBtnGap: 8, // "Меню" pill → links
  linkGap: 20,
  menuPad: 4,
  dividerL: 20,
  dividerW: 1,
  dividerR: 18,
};

interface Geo {
  /** Island width and left edge (viewport px). */
  width: number;
  left: number;
  rowLeft: number;
  rowWidth: number;
  logoDx: number;
  menuBtnDx: number;
  linkDx: number[];
  menuDx: number;
  menuScale: number;
  dividerX: number;
  actionsDx: number;
}

/**
 * Left offset of `el` inside `root`, summed along the offsetParent chain. offset* ignore transforms, but a
 * transformed ancestor (e.g. a reveal wrapper mid-animation) can become the offsetParent, so never read a
 * single offsetLeft.
 */
function leftIn(el: HTMLElement, root: HTMLElement): number {
  let x = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    node = node.offsetParent as HTMLElement | null;
  }
  return x;
}

const tx = (dx: number | undefined, island: boolean): CSSProperties | undefined =>
  dx === undefined ? undefined : { transform: `translateX(${island ? dx : 0}px)` };

export function Navbar() {
  const { data, reducedMotion, surgeonMenuOpen, setSurgeonMenuOpen } = useHero();
  const menuTrigger = useSurgeonMenuTrigger('nav', surgeonMenuOpen);
  const { clinic, nav } = data;

  const navRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLElement | null)[]>([]);

  // Reload mid-scroll → straight to the island, no morph.
  const [island, setIsland] = useState(() => typeof window !== 'undefined' && window.scrollY > COLLAPSE_AT);
  const islandRef = useRef(island);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  /** Switch transitions off for this frame (initial state, resize, scroll jumps), back on two frames later. */
  const animTimer = useRef(0);
  const suspendAnim = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    el.dataset.anim = 'off';
    cancelAnimationFrame(animTimer.current);
    animTimer.current = requestAnimationFrame(() => {
      animTimer.current = requestAnimationFrame(() => {
        if (navRef.current) navRef.current.dataset.anim = 'on';
      });
    });
  }, []);

  const measure = useCallback(() => {
    const row = rowRef.current;
    const logo = logoRef.current;
    const menuBtn = menuBtnRef.current;
    const menu = menuRef.current;
    const actions = actionsRef.current;
    const links = linkRefs.current.filter((el): el is HTMLElement => !!el);
    if (!row || !logo || !menuBtn || !menu || !actions || !links.length) return;

    // offset* ignore transforms, so this is always the expanded layout.
    const vw = document.documentElement.clientWidth;
    const rowLeft = row.offsetLeft;
    const widths = links.map((a) => a.offsetWidth);
    const menuIslandW = ISLAND.menuPad * 2 + widths.reduce((s, w) => s + w, 0) + ISLAND.linkGap * (widths.length - 1);
    const width =
      ISLAND.padL +
      logo.offsetWidth +
      ISLAND.logoGap +
      menuBtn.offsetWidth +
      ISLAND.menuBtnGap +
      menuIslandW +
      ISLAND.dividerL +
      ISLAND.dividerW +
      ISLAND.dividerR +
      actions.offsetWidth +
      ISLAND.padR;
    const left = Math.round((vw - width) / 2);

    const logoX = left + ISLAND.padL;
    const menuBtnX = logoX + logo.offsetWidth + ISLAND.logoGap;
    const menuX = menuBtnX + menuBtn.offsetWidth + ISLAND.menuBtnGap;
    const menuExpandedX = rowLeft + leftIn(menu, row);
    let x = menuX + ISLAND.menuPad;
    const linkDx = links.map((a, i) => {
      const dx = x - (rowLeft + leftIn(a, row));
      x += widths[i] + ISLAND.linkGap;
      return dx;
    });
    const dividerX = menuX + menuIslandW + ISLAND.dividerL;
    const actionsX = dividerX + ISLAND.dividerW + ISLAND.dividerR;

    setGeo({
      width,
      left,
      rowLeft,
      rowWidth: row.offsetWidth,
      logoDx: logoX - (rowLeft + leftIn(logo, row)),
      menuBtnDx: menuBtnX - (rowLeft + leftIn(menuBtn, row)),
      linkDx,
      menuDx: menuX - menuExpandedX,
      menuScale: menuIslandW / menu.offsetWidth,
      dividerX,
      actionsDx: actionsX - (rowLeft + leftIn(actions, row)),
    });
  }, []);

  // Geometry: before first paint, again when the webfonts land (link widths change) and on resize.
  useLayoutEffect(() => {
    suspendAnim();
    measure();
    let alive = true;
    document.fonts?.ready
      .then(() => {
        if (!alive) return;
        suspendAnim();
        measure();
      })
      .catch(() => {});
    const onResize = () => {
      suspendAnim();
      measure();
    };
    window.addEventListener('resize', onResize);
    return () => {
      alive = false;
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animTimer.current);
    };
  }, [measure, suspendAnim]);

  // Scroll → rAF → hysteresis (collapse at y > 80, expand at y ≤ 40).
  useEffect(() => {
    let ticking = false;
    let lastY = window.scrollY;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const jump = Math.abs(y - lastY) > 400; // scroll restoration / Home / End: swap without the morph
      lastY = y;
      const current = islandRef.current;
      const next = !current && y > COLLAPSE_AT ? true : current && y <= EXPAND_AT ? false : current;
      if (next === current) return;
      islandRef.current = next;
      if (jump) suspendAnim();
      setIsland(next);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => window.removeEventListener('scroll', onScroll);
  }, [suspendAnim]);

  // Reduced motion: instant swap with a short crossfade (spec §9.7).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!reducedMotion) return;
    [rowRef.current, surfaceRef.current].forEach((el) =>
      el?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'linear' }),
    );
  }, [island, reducedMotion]);

  // M-3: never let the island cover the keyboard-focused element (backs up html scroll-padding-top).
  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!islandRef.current || !(target instanceof HTMLElement)) return;
      if (navRef.current?.contains(target) || !target.matches(':focus-visible')) return;
      if (target.closest('[role="dialog"]')) return;
      const rect = target.getBoundingClientRect();
      const islandBottom = ISLAND.top + ISLAND.height + 8;
      if (rect.top < islandBottom && rect.bottom > 0) {
        window.scrollBy({ top: rect.top - (islandBottom + 20), behavior: 'auto' });
      }
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, []);

  // aria-current + gold dot for the section in view (only anchors whose target exists).
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const targets = nav
      .map((item) => ({ id: item.id, el: item.href.startsWith('#') ? document.getElementById(item.href.slice(1)) : null }))
      .filter((t): t is { id: string; el: HTMLElement } => !!t.el);
    if (!targets.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const hit = targets.find((t) => t.el === entry.target);
          if (!hit) return;
          if (entry.isIntersecting) setActiveId(hit.id);
          else setActiveId((cur) => (cur === hit.id ? null : cur));
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    targets.forEach((t) => io.observe(t.el));
    return () => io.disconnect();
  }, [nav]);

  const onLogo = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    smoothScrollTo(0, { reducedMotion });
  };

  const surfaceStyle: CSSProperties | undefined = geo
    ? {
        width: geo.width,
        height: ISLAND.height,
        borderRadius: ISLAND.height / 2,
        transform: island
          ? `translate(${geo.left}px, ${ISLAND.top}px)`
          : `translate(${geo.rowLeft}px, ${ROW.top}px) scale(${geo.rowWidth / geo.width}, ${ROW.height / ISLAND.height})`,
      }
    : { display: 'none' };

  const linkClass =
    'rr-nav__link rr-nav__flip pointer-events-auto relative block cursor-pointer py-[13px] font-medium whitespace-nowrap text-white';

  return (
    <header
      ref={navRef}
      className="rr-nav pointer-events-none fixed inset-x-0 top-0 z-(--z-nav) h-20 font-text text-[14px] leading-[14px] tracking-[-0.1px] text-white"
      data-state={island ? 'island' : 'expanded'}
      data-anim="off"
      style={{ '--nav-morph': island ? '420ms' : '360ms' } as CSSProperties}
    >
      <div ref={surfaceRef} className="rr-nav__surface absolute top-0 left-0" style={surfaceStyle} aria-hidden="true" />
      <span
        className="rr-nav__divider absolute top-[30px] left-0 h-5 w-px bg-white/16"
        style={{ transform: `translateX(${geo?.dividerX ?? 0}px)` }}
        aria-hidden="true"
      />

      <div ref={rowRef} className="absolute top-5 right-(--nav-pad-x) left-(--nav-pad-x) flex h-10 items-center">
        {/* Futura PT 14. Figma lists tracking −0.21 px, but −0.1 px is what reproduces the reference render
            (menu pill 388 px, link and phone positions within 1 px). */}
        <div className="flex-none" data-reveal="nav">
          <a
            ref={logoRef}
            href="#hero"
            onClick={onLogo}
            aria-label={`${clinic.name} — на главную`}
            className="rr-nav__flip pointer-events-auto block h-8 w-[35px] rounded-[4px]"
            style={tx(geo?.logoDx, island)}
          >
            <img src={asset('assets/icons/logo.svg')} width={35} height={32} alt="" className="rr-nav__logo-img h-8 w-[35px] origin-center" />
          </a>
        </div>

        {/* "Меню": opens the full-screen menu; same glass as the links pill */}
        <div className="ml-[29px] flex-none" data-reveal="nav">
          <button
            ref={menuBtnRef}
            type="button"
            className="rr-nav__flip rr-nav__menu-btn pointer-events-auto flex h-10 items-center gap-2 rounded-pill pr-[18px] pl-4 font-medium whitespace-nowrap text-white"
            style={tx(geo?.menuBtnDx, island)}
            {...menuTrigger}
            onClick={(e) => openSurgeonMenu(e.currentTarget, setSurgeonMenuOpen, 'nav')}
          >
            <svg viewBox="0 0 18 12" width={18} height={12} fill="none" aria-hidden="true">
              <path d="M1 1h16M1 6h16M1 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Меню
          </button>
        </div>

        <div className="ml-2 flex-none" data-reveal="nav">
          <nav ref={menuRef} aria-label="Основное меню" className="relative flex h-10 items-center px-4">
            <span
              className="rr-nav__menu-bg absolute inset-0 rounded-md"
              style={geo ? { transform: island ? `translateX(${geo.menuDx}px) scaleX(${geo.menuScale})` : 'none' } : undefined}
              aria-hidden="true"
            />
            <ul className="rr-nav__links relative flex items-center gap-4">
              {nav.map((item, i) => (
                <li key={item.id}>
                  {item.id === 'doctors' ? (
                    <button
                      ref={(el) => {
                        linkRefs.current[i] = el;
                      }}
                      type="button"
                      className={linkClass}
                      style={tx(geo?.linkDx[i], island)}
                      {...menuTrigger}
                      onClick={(e) => openSurgeonMenu(e.currentTarget, setSurgeonMenuOpen, 'nav')}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <a
                      ref={(el) => {
                        linkRefs.current[i] = el;
                      }}
                      href={item.href}
                      className={linkClass}
                      style={tx(geo?.linkDx[i], island)}
                      aria-current={activeId === item.id ? 'true' : undefined}
                      onClick={(e) => onAnchorClick(e, reducedMotion)}
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mr-6 ml-auto flex-none" data-reveal="nav">
          <a href={clinic.phoneHref} className="rr-nav__phone pointer-events-auto block font-normal whitespace-nowrap">
            {clinic.phone}
          </a>
        </div>

        <div className="flex-none" data-reveal="nav">
          <div ref={actionsRef} className="rr-nav__flip pointer-events-auto flex items-center" style={tx(geo?.actionsDx, island)}>
            {/* One button: the "Связаться" pill fused with the WhatsApp disc, both open WhatsApp. */}
            <a
              href={clinic.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Связаться в WhatsApp"
              className="rr-nav__contact flex h-10 items-center font-medium whitespace-nowrap text-neutral-900"
            >
              <span className="rr-nav__contact-pill flex h-full items-center rounded-[14px] pr-[18px] pl-4">Связаться</span>
              <span className="rr-nav__contact-wa -ml-1 grid size-10 place-items-center rounded-full">
                <img src={asset('assets/icons/whatsapp.svg')} width={16} height={16} alt="" className="size-4" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
