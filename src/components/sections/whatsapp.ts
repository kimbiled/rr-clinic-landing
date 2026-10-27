import { heroData } from '../../data/hero';

/** WhatsApp chat with a prefilled message; falls back to the contacts anchor when the clinic has no WhatsApp. */
export function whatsappLink(message: string): { href: string; target?: '_blank'; rel?: string } {
  const base = heroData.clinic.whatsappHref;
  if (!base) return { href: '#contacts' };
  return { href: `${base}?text=${encodeURIComponent(message)}`, target: '_blank', rel: 'noopener noreferrer' };
}
