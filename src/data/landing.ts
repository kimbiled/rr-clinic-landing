// Copy + content for the sections below the hero (About, Trust, Programs).
// Edit texts here; components in src/components/sections/ only handle layout.
// Image paths are relative to /public (resolve with `asset()` from ./hero).

/**
 * Inline rich text: plain strings, or a highlighted fragment.
 * `accent` = gold text, `strong` = darker/medium text. A "\n" inside a string is a forced line break
 * (used where the design breaks a line on purpose, not because of the box width).
 */
export type RichText = ReadonlyArray<string | { text: string; tone: 'accent' | 'strong' }>;

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
  /** Two lines: dark, then muted. */
  title: [string, string];
  /** Numbered slides (01, 02, …): the active one sits in the centre, the next peeks in at the right. */
  slides: RichText[];
  ctas: SectionCta[];
}

export interface TrustStat {
  value: string;
  label: string;
}

export interface TrustContent {
  id: string;
  title: [string, string];
  text: string;
  stats: TrustStat[];
  /** Full-card photo (founders in front of the columns, statue on the right). */
  photo: LandingImage;
  /** Name chips over the photo, positioned in % of the card. */
  people: { name: string; left: string; top: string }[];
}

export interface Program {
  title: string;
  text: string;
  /** null until the client supplies the photo: the card shows its tone only. */
  image: LandingImage | null;
}

export interface ProgramsContent {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  items: Program[];
}

export const about: AboutContent = {
  id: 'about',
  eyebrow: 'О клинике',
  title: ['Клиника пластической хирургии', 'и эстетической медицины в Астане'],
  slides: [
    [
      'Клиника основана одними из лучших хирургов — ',
      { text: 'Рустамом Курманбаевым и Татьяной Романовской', tone: 'strong' },
      '. Мы создали место, где каждый пациент получает результат мирового уровня, а хирурги имеют условия для идеальной работы.',
    ],
    [
      'Полный цикл ухода: консультация, операция, реабилитация в течение года. ',
      'Собственный стационар и команда узких специалистов обеспечивают безопасность и качество на каждом этапе.',
    ],
    [
      'RR Clinic — место, где безопасность и комфорт пациента — приоритет. Все необходимые лицензии, инновационные методики и вечная поддержка — наша философия.',
    ],
  ],
  ctas: [
    // TODO(content): confirm targets with the client — no "about" page / licences viewer exists yet.
    { label: 'Узнать больше о клинике', href: '#trust', variant: 'primary' },
    { label: 'Лицензии', href: '#licenses', variant: 'secondary' },
  ],
};

export const trust: TrustContent = {
  id: 'trust',
  title: ['Почему нам доверяют', 'пациенты из 14 стран'],
  text:
    'К нам летят из Германии, ОАЭ, США и Израиля — и возвращаются с результатом, который говорит сам за себя. ' +
    'Лицензия МЗ РК, собственный стационар — безопасность заложена в каждый протокол',
  stats: [
    { value: '10', label: 'узких специалистов под одной крышей' },
    { value: '4', label: 'анестезиолога в штате' },
    { value: '1 год', label: 'наблюдения включён после операции' },
    { value: '1000+', label: 'довольных пациентов' },
  ],
  photo: {
    // Figma "Main content container" rendered at 2x (scripts/optimize-images.sh → trust-card).
    src: 'assets/img/web/trust-card.webp',
    width: 2480,
    height: 1120,
    alt: 'Основатели RR Clinic Рустам Курманбаев и Татьяна Романовская',
  },
  people: [
    { name: 'Курманбаев Рустам', left: '56%', top: '63%' },
    { name: 'Татьяна Романовская', left: '82%', top: '77%' },
  ],
};

export const programs: ProgramsContent = {
  id: 'services',
  eyebrow: 'Авторские программы',
  title: 'Комплексные решения RR Clinic',
  text: 'Продуманные программы для тех, кто хочет максимальный результат с минимальным количеством восстановлений',
  items: [
    { title: 'Mommy Makeover', text: 'Восстановление после родов', image: null },
    { title: 'Симультанные операции', text: 'Два результата одновременно', image: null },
    { title: 'Голливудский\nфейслифтинг', text: 'Подтяжка лица без рубцов', image: null },
  ],
};
