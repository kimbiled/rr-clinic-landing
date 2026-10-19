import { Avatar, Button, Modal, Tag } from 'antd';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react';
import { asset } from '../../data/hero';
import { CtaButton } from '../hero/CtaButton';
import { useHero } from '../hero/HeroContext';
import { AntdProvider } from '../../theme/AntdProvider';
import {
  caseCount,
  caseCountLabel,
  doctorInitials,
  doctorName,
  restoreTriggerFocus,
  setPageInert,
  SURGEON_MENU_ID,
} from './menuTrigger';
import './surgeon-menu.css';

// Surgeon selection menu ("Меню выбора хирурга"), design-spec §7.2 (layout PROPOSED from Figma 1565:3926 geometry).
// antd Modal = portal, top layer z 60, focus trap, Esc, scroll lock; we add: roving-tabindex listbox
// (arrows / Home / End, Enter/Space selects), close on click outside any surface, focus return to the trigger.

const COLS = 2;
const LABEL_ID = `${SURGEON_MENU_ID}-doctors`;

const CloseIcon = (
  <svg viewBox="0 0 18 18" width={18} height={18} fill="none" aria-hidden="true">
    <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export function SurgeonMenu() {
  const { data, surgeonMenuOpen, setSurgeonMenuOpen, selectedDoctorId, selectDoctor, reducedMotion } = useHero();
  const { doctors, clinic } = data;
  const sections = useMemo(() => data.nav.filter((item) => item.id !== 'doctors'), [data.nav]);
  const counts = useMemo(() => new Map(doctors.map((d) => [d.id, caseCount(d.id)])), [doctors]);

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
  const initialIndex = () => Math.max(0, doctors.findIndex((d) => d.id === selectedDoctorId));
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

  const choose = (doctorId: string) => {
    selectDoctor(doctorId);
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
        choose(doctors[i].id);
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

  // The content fills the viewport, so "click outside" = a click that lands outside every surface.
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

  const onBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    if (!target.closest('[data-smenu-surface], .ant-modal-close')) close();
  };

  return (
    <AntdProvider>
      <Modal
        open={surgeonMenuOpen}
        onCancel={close}
        afterClose={restoreTriggerFocus}
        afterOpenChange={(opened) => opened && focusInitial()}
        title={
          <span className="flex items-center gap-5" data-smenu-surface="">
            <img src={asset('assets/icons/logo.svg')} width={35} height={32} alt="" className="h-8 w-[35px]" />
            Подбор хирурга
          </span>
        }
        footer={null}
        closable={{ 'aria-label': 'Закрыть меню' }}
        closeIcon={CloseIcon}
        width="100%"
        zIndex={60}
        destroyOnHidden
        keyboard
        mask={{ enabled: true, closable: true }}
        focusable={{ trap: true, focusTriggerAfterClose: false }}
        transitionName={reducedMotion ? '' : 'smenu-panel'}
        maskTransitionName={reducedMotion ? '' : 'smenu-fade'}
        wrapProps={{ id: SURGEON_MENU_ID }}
        rootClassName="smenu-root"
        className="top-0 m-0 max-w-none pb-0 font-text text-white"
        classNames={{
          mask: 'bg-[rgb(41_29_16/0.72)] backdrop-blur-[24px] backdrop-saturate-[1.2]',
          wrapper: 'overflow-y-auto overscroll-contain',
          container:
            'mx-auto flex min-h-dvh w-[min(1280px,calc(100%-80px))] flex-col gap-8 rounded-none bg-transparent px-0 pt-6 pb-7 shadow-none',
          header: 'm-0 flex h-[60px] items-center bg-transparent p-0',
          title:
            'font-display text-[14px] leading-5 font-medium tracking-[0.08em] text-neutral-200/70 uppercase',
          close:
            'smenu-close top-[30px] end-0 grid size-12 place-items-center rounded-full bg-glass-light text-white ' +
            'shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] hover:bg-white/30 hover:text-white',
          body: 'flex flex-1 flex-col gap-8 p-0',
        }}
        modalRender={(node) => (
          <div className="contents" onClick={onBackdropClick} onKeyDown={onTrapKeyDown}>
            {node}
          </div>
        )}
      >
        <div className="grid grid-cols-[340px_1fr] items-start gap-20">
          <nav aria-label="Разделы клиники" data-smenu-surface="">
            <div className="mb-4 flex min-h-9 items-center text-[13px] leading-4 tracking-[0.08em] text-neutral-200/60 uppercase">
              Клиника
            </div>
            <ul>
              {sections.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    onClick={close}
                    className="smenu-section-link block py-1 font-display text-2xl leading-8 text-white/70 hover:text-white focus-visible:text-white"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <section aria-labelledby={LABEL_ID} data-smenu-surface="">
            <div className="mb-4 flex min-h-9 items-center justify-between text-[13px] leading-4 tracking-[0.08em] text-neutral-200/60 uppercase">
              <span id={LABEL_ID}>Врачи · выберите специалиста</span>
              {selectedDoctorId && (
                <Button
                  shape="round"
                  onClick={onReset}
                  className="h-9 border-0 bg-white/10 px-3.5 text-[13px] tracking-[0.02em] text-white normal-case shadow-[inset_0_0_0_1px_rgb(215_165_97/0.6)] hover:bg-white/20!"
                >
                  Сбросить <span aria-hidden="true">×</span>
                </Button>
              )}
            </div>

            <ul
              role="listbox"
              aria-labelledby={LABEL_ID}
              aria-orientation="vertical"
              className="grid grid-cols-2 gap-3"
              onKeyDown={onListKeyDown}
            >
              {doctors.map((doctor, i) => {
                const name = doctorName(doctor);
                const count = counts.get(doctor.id) ?? 0;
                const countLabel = caseCountLabel(count);
                const selected = doctor.id === selectedDoctorId;
                const image = doctor.avatar ?? doctor.photo;
                return (
                  <li
                    key={doctor.id}
                    ref={(el) => {
                      optionRefs.current[i] = el;
                    }}
                    role="option"
                    tabIndex={i === active ? 0 : -1}
                    aria-selected={selected}
                    aria-label={`${name}. ${doctor.specialty || doctor.role}. ${countLabel}`}
                    onClick={() => {
                      setActive(i);
                      choose(doctor.id);
                    }}
                    onFocus={() => setActive(i)}
                    className={
                      'smenu-doc group relative grid min-h-[88px] cursor-pointer grid-cols-[64px_1fr_auto] items-center gap-4 rounded-md py-3 pr-3.5 pl-3 outline-none ' +
                      'transition-[background-color,box-shadow] duration-200 ' +
                      (selected
                        ? 'bg-gold-400/15 shadow-[inset_0_0_0_1px_var(--color-gold-400)] focus-visible:shadow-[inset_0_0_0_1px_var(--color-gold-400),0_0_0_2px_var(--color-white)]'
                        : 'bg-white/6 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] hover:bg-white/11 focus-visible:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.5),0_0_0_2px_var(--color-gold-400)]')
                    }
                    style={{ '--i': i } as CSSProperties}
                  >
                    <Avatar
                      size={64}
                      src={image ? asset(image.src) : undefined}
                      alt=""
                      aria-hidden="true"
                      className="smenu-doc__avatar overflow-hidden border-0 bg-[linear-gradient(145deg,#e9dccb_0%,#baab9b_55%,#8c7660_100%)] font-display text-[22px] font-medium text-gold-950 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)]"
                    >
                      {doctorInitials(doctor)}
                    </Avatar>

                    <span className="min-w-0">
                      <span className="block font-display text-lg leading-[22px] text-white">{name}</span>
                      <span className="mt-1 line-clamp-2 text-sm leading-[18px] text-neutral-200/70">
                        {doctor.specialty || doctor.role}
                      </span>
                    </span>

                    <span className="flex flex-col items-end justify-between gap-2 self-stretch" aria-hidden="true">
                      <Tag
                        variant="filled"
                        className={
                          'm-0 border-0 bg-transparent p-0 text-xs leading-[14px] whitespace-nowrap ' +
                          (count ? 'text-gold-400' : 'text-taupe-400')
                        }
                      >
                        {countLabel}
                      </Tag>
                      {selected ? (
                        <Tag
                          variant="solid"
                          className="m-0 inline-flex h-[22px] items-center rounded-pill border-0 bg-gold-400 px-2.5 text-xs text-gold-950"
                        >
                          Выбран
                        </Tag>
                      ) : (
                        <span className="smenu-doc__arrow grid size-8 place-items-center rounded-full bg-glass-light transition-[background-color,transform] duration-200">
                          <img src={asset('assets/icons/arrow-down-right.svg')} width={16} height={16} alt="" className="size-4" />
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div
          data-smenu-surface=""
          className="mt-auto flex min-h-[90px] items-center gap-4 rounded-md bg-glass-light py-0 pr-5 pl-8 backdrop-blur-[12px]"
        >
          <p className="flex-1 font-display text-xl leading-[26px]">
            Не знаете, к кому обратиться?
            <span className="block font-text text-sm leading-[18px] text-neutral-200/70">
              Поможем выбрать врача под вашу задачу — бесплатно и без обязательств.
            </span>
          </p>
          <CtaButton variant="primary" label="Помощь с выбором" href={clinic.phoneHref || '#contacts'} className="h-[52px] w-auto px-7" />
          <a
            href={clinic.whatsappHref || '#contacts'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-[50px] items-center gap-2.5 rounded-pill bg-neutral-100 pr-[22px] pl-2 text-base font-medium text-neutral-900 transition-colors duration-200 hover:bg-white"
          >
            <span className="grid size-9 place-items-center rounded-full bg-white">
              <img src={asset('assets/icons/whatsapp.svg')} width={16} height={16} alt="" className="size-4" />
            </span>
            Написать в WhatsApp
          </a>
        </div>
      </Modal>
    </AntdProvider>
  );
}
