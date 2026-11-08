// Site analytics: Google Analytics 4 events and the Microsoft Clarity heatmap / session recordings.
//
// One source for every page. The React entries call initializeAnalytics() with their Vite env; the Framer doctor
// pages load public/assets/rr-analytics.js, which scripts/analytics-bundle.mjs builds from this file
// (tests/analytics.test.mjs checks the two stay in sync).
//
// Events (GA4, all event-scoped parameters):
//   ui_click       every click on a link, button or tab:
//                  button_id, button_text, placement, link_type, link_url (internal path, external host only)
//   contact_click  WhatsApp / phone / email links: contact_method, button_text («WhatsApp», «Позвонить», «Email»),
//                  placement, button_id
//   A control without visible text (an icon) is named after where it leads («WhatsApp», «Instagram», «2ГИС»…),
//   so button_text is never empty and GA never shows «(not set)» for it.
//   section_view   a block reached the screen, once per page view: section
// Never sent: a contact link's destination (the WhatsApp text can carry the visitor's message) or anything typed.

type ContactMethod = 'whatsapp' | 'phone' | 'email';
export type LinkType = ContactMethod | 'internal' | 'anchor' | 'external' | 'button';

export interface ContactClick {
  contact_method: ContactMethod;
  button_text: string;
  placement: string;
  button_id: string;
}

export interface UiClick {
  button_id: string;
  button_text: string;
  placement: string;
  link_type: LinkType;
  link_url?: string;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
    __rrAnalytics?: boolean;
    __rrTrackClick?: (event: MouseEvent) => void;
  }
}

/** What counts as a click target: links, buttons, tabs and their ARIA equivalents. */
const CLICKABLE =
  'a[href], button, summary, [role="button"], [role="tab"], [role="link"], [role="menuitem"], [role="option"], input[type="submit"], input[type="button"]';

/** Framer names its page blocks "01_Hero", "09_FAQ"…; other Framer layer names are noise. */
const FRAMER_BLOCK = /^\d{1,2}_\s*(.+)$/;

const TEXT_LIMIT = 100;

function contactMethodOf(url: URL): ContactMethod | null {
  if (url.protocol === 'tel:') return 'phone';
  if (url.protocol === 'mailto:') return 'email';
  if (
    url.protocol === 'https:' &&
    (url.hostname === 'wa.me' || url.hostname === 'api.whatsapp.com' || url.hostname === 'web.whatsapp.com')
  ) return 'whatsapp';
  return null;
}

const CONTACT_LABEL: Record<ContactMethod, string> = { whatsapp: 'WhatsApp', phone: 'Позвонить', email: 'Email' };

/** Well-known destinations, for naming icon-only links. */
const SITE_LABEL: [RegExp, string][] = [
  [/(^|\.)instagram\.com$/, 'Instagram'],
  [/(^|\.)2gis\.[a-z]+$/, '2ГИС'],
  [/^t\.me$|(^|\.)telegram\.(me|org)$/, 'Telegram'],
  [/(^|\.)youtube\.com$|^youtu\.be$/, 'YouTube'],
  [/(^|\.)tiktok\.com$/, 'TikTok'],
  [/(^|\.)facebook\.com$/, 'Facebook'],
];

/** Send controlled identifiers only; never send the destination or prefilled chat message. */
export function contactClick(href: string, placement: string, buttonId: string, baseUrl: string): ContactClick | null {
  let url: URL;
  try {
    url = new URL(href, baseUrl);
  } catch {
    return null;
  }
  const method = contactMethodOf(url);
  return method ? { contact_method: method, button_text: CONTACT_LABEL[method], placement, button_id: buttonId } : null;
}

/** A name for an icon-only link: the contact method, a known site, the host, or the path on this site. */
export function linkLabel(href: string, pageUrl: string): string {
  let url: URL;
  try {
    url = new URL(href, pageUrl);
  } catch {
    return '';
  }
  const method = contactMethodOf(url);
  if (method) return CONTACT_LABEL[method];
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
  const site = SITE_LABEL.find(([host]) => host.test(url.hostname));
  if (site) return site[1];
  const link = describeLink(href, pageUrl);
  return link.link_url ?? '';
}

/** A link's kind and a safe description of where it goes: a path on this site, only the host elsewhere. */
export function describeLink(href: string, pageUrl: string): { link_type: LinkType; link_url?: string } {
  let url: URL;
  let page: URL;
  try {
    page = new URL(pageUrl);
    url = new URL(href, page);
  } catch {
    return { link_type: 'button' };
  }
  const method = contactMethodOf(url);
  if (method) return { link_type: method };
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { link_type: 'button' };
  if (url.origin !== page.origin) return { link_type: 'external', link_url: url.hostname };
  if (url.pathname === page.pathname && url.hash) return { link_type: 'anchor', link_url: url.hash };
  return { link_type: 'internal', link_url: url.pathname + url.hash };
}

/** The words a visitor sees on the control (or its accessible name), trimmed for a GA parameter. */
export function labelOf(el: Element): string {
  const raw =
    el.getAttribute?.('aria-label') ||
    (el as HTMLElement).innerText ||
    el.textContent ||
    el.getAttribute?.('title') ||
    (el.tagName === 'INPUT' ? el.getAttribute?.('value') : '') ||
    el.querySelector?.('img[alt]')?.getAttribute('alt') ||
    el.querySelector?.('svg title')?.textContent ||
    '';
  return raw.replace(/\s+/g, ' ').trim().slice(0, TEXT_LIMIT);
}

