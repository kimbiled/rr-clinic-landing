type ContactMethod = 'whatsapp' | 'phone' | 'email';

export interface ContactClick {
  contact_method: ContactMethod;
  placement: string;
  button_id: string;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Send controlled identifiers only; never send the destination or prefilled chat message. */
export function contactClick(href: string, placement: string, buttonId: string, baseUrl: string): ContactClick | null {
  let url: URL;
  try {
    url = new URL(href, baseUrl);
  } catch {
    return null;
  }

  let method: ContactMethod;
  if (url.protocol === 'tel:') method = 'phone';
  else if (url.protocol === 'mailto:') method = 'email';
  else if (
    url.protocol === 'https:' &&
    (url.hostname === 'wa.me' || url.hostname === 'api.whatsapp.com' || url.hostname === 'web.whatsapp.com')
  ) method = 'whatsapp';
  else return null;

  return { contact_method: method, placement, button_id: buttonId };
}

let initialized = false;

/** Call once outside React so StrictMode and lazy sections cannot register duplicate listeners. */
export function initializeAnalytics({ measurementId, enabled = true, debug = false }: {
  measurementId?: string;
  enabled?: boolean;
  debug?: boolean;
}) {
  const id = measurementId?.trim();
  if (initialized || !enabled || !id || !/^G-[A-Z0-9]+$/.test(id)) return;
  initialized = true;

  window.dataLayer ??= [];
  window.gtag ??= function () { window.dataLayer!.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id, {
    ...(debug ? { debug_mode: true } : {}),
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);

  // Delegation also covers lazy doctor cards, mobile variants and Ant Design portals.
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || !(event.target instanceof Element)) return;
    const link = event.target.closest('a[href]');
    if (!(link instanceof HTMLAnchorElement)) return;
    const section = link.closest('section[id], header, footer');
    const placement = link.dataset.analyticsPlacement || section?.id || section?.tagName.toLowerCase() || 'page';
    const params = contactClick(link.href, placement, link.dataset.analyticsId || 'contact_link', location.origin);
    if (params) window.gtag?.('event', 'contact_click', params);
  });
}
