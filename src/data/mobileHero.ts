// Copy that only the phone hero shows (design 2026-10-22, "01_Hero" mobile frame). The rest — subtitle, phone,
// rating, cases — comes from hero.json, shared with the desktop hero.

export const mobileHero = {
  /** Location chip: the city is gold. */
  address: { before: 'Офлайн в ', city: 'Астане', after: ' по адресу ул. Орынбор, 12' },
  /** hero.json title, broken into the design's three lines. */
  titleLines: ['Комплексные операции', 'тела, лица и груди', 'в премиальной клинике'],
  ctaLabel: 'Записаться на консультацию',
  /** "Смотреть" dark, "работы" muted. */
  worksTitle: ['Смотреть', 'работы'] as const,
};
