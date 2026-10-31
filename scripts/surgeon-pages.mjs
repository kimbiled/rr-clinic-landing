// The 24 surgeon/procedure URLs maintained in this checkout.
export const SURGEONS = {
  'kurmanbayev-rustam': { name: 'Рустам Курманбаев', recipient: 'Рустаму Курманбаеву', procedures: ['mammoplasty', 'abdominoplasty'] },
  'temirkhanov-amir': { name: 'Амир Темирханов', recipient: 'Амиру Темирханову', procedures: ['mammoplasty', 'abdominoplasty'] },
  'romanovskaya-tatyana': { name: 'Татьяна Романовская', recipient: 'Татьяне Романовской', procedures: [] },
  'kodzoeva-leila': { name: 'Лейла Кодзоева', recipient: 'Лейле Кодзоевой', procedures: ['mammoplasty', 'intimate-surgery'] },
  'mussa-baurzhan': { name: 'Бауржан Муса', recipient: 'Бауржан Муса', procedures: ['mammoplasty', 'blepharoplasty'] },
  'chatinyan-garik': { name: 'Гарик Чатинян', recipient: 'Гарику Чатиняну', procedures: ['rhinoplasty', 'facelift'] },
  'ulagasheva-alina': { name: 'Алина Улагашева', recipient: 'Алине Улагашевой', procedures: ['mammoplasty', 'otoplasty'] },
  'savelyev-evgeniy': { name: 'Евгений Савельев', recipient: 'Евгению Савельеву', procedures: ['mammoplasty', 'abdominoplasty'] },
  'tulepbergenova-tomiris': { name: 'Томирис Тулепбергенова', recipient: 'Томирис Тулепбергеновой', procedures: [] },
  'temirkhan-anar': { name: 'Анар Темирхан', recipient: 'Анар Темирхан', procedures: [] },
};

export const SURGEON_ROUTES = Object.entries(SURGEONS).flatMap(([slug, { procedures }]) => [
  slug, ...procedures.map((procedure) => `${slug}/${procedure}`),
]);

export function decodeAttribute(value) {
  return value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
}

// Copy the surgeon's existing consultation URL, including its exact message and phone.
// Refuse to silently substitute a generic link when Framer content changes.
export function consultationLink(html, route) {
  const surgeon = SURGEONS[route.split('/')[0]];
  if (!surgeon) throw new Error(`Unknown surgeon: ${route}`);
  const links = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((match) => decodeAttribute(match[1]));
  const counts = new Map();
  for (const href of links) counts.set(href, (counts.get(href) || 0) + 1);
  // Prefer the shared booking URL over isolated cloned blocks with older wording.
  const candidates = [...counts].sort((a, b) => b[1] - a[1]).map(([href]) => href);
  const link = candidates.find((href) => {
    try {
      const url = new URL(href);
      const message = url.searchParams.get('text') || '';
      return url.hostname === 'api.whatsapp.com' && message.includes('консультацию') && message.includes(surgeon.recipient);
    } catch { return false; }
  });
  if (!link) throw new Error(`${route}: the surgeon's consultation URL is missing`);
  return link;
}

export function isConsultationLink(href) {
  try {
    const url = new URL(decodeAttribute(href));
    return ['api.whatsapp.com', 'wa.me'].includes(url.hostname) && /консультац/i.test(url.searchParams.get('text') || '');
  } catch { return false; }
}

export function escapeAttribute(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}