/** The page block a click happened in: an explicit override, a section id, a dialog, a Framer block, or the landmark. */
export function placementOf(el: Element): string {
  const explicit = el.closest?.('[data-analytics-placement]') as HTMLElement | null;
  if (explicit?.dataset.analyticsPlacement) return explicit.dataset.analyticsPlacement;
  const section = el.closest?.('section[id], dialog[id], header, footer, nav');
  for (let node: Element | null = el; node; node = node.parentElement) {
    if (node === section) break;
    const name = node.getAttribute?.('data-framer-name');
    const block = name && FRAMER_BLOCK.exec(name);
    if (block) return block[1].trim();
  }
  if (section) return section.id || section.tagName.toLowerCase();
  return 'page';
}

/** GA parameters for a click on `el` (a link, button or tab). */
export function uiClick(el: Element, pageUrl: string): UiClick {
  const text = labelOf(el);
  const href = el.tagName === 'A' ? el.getAttribute('href') : null;
  const link = href !== null ? describeLink(href, pageUrl) : null;
  // An icon has no words: name it after its destination, else say so (GA would show «(not set)»).
  const shown = text || (href !== null ? linkLabel(href, pageUrl) : '') || 'Без подписи';
  return {
    button_id: (el as HTMLElement).dataset?.analyticsId || el.id || text.toLowerCase().slice(0, 40) || el.tagName.toLowerCase(),
    button_text: shown,
    placement: placementOf(el),
    ...(link ?? { link_type: 'button' as const }),
  };
}

function loadScript(src: string) {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

/** Reports each page block once when it fills half the screen (or half of itself is visible). */
function watchSections() {
  if (typeof IntersectionObserver === 'undefined' || typeof MutationObserver === 'undefined') return;
  const seen = new Set<string>();
  const watched = new WeakSet<Element>();
  const nameOf = (el: Element) => {
    if (el.tagName === 'SECTION') return el.id;
    const block = FRAMER_BLOCK.exec(el.getAttribute('data-framer-name') || '');
    return block ? block[1].trim() : '';
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const enough = entry.intersectionRatio >= 0.5 || entry.intersectionRect.height >= window.innerHeight * 0.5;
        const name = nameOf(entry.target);
        if (!enough || !name || seen.has(name)) continue;
        seen.add(name);
        io.unobserve(entry.target);
        window.gtag?.('event', 'section_view', { section: name });
      }
    },
    { threshold: [0, 0.25, 0.5, 0.75] },
  );
  const scan = () => {
    document.querySelectorAll('section[id], [data-framer-name]').forEach((el) => {
      if (watched.has(el) || !nameOf(el)) return;
      watched.add(el);
      io.observe(el);
    });
  };
  // Sections mount late (lazy team block, Framer hydration): rescan after DOM changes settle.
  let timer = 0;
  new MutationObserver(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(scan, 400);
  }).observe(document.body, { childList: true, subtree: true });
  scan();
}

let initialized = false;

/** Call once outside React so StrictMode and lazy sections cannot register duplicate listeners. */
export function initializeAnalytics({ measurementId, clarityId, enabled = true, debug = false }: {
  measurementId?: string;
  /** Microsoft Clarity project id (heatmaps, recordings); leave empty to skip. */
  clarityId?: string;
  enabled?: boolean;
  debug?: boolean;
}) {
  const id = measurementId?.trim();
  if (initialized || window.__rrAnalytics || !enabled || !id || !/^G-[A-Z0-9]+$/.test(id)) return;
  initialized = true;
  window.__rrAnalytics = true;

  window.dataLayer ??= [];
  window.gtag ??= function () { window.dataLayer!.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id, {
    ...(debug ? { debug_mode: true } : {}),
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);

  const clarity = clarityId?.trim();
  if (clarity && /^[a-z0-9]{6,16}$/.test(clarity)) {
    window.clarity ??= Object.assign(function (...args: unknown[]) { (window.clarity!.q ??= []).push(args); }, {});
    loadScript(`https://www.clarity.ms/tag/${encodeURIComponent(clarity)}`);
  }

  // Delegation also covers lazy doctor cards, mobile variants, Ant Design portals and Framer's hydrated markup.
  // Capture phase: Framer components may stop the click before it bubbles to the document.
  const tracked = new WeakSet<Event>();
  const trackClick = (event: MouseEvent) => {
    if (tracked.has(event) || event.defaultPrevented || event.button !== 0 || !(event.target instanceof Element)) return;
    const el = event.target.closest(CLICKABLE);
    if (!el) return;
    tracked.add(event);
    // A doctor's landing names its doctor on <html data-rr-doctor>, so reports can count clicks per doctor.
    const doctor = document.documentElement?.getAttribute?.('data-rr-doctor') || undefined;
    const withDoctor = <T extends object>(params: T) => (doctor ? { ...params, doctor } : params);
    const params = uiClick(el, location.href);
    window.gtag?.('event', 'ui_click', withDoctor(params));
    if (el instanceof HTMLAnchorElement) {
      const contact = contactClick(el.href, params.placement, (el as HTMLElement).dataset.analyticsId || 'contact_link', location.origin);
      if (contact) window.gtag?.('event', 'contact_click', withDoctor(contact));
    }
  };
  // surgeon-pages.js stops some clicks at the window (consultation links, page-to-page links) before they reach the
  // document, so it reports them through this hook first.
  window.__rrTrackClick = trackClick;
  document.addEventListener('click', trackClick, true);

  watchSections();
}
