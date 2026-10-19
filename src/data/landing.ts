// Copy + content for the sections below the hero (Stats band, About, Trust).
// Edit texts here; components in src/components/sections/ only handle layout.
// Image paths are relative to /public (resolve with `asset()` from ./hero).

/**
 * Inline rich text: plain strings, or a highlighted fragment.
 * `accent` = gold text, `strong` = darker/medium text. A "\n" inside a string is a forced line break
 * (used where the design breaks a line on purpose, not because of the box width).
 */
export type RichText = ReadonlyArray<string | { text: string; tone: 'accent' | 'strong' }>;

export interface StatItem {
  /** Final value the counter lands on. */
  value: number;
  /** Digits after the decimal point (4.9 → 1). */
  decimals?: number;
  /** Rendered after the number, e.g. "+". */
  suffix?: string;
  label: string;
}

export interface Benefit {
  title: string;
  text: string;
}

export interface SectionCta {
  label: string;
  href: string;
  variant: 'primary' | 'secondary';
}

export interface LandingImage {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface AboutContent {
  id: string;
  eyebrow: string;
  title: RichText;
  benefits: Benefit[];
  ctas: SectionCta[];
  photo: LandingImage;
  caption: RichText;
}

export interface TrustContent {
  id: string;
  title: RichText;
  /** One reason per line. */
  points: string[];
}

export interface StatsContent {
  /** Visually hidden heading (the band has no visible title). */
  srTitle: string;
  items: StatItem[];
}

export const stats: StatsContent = {
  srTitle: 'Клиника в цифрах',
  items: [
    { value: 15, label: 'узких специалистов-хирургов, экспертов в своих областях' },
    { value: 1000, suffix: '+', label: 'довольных пациентов' },
    { value: 4.9, decimals: 1, label: 'средний рейтинг клиники' },
    { value: 50, suffix: '+', label: 'городов и 14 стран откуда приезжают пациенты' },
  ],
};

export const about: AboutContent = {
  id: 'about',
  eyebrow: 'О клинике',
  title: [
    { text: 'RR Clinic', tone: 'accent' },
    ' — клиника\nпластической хирургии\nи эстетической\nмедицины в Астане',
  ],
  benefits: [
    {
      title: 'Полный цикл ухода:',
      text: 'консультация, операция, реабилитация в течение года.',
    },
    {
      title: 'Собственный стационар и команда узких специалистов',
      text: 'обеспечивают безопасность и качество на\nкаждом этапе.',
    },
    {
      title: 'Наша философия',
      text: 'Все необходимые лицензии, инновационные методики и вечная поддержка — наша философия.',
    },
  ],
  ctas: [
    // TODO(content): confirm targets with the client — no "about" page / licences viewer exists yet.
    { label: 'Узнать больше', href: '#trust', variant: 'primary' },
    { label: 'Лицензии', href: '#licenses', variant: 'secondary' },
  ],
  photo: {
    // TEMPORARY low-res placeholder: a 610×494 crop cut from the design screenshot.
    // Replace with the client's original photo (export ≥1220×988 for retina) when it arrives.
    src: 'assets/img/web/about-founders.webp',
    width: 610,
    height: 494,
    alt: 'Основатели RR Clinic Рустам Курманбаев и Татьяна Романовская в холле клиники',
  },
  caption: [
    'Клиника основана одними из лучших хирургов — ',
    { text: 'Рустамом Курманбаевым и Татьяной Романовской', tone: 'strong' },
    '. Мы создали место, где каждый пациент получает результат мирового уровня, а хирурги имеют условия для идеальной работы.',
  ],
};

export const trust: TrustContent = {
  id: 'trust',
  title: ['Почему нам доверяют пациенты из ', { text: '14 стран', tone: 'accent' }],
  points: [
    'К нам летят из Германии, ОАЭ, США и Израиля — и возвращаются с результатом, который говорит сам за себя',
    '4 анестезиолога в штате, лицензия МЗ РК, собственный стационар — безопасность заложена в каждый протокол',
    '10 узких специалистов под одной крышей — ринопластика, фейслифтинг, тело, веки, интимная пластика без поездок по городу',
    'Год наблюдения включён в каждую операцию — менеджеры клиники на связи 365 дней',
  ],
};
