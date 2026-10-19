// Shared plumbing between the surgeon-menu triggers (hero CTA, nav "Врачи") and <SurgeonMenu/>.
// HeroContext only owns the open flag, so the element to return focus to lives here.

import { useSyncExternalStore } from 'react';
import { getCasesByDoctor } from '../../data/hero';
import type { Doctor } from '../../data/types';

export const SURGEON_MENU_ID = 'surgeon-menu';

/** Which trigger opened the menu (N2-8: only that one reports aria-expanded) + lazy-chunk state (N2-3). */
export type MenuTriggerKey = 'cta' | 'nav';

interface TriggerState {
  opener: MenuTriggerKey | null;
  loaded: boolean;
}

let state: TriggerState = { opener: null, loaded: false };
let lastTrigger: HTMLElement | null = null;
const listeners = new Set<() => void>();

function setState(next: Partial<TriggerState>) {
  state = { ...state, ...next };
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let chunk: Promise<typeof import('./SurgeonMenu')> | null = null;

/** The lazy SurgeonMenu chunk (antd lives there). Called on idle, and on hover/focus of a trigger. */
export function loadSurgeonMenu() {
  chunk ??= import('./SurgeonMenu').then((m) => {
    setState({ loaded: true });
    return m;
  });
  return chunk;
}

/** Remember the trigger and open the menu. */
export function openSurgeonMenu(
  trigger: HTMLElement | null,
  setOpen: (open: boolean) => void,
  key: MenuTriggerKey,
): void {
  lastTrigger = trigger;
  setState({ opener: key });
  void loadSurgeonMenu();
  setOpen(true);
}

/** Return focus to the element that opened the menu (QA H-10: focus returns to the trigger). */
export function restoreTriggerFocus(): void {
  const target = lastTrigger?.isConnected ? lastTrigger : document.querySelector<HTMLElement>('[data-cta="pick-specialist"]');
  target?.focus({ preventScroll: true });
  lastTrigger = null;
}

/**
 * While the menu (or its loading fallback) is up, everything in #root is inert, so neither Tab nor a screen
 * reader can reach the page behind it (N2-1). The menu and the fallback portal to <body>, outside #root.
 */
export function setPageInert(inert: boolean): void {
  const root = document.getElementById('root');
  if (root) root.inert = inert;
}

/** ARIA + prefetch props for a menu trigger. */
export function useSurgeonMenuTrigger(key: MenuTriggerKey, open: boolean) {
  const { opener, loaded } = useSyncExternalStore(subscribe, () => state, () => state);
  const mine = open && opener === key;
  return {
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': mine,
    'aria-controls': mine ? SURGEON_MENU_ID : undefined,
    'aria-busy': mine && !loaded ? true : undefined,
    onPointerEnter: () => void loadSurgeonMenu(),
    onFocus: () => void loadSurgeonMenu(),
  };
}

export function doctorName(doctor: Doctor): string {
  return `${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim() || doctor.name;
}

export function doctorInitials(doctor: Doctor): string {
  const a = (doctor.firstName || doctor.name || '?').trim()[0] ?? '';
  const b = (doctor.lastName || '').trim()[0] ?? '';
  return (a + b).toUpperCase();
}

export function caseCount(doctorId: string): number {
  return getCasesByDoctor(doctorId).length;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/** "3 кейса" or, for a doctor without cases yet, "Кейсы скоро" (QA m-5). */
export function caseCountLabel(count: number): string {
  return count ? `${count} ${plural(count, 'кейс', 'кейса', 'кейсов')}` : 'Кейсы скоро';
}
