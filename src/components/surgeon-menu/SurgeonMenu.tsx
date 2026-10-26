import { Modal } from 'antd';
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { asset } from '../../data/hero';
import { menu, type MenuDoctor } from '../../data/menu';
import { useHero } from '../hero/HeroContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { AntdProvider } from '../../theme/AntdProvider';
import { restoreTriggerFocus, setPageInert, SURGEON_MENU_ID } from './menuTrigger';
import { onAnchorClick, smoothScrollTo } from '../nav/smoothScroll';
import './surgeon-menu.css';

// Full-screen menu (design 2026-10-22, "Menu"): white page — header (logo, place, phone, close), section links
// on the left, "Ваш запрос. Ваш хирург" doctor list on the right, help line + WhatsApp CTA at the bottom.
// antd Modal = portal, top layer z 60, focus trap, Esc, scroll lock; we add: roving-tabindex listbox
// (arrows / Home / End, Enter/Space selects) and focus return to the trigger.

const LABEL_ID = `${SURGEON_MENU_ID}-doctors`;

const Arrow = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 12" width={20} height={12} fill="none" aria-hidden="true" className={className}>
    <path d="M1 6h17M13 1.5 18 6l-5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function SurgeonMenu() {
  const { data, surgeonMenuOpen, setSurgeonMenuOpen, selectedDoctorId, selectDoctor, reducedMotion } = useHero();
  const { clinic } = data;
  const doctors = menu.doctors as MenuDoctor[];
  // Doctor grid columns (two on desktop, one on phones) — arrow-key navigation follows them.
  const COLS = useIsMobile() ? 1 : 2;

  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(0);

  const close = () => setSurgeonMenuOpen(false);

  // N2-1: the page behind the modal is inert while it is open (antd portals the modal to <body>).
  useEffect(() => {
    setPageInert(surgeonMenuOpen);
    return () => setPageInert(false);
  }, [surgeonMenuOpen]);

  // On open: rove to the selected doctor (or the first) and focus it. The portal content and antd's focus
  // lock settle over a couple of frames, so try again when the open motion ends (afterOpenChange).
  const initialIndex = () => Math.max(0, doctors.findIndex((d) => d.doctorId && d.doctorId === selectedDoctorId));
  const focusInitial = () => {
    const option = optionRefs.current[initialIndex()];
    const onOption = document.activeElement?.closest('[role="option"]');
    if (option && !onOption) option.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (!surgeonMenuOpen) return;
    setActive(initialIndex());
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(focusInitial);
    });
    return () => cancelAnimationFrame(raf);
    // only when the menu opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surgeonMenuOpen]);

  const focusOption = (index: number) => {
    setActive(index);
    optionRefs.current[index]?.focus();
  };

  const scrollTo = (id: string) => {
    const target = document.getElementById(id);
    if (target) smoothScrollTo(target, { reducedMotion });
  };

  // A doctor with their own page opens it; otherwise one from the data filters the hero cases
  // ("познакомьтесь с его работами") and the rest go to the team section.
  const choose = (doctor: MenuDoctor) => {
    if (doctor.href) {
      window.location.assign(doctor.href);
      return;
    }
    if (doctor.doctorId) {
      selectDoctor(doctor.doctorId);
      scrollTo('hero');
    } else {
      scrollTo('doctors');
    }
    close();
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const n = doctors.length;
    const i = active;
    let next = -1;
    switch (event.key) {
      case 'ArrowRight':
        next = Math.min(n - 1, i + 1);
        break;
      case 'ArrowLeft':
        next = Math.max(0, i - 1);
        break;
      case 'ArrowDown':
        next = i + COLS < n ? i + COLS : i;
        break;
      case 'ArrowUp':
        next = i - COLS >= 0 ? i - COLS : i;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = n - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choose(doctors[i]);
        return;
      default:
        return;
    }
    event.preventDefault();
    focusOption(next);
  };

  const onReset = () => {
    selectDoctor(null);
    focusOption(0);
  };

  // Tab / Shift+Tab wrap inside the dialog (with #root inert there is nothing else to reach, but focus
  // could still escape to the browser chrome).
  const onTrapKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const focusables = [
      ...event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]'),
    ].filter((el) => el.getClientRects().length > 0);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const activeEl = document.activeElement;
    if (event.shiftKey && (activeEl === first || !event.currentTarget.contains(activeEl))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeEl === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <AntdProvider>
      <Modal
        open={surgeonMenuOpen}
        onCancel={close}
        afterClose={restoreTriggerFocus}
        afterOpenChange={(opened) => opened && focusInitial()}
        title={null}
        footer={null}
        closable={false}
        width="100%"
        zIndex={60}
        destroyOnHidden
        keyboard
        mask={{ enabled: true, closable: false }}
        focusable={{ trap: true, focusTriggerAfterClose: false }}
        transitionName={reducedMotion ? '' : 'smenu-panel'}
        maskTransitionName={reducedMotion ? '' : 'smenu-fade'}
        wrapProps={{ id: SURGEON_MENU_ID, 'aria-label': 'Меню' }}
        rootClassName="smenu-root"
        className="top-0 m-0 max-w-none pb-0 font-text text-[#2e2c2c]"
        classNames={{
          mask: 'bg-white',
          wrapper: 'overflow-y-auto overscroll-contain',
          container:
            'mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col rounded-none bg-transparent px-20 pt-[42px] pb-[51px] shadow-none max-md:px-4 max-md:pt-[31px] max-md:pb-8',
          body: 'flex flex-1 flex-col p-0',
        }}
        modalRender={(node) => (
          <div className="contents" onKeyDown={onTrapKeyDown}>
            {node}
          </div>
        )}
      >
        {/* Header: logo · place, phone in the middle, close at the right (all on the 60 px line) */}
        <div className="relative flex h-[42px] items-center">
          <span
            className="smenu-logo block h-[42px] w-[44px]"
            role="img"
            aria-label={clinic.name}
          />
          <span className="ml-[63px] text-[14px] leading-4 text-[#7b7876] uppercase max-md:hidden">{menu.place}</span>
          <a
            href={clinic.phoneHref}
            className="smenu-hover absolute left-[706px] text-[14px] leading-4 text-[#7b7876] hover:text-[#bb9358] max-md:left-1/2 max-md:-translate-x-1/2"
          >
            {clinic.phone}
          </a>
          <button
            type="button"
            onClick={close}
            className="smenu-close ml-auto inline-flex h-8 cursor-pointer items-center gap-2 text-[14px] leading-4 text-[#2e2c2c] hover:text-[#bb9358]"
          >
            {menu.close}
            <svg viewBox="0 0 8 8" width={8} height={8} fill="none" aria-hidden="true">
              <path d="M1 1l6 6M7 1 1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-[77px] grid grid-cols-[420px_1fr] items-start max-md:mt-10 max-md:grid-cols-1 max-md:gap-12">
          <nav aria-label="Разделы клиники">
            <p className="text-[14px] leading-4 text-[#7b7876] uppercase">{menu.eyebrow}</p>
            <ul className="mt-[22px] flex flex-col gap-8 max-md:mt-4 max-md:gap-4">
              {menu.links.map((link, i) => (
                <li key={link.href} className="smenu-in" style={{ '--i': i } as CSSProperties}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      onAnchorClick(e, reducedMotion);
                      close();
                    }}
                    className="smenu-link inline-flex items-center gap-3.5 font-display text-[28px] leading-9 font-light tracking-[-0.02em] text-[#2e2c2c] hover:text-[#bb9358] focus-visible:text-[#bb9358] max-md:text-[24px] max-md:leading-8"
                  >
                    {link.label}
                    <Arrow className="smenu-arrow" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <section aria-labelledby={LABEL_ID}>
            <h2
              id={LABEL_ID}
              className="font-display text-[32px] leading-10 font-light tracking-[-0.02em] text-[#2e2c2c] max-md:text-[26px] max-md:leading-8"
            >
              {menu.title}
            </h2>
            <div className="mt-[19px] flex min-h-6 items-center justify-between gap-4">
              <p className="text-[20px] leading-6 tracking-[0.01em] text-[#7b7876] max-md:text-[16px] max-md:leading-5">{menu.subtitle}</p>
              {selectedDoctorId && (
                <button
                  type="button"
                  onClick={onReset}
                  className="smenu-reset cursor-pointer text-[13px] leading-4 text-[#7b7876] underline decoration-[#c9c4bf] underline-offset-2 hover:text-[#2e2c2c] hover:decoration-[#bb9358]"
                >
                  Сбросить выбор
                </button>
              )}
            </div>

            <ul
              role="listbox"
              aria-labelledby={LABEL_ID}
              aria-orientation="vertical"
              className="mt-[25px] grid grid-cols-2 gap-x-9 max-md:mt-5 max-md:grid-cols-1"
              onKeyDown={onListKeyDown}
            >
              {doctors.map((doctor, i) => {
                const selected = Boolean(doctor.doctorId) && doctor.doctorId === selectedDoctorId;
                return (
                  <li
                    key={doctor.name}
                    ref={(el) => {
                      optionRefs.current[i] = el;
                    }}
                    role="option"
                    tabIndex={i === active ? 0 : -1}
                    aria-selected={selected}
                    aria-label={`${doctor.name}. ${doctor.tags.join(', ')}`}
                    onClick={() => {
                      setActive(i);
                      choose(doctor);
                    }}
                    onFocus={() => setActive(i)}
                    className="smenu-doc smenu-in h-[84px] cursor-pointer max-md:h-[76px] border-t border-[#dfdddc] pt-[7px] outline-none"
                    style={{ '--i': i } as CSSProperties}
                  >
                    <span className="smenu-doc__name inline-flex items-center gap-3 font-display text-[20px] leading-[26px] font-light">
                      {doctor.name}
                      <Arrow className="smenu-arrow" />
                    </span>
                    <span className="mt-[9px] block text-[15px] leading-[18px] text-[#615f5e]">
                      {doctor.tags.join(' · ')}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="mt-auto flex items-end justify-between pt-12 max-md:flex-col max-md:items-stretch max-md:gap-5">
          <p className="text-[23.5px] leading-[25px] text-[#2e2c2c] max-md:text-[18px] max-md:leading-[22px]">
            {menu.help[0]}
            <br />
            {menu.help[1]}
          </p>
          <a
            href={clinic.whatsappHref || '#contacts'}
            target={clinic.whatsappHref ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="smenu-cta inline-flex h-[50px] w-[238px] max-md:w-full items-center justify-center gap-2.5 rounded-pill bg-[#eae8e8] font-display text-[14.5px] leading-6 text-[#2e2c2c] hover:bg-[#2e2c2c] hover:text-white"
          >
            <img src={asset('assets/icons/whatsapp.svg')} width={22} height={22} alt="" className="size-[22px]" />
            {menu.consultLabel}
          </a>
        </div>
      </Modal>
    </AntdProvider>
  );
}
