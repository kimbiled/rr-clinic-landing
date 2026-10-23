// Soft in-page scrolling for the navbar / menu anchors. The native `behavior: 'smooth'` is short and differs
// per browser; this one eases in and out (easeInOutCubic) over a duration that grows with the distance,
// re-reads the target every frame (a lazy section mounting mid-way can't make it miss), and stops as soon as
// the visitor scrolls themselves.
import type { MouseEvent } from 'react';

const MIN_MS = 900;
const MAX_MS = 1700;
const MS_PER_SQRT_PX = 22; // 1000 px → ≈ 900 ms, 2500 px → ≈ 1100 ms, 5000 px → ≈ 1560 ms

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const INTERRUPT = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;

let cancelCurrent: (() => void) | null = null;

/** html { scroll-padding-top } keeps anchored sections clear of the fixed navbar island. */
function scrollPaddingTop(): number {
  return parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
}

function targetY(target: HTMLElement | number): number {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY - scrollPaddingTop();
  return Math.max(0, Math.min(max, y));
}

/** Scrolls the window to an element (its top, minus scroll-padding) or to a y offset. */
export function smoothScrollTo(target: HTMLElement | number, { reducedMotion = false } = {}) {
  cancelCurrent?.();
  if (reducedMotion) {
    window.scrollTo({ top: targetY(target), behavior: 'auto' });
    return;
  }

  const startY = window.scrollY;
  const distance = Math.abs(targetY(target) - startY);
  if (distance < 1) return;
  const duration = Math.min(MAX_MS, Math.max(MIN_MS, Math.sqrt(distance) * MS_PER_SQRT_PX));

  let raf = 0;
  let start = 0;
  const stop = () => {
    cancelAnimationFrame(raf);
    INTERRUPT.forEach((type) => window.removeEventListener(type, stop));
    if (cancelCurrent === stop) cancelCurrent = null;
  };
  const tick = (now: number) => {
    if (!start) start = now;
    const t = Math.min(1, (now - start) / duration);
    window.scrollTo(0, startY + (targetY(target) - startY) * easeInOutCubic(t));
    if (t < 1) raf = requestAnimationFrame(tick);
    else stop();
  };

  INTERRUPT.forEach((type) => window.addEventListener(type, stop, { passive: true }));
  cancelCurrent = stop;
  raf = requestAnimationFrame(tick);
}

/**
 * Click handler for "#section" links: smooth-scrolls instead of jumping and keeps the hash in the URL.
 * Modified clicks (new tab…) and links whose target is missing are left to the browser.
 */
export function onAnchorClick(event: MouseEvent<HTMLAnchorElement>, reducedMotion: boolean) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const href = event.currentTarget.getAttribute('href') ?? '';
  const target = href.startsWith('#') && href.length > 1 ? document.getElementById(href.slice(1)) : null;
  if (!target) return;
  event.preventDefault();
  if (window.location.hash !== href) history.pushState(null, '', href);
  smoothScrollTo(target, { reducedMotion });
}
