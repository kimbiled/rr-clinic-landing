// Copy + content for the sections below the hero (Trust, Programs, Journey, Operations, Works, Reviews).
// Edit texts here; components in src/components/sections/ only handle layout.
// Image paths are relative to /public (resolve with `asset()` from ./hero).

/**
 * Inline rich text: plain strings, or a highlighted fragment.
 * `accent` = gold text, `strong` = darker/medium text. A "\n" inside a string is a forced line break
 * (used where the design breaks a line on purpose, not because of the box width).
 */
export type RichText = ReadonlyArray<
  string | { text: string; tone: 'accent' | 'strong' }
>;

export interface SectionCta {
  label: string;
  /** Shorter label on phones. */
  mobileLabel?: string;
  href: string;
  variant: 'primary' | 'secondary';
}

export interface LandingImage {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface TrustStat {
  value: string;
  /** Smaller word after the figure ("12 месяцев"). */
  unit?: string;
  /** "\n" = forced line break. */
  label: string;
}

export interface TrustContent {
  id: string;
  /** Two lines: dark, then green. */
  title: [string, string];
  /** "\n" = forced line break. */
  text: string;
  stats: TrustStat[];
  /** Founders card under the figures. */
  card: {
    /** `accent` = muted brand name; "\n" = forced line break. */
    title: RichText;
    /** "\n" = forced line break. */
    text: string;
    ctas: SectionCta[];
    /** Full-card photo (founders in front of the columns, statue on the right). */
    photo: LandingImage;
    /** Phone photo: the founders cropped from `photo`, shown above the panel. */
    photoMobile: LandingImage;
    /** Name chips over the photo, positioned in % of the card (`mobile`: % of the phone photo). */
    people: { name: string; left: string; top: string; mobile: { left: string; top: string } }[];
  };
}

export interface Program {
  /** Small line above the title. */
  kicker: string;
  title: string;
  points: string[];
  /** Gold line icon before each point (same order as `points`). */
  icons: ProgramIcon[];
  /** Full-card photo (1240×460 card; the white panel covers its left side). */
  image: LandingImage;
  /** Portrait export when supplied for the phone card. */
  mobileImage?: LandingImage;
}

/** Designer exports in /public/assets/icons/program-<name>.svg. */
export type ProgramIcon =
  | 'abdomen' | 'breast' | 'waist' | 'clipboard' | 'drip'
  | 'eye' | 'intimate' | 'nose' | 'combo'
  | 'plane' | 'bed' | 'nurse' | 'headset' | 'video';

export interface ProgramsContent {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  /** "Есть другой запрос?" card at the right of the heading. */
  request: { title: string; link: { label: string; href: string }; text: string };
  /** Slide CTAs: WhatsApp consultation (href from the clinic data) + a link to the surgeons. */
  consultLabel: string;
  surgeon: { label: string; href: string };
  items: Program[];
}

export const trust: TrustContent = {
  id: 'trust',
  title: ['Нам доверяют пациенты', 'из 14 стран'],
  text: 'К нам летят из Германии, ОАЭ, США и Израиля — и возвращаются\nс результатом, который говорит сам за себя',
  stats: [
    { value: '10', label: 'узких специалистов\nпод одной крышей' },
    { value: '4', label: 'анестезиолога в\nштате' },
    { value: '12', unit: 'месяцев', label: 'Наблюдение после\nоперации' },
    { value: '1000+', label: 'довольных пациентов' },
  ],
  card: {
    title: [
      { text: 'RR Clinic', tone: 'accent' },
      ' — клиника\nпластической хирургии\nи эстетической медицины\nв Астане',
    ],
    text:
      'Рустам Курманбаев и Татьяна Романовская —\nоснователи RR Clinic. Команда профильных врачей\n' +
      'сопровождает пациента от первой консультации\nдо восстановления после операции.',
    ctas: [
      // TODO(content): confirm targets with the client — no "about" page / licences viewer exists yet.
      { label: 'Узнать больше о клинике', mobileLabel: 'О клинике', href: '#doctors', variant: 'primary' },
      { label: 'Лицензии', href: '#licenses', variant: 'secondary' },
    ],
    photo: {
      // Figma "Main content container" rendered at 2x (scripts/optimize-images.sh → trust-card).
      src: 'assets/img/web/trust-card.webp',
      width: 2480,
      height: 1120,
      alt: 'Основатели RR Clinic Рустам Курманбаев и Татьяна Романовская',
    },
    photoMobile: {
      // trust-card cropped to the founders (scripts/optimize-images.sh → trust-card-mobile)
      src: 'assets/img/web/trust-card-mobile.webp',
      width: 714,
      height: 576,
      alt: 'Основатели RR Clinic Рустам Курманбаев и Татьяна Романовская',
    },
    people: [
      { name: 'Курманбаев Рустам', left: '59.3%', top: '71.6%', mobile: { left: '30%', top: '50%' } },
      { name: 'Татьяна Романовская', left: '88.1%', top: '77.9%', mobile: { left: '70%', top: '66%' } },
    ],
  },
};

export const programs: ProgramsContent = {
  id: 'services',
  eyebrow: 'Авторские программы',
  title: 'Комплексные решения RR Clinic',
  text: 'Продуманные программы для тех, кто хочет максимальный результат с минимальным количеством восстановлений',
  request: {
    title: 'Есть другой запрос?',
    // Opens WhatsApp when the clinic has one (Programs.tsx); this anchor is only the fallback.
    link: { label: 'Расскажите, что хотите изменить.', href: '#doctors' },
    text: 'Мы оценим ваш случай и обсудим возможные варианты коррекции',
  },
  consultLabel: 'Получить консультацию',
  surgeon: { label: 'Выбрать хирурга', href: '#doctors' },
  items: [
    {
      kicker: 'Восстановление после родов',
      title: 'Mommy Makeover',
      points: [
        'Абдоминопластика — подтяжка живота',
        'Маммопластика — восстановление груди',
        'Липомоделирование талии',
        'Наблюдение команды в течение года',
        'Реабилитационные процедуры в клинике',
      ],
      icons: ['abdomen', 'breast', 'waist', 'clipboard', 'drip'],
      image: {
        src: 'assets/img/web/program-mommy-makeover.webp',
        width: 2349,
        height: 711,
        alt: 'Живот после беременности с растяжками, мама держит малыша',
      },
      mobileImage: {
        src: 'assets/img/web/program-mommy-makeover-mobile.webp',
        width: 740,
        height: 1190,
        alt: 'Мама держит ребёнка на руках',
      },
    },
    {
      kicker: 'Два результата одновременно',
      title: 'Симультанные операции',
      points: [
        'Блефаропластика + операция на теле или груди',
        'Интимная пластика + тело или грудь',
        'Ринопластика + маммопластика',
        'Комбинация под ваш индивидуальный запрос',
        'Наблюдение 1 год после операции',
      ],
      icons: ['eye', 'intimate', 'nose', 'combo', 'clipboard'],
      image: {
        src: 'assets/img/web/program-simultaneous.webp',
        width: 1710,
        height: 518,
        alt: 'Хирург во время операции',
      },
    },
    {
      kicker: 'Комплекс с сопровождением',
      title: 'Программа для иногородних',
      points: [
        'Трансфер аэропорт — клиника — отель',
        'Размещение в отеле рядом с клиникой',
        'Закреплённая медсестра на весь период',
        'Персональный менеджер 24/7',
        'Удалённые осмотры после возвращения домой',
      ],
      icons: ['plane', 'bed', 'nurse', 'headset', 'video'],
      image: {
        src: 'assets/img/web/program-nonresident.webp',
        width: 2134,
        height: 647,
        alt: 'Холл RR Clinic с логотипом на стене',
      },
    },
  ],
};

// ---- "Ваш путь", "Каталог операций", "Работы хирургов", "Отзывы" (design 2026-10-30) ----

export interface JourneyStep {
  title: string;
  text: string;
  image: LandingImage;
}

export interface JourneyContent {
  id: string;
  /** Dark, then green. */
  title: [string, string];
  text: string;
  /** Toggle under the heading; the first variant is shown by default. */
  variants: { id: string; label: string; steps: JourneyStep[] }[];
}

export type OperationIcon = 'face' | 'eye' | 'nose' | 'lips' | 'breast' | 'body' | 'intimate';

export interface Operation {
  name: string;
  description?: string;
  /** "от 10 500 000 ₸"; without it the card shows `OperationsContent.noPrice`. */
  price?: string;
  image?: LandingImage;
}

export interface OperationCategory {
  id: string;
  /** Short name on the tab. */
  label: string;
  /** Heading above the cards. */
  title: string;
  icon: OperationIcon;
  /** Extra words the search should match for every operation in the category. */
  keywords: string[];
  /** "Смотреть результаты …" link: the matching filter in the works section. */
  results?: { label: string; filter: WorkCategory };
  items: Operation[];
}

export interface OperationsContent {
  id: string;
  eyebrow: string;
  /** Dark, then green. */
  title: [string, string];
  /** "\n" = forced line break. */
  text: string;
  searchPlaceholder: string;
  /** After the operations count. */
  note: string;
  priceLabel: string;
  noPrice: string;
  moreLabel: string;
  /** Shown when the search finds nothing. */
  empty: string;
  /** WhatsApp message for an operation; `{name}` is replaced with the operation. */
  message: string;
  categories: OperationCategory[];
  cta: { title: string; text: string; label: string; message: string };
  disclaimer: string;
}

export type WorkCategory = 'face' | 'eyelids' | 'nose' | 'breast' | 'body' | 'intimate';

export interface WorksContent {
  id: string;
  eyebrow: string;
  /** Dark, then green. */
  title: [string, string];
  /** "\n" = forced line break. */
  text: string;
  consent: string;
  hint: string;
  operationFilters: { id: WorkCategory | 'all'; label: string }[];
  /** Order of the surgeon filter. */
  surgeons: string[];
  moreLabel: string;
  pageSize: number;
}

export interface Review {
  /** Above the operation. */
  title: string;
  operation: string;
  doctorId: string;
  poster: LandingImage;
  href: string;
}

export interface ReviewsContent {
  id: string;
  eyebrow: string;
  /** Dark, then green. */
  title: [string, string];
  /** "\n" = forced line break. */
  text: string;
  /** Hidden until the clinic gives the real number, date and scan. */
  license: { number: string; date: string; image: LandingImage } | null;
  videosTitle: string;
  videosHint: string;
  items: Review[];
  disclaimer: string;
}

const journeyPhoto = (name: string, alt: string): LandingImage => ({
  src: `assets/img/web/journey-${name}.webp`,
  width: 720,
  height: 788,
  alt,
});

const journeyPhotos = {
  consultation: journeyPhoto('consultation', 'Хирург беседует с пациенткой в кабинете'),
  tests: journeyPhoto('tests', 'Пробирка с анализом крови в руке врача'),
  arrival: journeyPhoto('arrival', 'Зона ожидания в холле клиники'),
  surgery: journeyPhoto('surgery', 'Хирург и ассистент во время операции'),
  ward: journeyPhoto('ward', 'Пациентка отдыхает в палате, рядом медсестра'),
  checkup: journeyPhoto('checkup', 'Врач осматривает лицо пациентки'),
};

export const journey: JourneyContent = {
  id: 'journey',
  title: ['Ваш путь к ', 'преображению'],
  text: 'От первой консультации до полного восстановления — 5 шагов с командой RR Clinic',
  variants: [
    {
      id: 'local',
      label: 'Для жителей Астаны',
      steps: [
        { title: 'Очная консультация', text: 'Встреча с хирургом, осмотр и обсуждение плана операции', image: journeyPhotos.consultation },
        { title: 'Подготовка', text: 'Сдача анализов, консультация анестезиолога, рекомендации', image: journeyPhotos.tests },
        { title: 'Операция', text: 'Безопасная процедура с опытной командой под контролем', image: journeyPhotos.surgery },
        { title: 'Палата', text: 'Стационарное пребывание с полным уходом и питанием', image: journeyPhotos.ward },
        { title: 'Осмотры', text: 'Контроль результата, перевязки и реабилитация в течение года', image: journeyPhotos.checkup },
      ],
    },
    {
      id: 'visitors',
      label: 'Для иногородних',
      steps: [
        { title: 'Онлайн-консультация', text: 'Хирург оценит запрос по видеосвязи или по фото и составит план до вашего приезда', image: journeyPhotos.consultation },
        { title: 'Приезд и размещение', text: 'Трансфер аэропорт — клиника — отель, проживание рядом с клиникой', image: journeyPhotos.arrival },
        { title: 'Подготовка и операция', text: 'Анализы, очная встреча с хирургом и операция с опытной командой', image: journeyPhotos.surgery },
        { title: 'Палата и сопровождение', text: 'Закреплённая медсестра и персональный менеджер 24/7', image: journeyPhotos.ward },
        { title: 'Удалённые осмотры', text: 'Контроль результата онлайн после возвращения домой', image: journeyPhotos.checkup },
      ],
    },
  ],
};

const operationPhoto = (name: string, width: number, height: number, alt: string): LandingImage => ({
  src: `assets/img/web/operation-${name}.webp`,
  width,
  height,
  alt,
});

/** Categories the design has no cards for yet: names only, no photo, description or price. */
const names = (...items: string[]): Operation[] => items.map((name) => ({ name }));

export const operations: OperationsContent = {
  id: 'operations',
  eyebrow: 'Услуги',
  title: ['Каталог ', 'операций'],
  text: 'Выберите направление — покажем операции, стоимость «от»\nи результаты наших хирургов.',
  searchPlaceholder: 'Найти операцию, например «пластика век»',
  note: 'точную стоимость хирург назовёт на консультации',
  priceLabel: 'Стоимость',
  noPrice: 'на консультации',
  moreLabel: 'Подробнее',
  empty: 'Такой операции нет в списке — напишите нам, хирург подскажет, что подойдёт.',
  message: 'Здравствуйте! Хочу записаться на консультацию: {name}',
  // TODO(content): only "Лицо" has photos, descriptions and prices in the design; the other lists follow the
  // counts in it and the operations on the doctors' pages — get their cards from the client.
  categories: [
    {
      id: 'face',
      label: 'Лицо',
      title: 'Подтяжка и пластика лица',
      icon: 'face',
      keywords: ['лифтинг', 'омоложение'],
      results: { label: 'Смотреть результаты по лицу', filter: 'face' },
      items: [
        {
          name: 'Голливудский фейслифтинг',
          description: 'Авторская подтяжка лица и шеи: чёткий овал и естественный результат без «натянутости».',
          price: 'от 10 500 000 ₸',
          image: operationPhoto('hollywood', 940, 650, 'Лицо женщины со стрелками направлений подтяжки'),
        },
        {
          name: 'Пластика лба',
          description: 'Разглаживает горизонтальные морщины и приподнимает брови — взгляд становится открытым.',
          price: 'от 1 000 000 ₸',
          image: operationPhoto('forehead', 847, 586, 'Женщина приподнимает кожу лба'),
        },
        {
          name: 'СМАС-подтяжка лица',
          description: 'Подтяжка глубокого мышечного слоя: возвращает контур скул, щёк и линии подбородка.',
          price: 'от 2 500 000 ₸',
          image: operationPhoto('smas', 940, 650, 'Врач проводит осмотр лица пациентки'),
        },
        {
          name: 'Эндоскопическая подтяжка',
          description: 'Подтяжка через небольшие проколы: минимум следов и короткое восстановление.',
          price: 'от 1 500 000 ₸',
          image: operationPhoto('endoscopic', 858, 593, 'Мужчина с отмеченными точками проколов на висках'),
        },
        {
          name: 'Круговая подтяжка лица',
          description: 'Комплексное омоложение лица и шеи за одну операцию.',
          price: 'от 5 500 000 ₸',
          image: operationPhoto('circular', 940, 650, 'Профиль женщины с линией разреза у уха'),
        },
      ],
    },
    {
      id: 'eyelids',
      label: 'Веки',
      title: 'Пластика век',
      icon: 'eye',
      keywords: ['блефаропластика', 'глаза'],
      results: { label: 'Смотреть результаты по векам', filter: 'eyelids' },
      items: names(
        'Верхняя блефаропластика',
        'Нижняя блефаропластика',
        'Круговая блефаропластика',
        'Трансконъюнктивальная блефаропластика',
        'Кантопексия',
      ),
    },
    {
      id: 'nose',
      label: 'Нос',
      title: 'Пластика носа',
      icon: 'nose',
      keywords: ['ринопластика'],
      results: { label: 'Смотреть результаты по носу', filter: 'nose' },
      items: names('Ринопластика', 'Септопластика'),
    },
    {
      id: 'ears-lips',
      label: 'Уши и губы',
      title: 'Пластика ушей и губ',
      icon: 'lips',
      keywords: ['отопластика', 'хейлопластика'],
      items: names('Отопластика', 'Хейлопластика', 'Липлифтинг'),
    },
    {
      id: 'breast',
      label: 'Грудь',
      title: 'Пластика груди',
      icon: 'breast',
      keywords: ['маммопластика', 'импланты'],
      results: { label: 'Смотреть результаты по груди', filter: 'breast' },
      items: names('Увеличение груди', 'Подтяжка груди', 'Уменьшение груди', 'Замена имплантов', 'Коррекция асимметрии груди'),
    },
    {
      id: 'body',
      label: 'Тело',
      title: 'Пластика тела',
      icon: 'body',
      keywords: ['фигура', 'живот', 'липосакция'],
      results: { label: 'Смотреть результаты по телу', filter: 'body' },
      items: names(
        'Абдоминопластика',
        'Липоабдоминопластика',
        'Абдоминопластика с ушиванием диастаза',
        'Липомоделирование',
        'Липофилинг',
        'Брахиопластика',
        'Подтяжка бёдер',
        'Mommy Makeover',
      ),
    },
    {
      id: 'intimate',
      label: 'Интимная пластика',
      title: 'Интимная пластика',
      icon: 'intimate',
      keywords: ['лабиопластика'],
      results: { label: 'Смотреть результаты по интимной пластике', filter: 'intimate' },
      items: names('Лабиопластика', 'Пластика больших половых губ', 'Вагинопластика', 'Перинеопластика', 'Липофилинг половых губ'),
    },
  ],
  cta: {
    title: 'Не знаете, какая операция вам нужна?',
    text: 'Опишите, что хочется изменить, — хирург на консультации предложит подходящий вариант и назовёт точную стоимость.',
    label: 'Записаться на консультацию',
    message: 'Здравствуйте! Хочу записаться на консультацию',
  },
  disclaimer: 'Имеются противопоказания. Необходима консультация специалиста.',
};

export const works: WorksContent = {
  id: 'works',
  eyebrow: 'Результаты',
  title: ['Работы наших ', 'хирургов'],
  text: 'Фотографии до и после реальных пациентов RR Clinic. Выберите операцию\nили хирурга — нажмите на работу, чтобы рассмотреть её крупно.',
  consent: 'Публикуем с согласия пациентов',
  hint: 'Перетащите ползунок, чтобы сравнить «до» и «после»',
  operationFilters: [
    { id: 'all', label: 'Все работы' },
    { id: 'face', label: 'Лицо' },
    { id: 'eyelids', label: 'Веки' },
    { id: 'nose', label: 'Нос' },
    { id: 'breast', label: 'Грудь' },
    { id: 'body', label: 'Тело' },
    { id: 'intimate', label: 'Интимная пластика' },
  ],
  surgeons: [
    'kurmanbaev-rustam',
    'musa-baurzhan',
    'temirkhanov-amir',
    'kodzoeva-leyla',
    'savelyev-evgeniy',
    'chatinyan-garik',
    'romanovskaya-tatyana',
    'tulepbergenova-tomiris',
    'ulagasheva-alina',
    'temirkhan-anar',
  ],
  moreLabel: 'Показать ещё работы',
  pageSize: 8,
};

const reviewPoster = (name: string, width: number, height: number, alt: string): LandingImage => ({
  src: `assets/img/web/reviews/${name}.webp`,
  width,
  height,
  alt,
});

export const reviews: ReviewsContent = {
  id: 'reviews',
  eyebrow: 'Отзывы',
  title: ['Пациенты о ', 'RR Clinic'],
  text: 'Настоящие истории пациентов — смотрите видео и проверяйте нас\nв независимых источниках.',
  // TODO(content): the design has "№ 00000000 от 00.00.0000" — the card appears once the clinic gives the real data.
  license: null,
  videosTitle: 'Видеоотзывы',
  videosHint: 'Ролики открываются в Instagram',
  // Links, titles and posters: the doctors' pages (public/<slug>/).
  items: [
    {
      title: 'Интервью с Ольгой',
      operation: 'Голливудский фейслифтинг',
      doctorId: 'romanovskaya-tatyana',
      poster: { src: 'assets/img/web/case8-interview.webp', width: 1024, height: 1024, alt: 'Пациентка Ольга' },
      // TODO(content): the interview's own link; for now the clinic's profile.
      href: 'https://www.instagram.com/rr.clinic.kz/',
    },
    {
      title: 'Анна: 5 лет после увеличения груди',
      operation: 'Увеличение груди',
      doctorId: 'kodzoeva-leyla',
      poster: reviewPoster('anna', 740, 740, 'Пациентка Анна'),
      href: 'https://www.instagram.com/reel/DbfjTBcIBTO/',
    },
    {
      title: 'Отзыв о ринопластике',
      operation: 'Ринопластика',
      doctorId: 'chatinyan-garik',
      poster: reviewPoster('rhinoplasty', 740, 840, 'Пациентка после ринопластики'),
      href: 'https://www.instagram.com/p/DV0l86hCGgI/',
    },
    {
      title: 'Впечатления после операции',
      operation: 'Верхняя блефаропластика',
      doctorId: 'tulepbergenova-tomiris',
      poster: reviewPoster('blepharoplasty', 585, 1000, 'Пациентка после блефаропластики'),
      href: 'https://www.instagram.com/p/Dc1j1zSMR_v/',
    },
    {
      title: 'Отзыв об увеличении груди',
      operation: 'Увеличение груди',
      doctorId: 'savelyev-evgeniy',
      poster: reviewPoster('breast', 585, 1000, 'Пациентка после увеличения груди'),
      href: 'https://www.instagram.com/reel/DcIYo_tML6K/',
    },
    {
      title: 'Интервью с Юлией',
      operation: 'Голливудский фейслифтинг',
      doctorId: 'romanovskaya-tatyana',
      poster: reviewPoster('yulia', 740, 740, 'Пациентка Юлия'),
      href: 'https://www.instagram.com/reel/DPd6MMRiia0/',
    },
    {
      title: 'Интервью с Аэлитой',
      operation: '1,5 месяца после операции',
      doctorId: 'temirkhanov-amir',
      poster: reviewPoster('aelita', 740, 840, 'Пациентка Аэлита'),
      href: 'https://www.instagram.com/reel/DXGwQ6xCKe3/',
    },
    {
      title: 'Интервью с Евгенией',
      operation: 'Операция на груди',
      doctorId: 'kurmanbaev-rustam',
      poster: reviewPoster('evgenia', 585, 1000, 'Пациентка Евгения'),
      href: 'https://www.instagram.com/p/Dd_LT1BCJkA/',
    },
  ],
  disclaimer: 'Ролики публикуются с согласия пациентов. Имеются противопоказания, необходима консультация специалиста.',
};

export type FaqTopic = 'safety' | 'prep' | 'prices' | 'after' | 'visitors';

export interface FaqContent {
  id: string;
  title: string;
  /** Phones (design 2026-10-29). */
  mobileTitle: string;
  /** "\n" = forced line break. */
  text: string;
  /** "Все вопросы" first, then one tab per topic. */
  tabs: { id: FaqTopic | 'all'; label: string }[];
  items: { topic: FaqTopic; question: string; answer: string }[];
  cta: { title: string; text: string; label: string; message: string };
}

export const faq: FaqContent = {
  id: 'faq',
  title: 'Ответы на вопросы, которые задают чаще всего',
  mobileTitle: 'Частые вопросы',
  text: 'Собрали самые популярные вопросы — если не нашли ответ,\nменеджер ответит за 15 минут',
  tabs: [
    { id: 'all', label: 'Все вопросы' },
    { id: 'safety', label: 'Безопасность' },
    { id: 'prep', label: 'Подготовка' },
    { id: 'prices', label: 'Цены' },
    { id: 'after', label: 'После операции' },
    { id: 'visitors', label: 'Иногородним' },
  ],
  // TODO(content): the design shows the questions only — the answers are drafted from the rest of the landing
  // (4 anaesthetists, 12 months of follow-up, the out-of-town journey); confirm them with the clinic.
  items: [
    {
      topic: 'safety',
      question: 'Насколько безопасна операция?',
      answer:
        'Перед операцией хирург и анестезиолог оценивают ваше здоровье по анализам и осмотру. Операции проходят ' +
        'в собственной операционной клиники под контролем анестезиолога — их у нас четверо в штате, — ' +
        'а после вы остаётесь в палате под наблюдением медицинской команды.',
    },
    {
      topic: 'safety',
      question: 'Что если будут осложнения?',
      answer:
        'Вас ведёт тот же хирург, который оперировал: осмотры и перевязки — в клинике, а 12 месяцев после ' +
        'операции команда остаётся на связи. Если что-то беспокоит, напишите нам в любой момент — врач ' +
        'посмотрит и скажет, что делать.',
    },
    {
      topic: 'prep',
      question: 'Как подготовиться к операции?',
      answer:
        'На консультации хирург составит план и даст список анализов. Анестезиолог проверит результаты и даст ' +
        'рекомендации: какие препараты отменить, когда перестать есть и пить, что взять с собой в клинику.',
    },
    {
      topic: 'prices',
      question: 'Есть ли рассрочка или кредит?',
      answer: 'Варианты оплаты зависят от операции — менеджер расскажет об условиях, напишите нам в WhatsApp.',
    },
    {
      topic: 'prices',
      question: 'Входят ли анализы в стоимость операции?',
      answer:
        'Анализы сдаются отдельно — в клинике или в любой лаборатории вашего города. Точный состав стоимости ' +
        'для вашей операции менеджер пришлёт после консультации.',
    },
    {
      topic: 'after',
      question: 'Когда будет виден окончательный результат?',
      answer:
        'Первые изменения видны сразу, но отёки уходят постепенно. Окончательный результат обычно оценивают ' +
        'через несколько месяцев — точные сроки зависят от операции, хирург расскажет о них на консультации.',
    },
    {
      topic: 'visitors',
      question: 'Я из другого города — сколько нужно быть в Астане?',
      answer:
        'Консультация проходит онлайн, анализы вы сдаёте у себя в городе. Прилететь нужно минимум за день до ' +
        'операции, а остаться — на перевязки и снятие швов; дальнейшие осмотры проходят онлайн. Точный срок ' +
        'хирург назовёт для вашей операции.',
    },
    {
      topic: 'safety',
      question: 'Какой наркоз используете?',
      answer:
        'Вид анестезии подбирает анестезиолог под операцию и ваше здоровье — от местной анестезии до общего ' +
        'наркоза. На консультации он объяснит, что подойдёт именно вам.',
    },
    {
      topic: 'prep',
      question: 'Какие анализы нужно сдать?',
      answer:
        'Список зависит от операции, возраста и здоровья — его даст хирург после консультации. Обычно это ' +
        'анализы крови, ЭКГ и заключение терапевта.',
    },
    {
      topic: 'prices',
      question: 'Что входит в стоимость операции?',
      answer:
        'Состав стоимости зависит от операции — менеджер пришлёт подробный расчёт после консультации с хирургом.',
    },
  ],
  cta: {
    title: 'Не нашли ответ на свой вопрос?',
    text: 'Менеджер ответит за 15 минут — консультация бесплатна',
    label: 'Задать свой вопрос',
    message: 'Здравствуйте! У меня вопрос:',
  },
};

export interface FooterContent {
  id: string;
  tagline: string;
  instagram: string;
  columns: { title: string; links: { label: string; href: string }[] }[];
  /** "Популярные услуги": each opens WhatsApp with operations.message. */
  services: { title: string; items: string[] };
  contacts: { title: string; address: string; email: string; map: LandingImage & { href: string } };
  copyright: string;
  legal: { label: string; href: string }[];
  wordmark: LandingImage;
}

export const footer: FooterContent = {
  id: 'contacts',
  tagline: 'Премиальная клиника пластической хирургии в Астане. Дорого. Эффективно. Надёжно',
  instagram: 'https://www.instagram.com/rr.clinic.kz/',
  columns: [
    {
      title: 'Клиника',
      links: [
        { label: 'О клинике', href: '#trust' },
        { label: 'Врачи', href: '#doctors' },
        { label: 'Услуги', href: '#services' },
        { label: 'До/после', href: '#works' },
        { label: 'Цены', href: '#operations' },
        { label: 'Контакты', href: '#contacts' },
      ],
    },
  ],
  services: {
    title: 'Популярные услуги',
    items: ['Маммопластика', 'Абдоминопластика', 'Липомоделирование', 'Голливудский фейслифтинг', 'Mommy Makeover', 'Блефаропластика'],
  },
  contacts: {
    title: 'Контакты',
    address: 'Астана, ул. Орынбор, 12, н.п. 68',
    email: 'info@rr-clinic.com',
    map: {
      // OpenStreetMap tiles around Орынбор 12, tinted (assets-src/img/footer-map.png); the card opens 2GIS.
      src: 'assets/img/web/footer-map.webp',
      width: 590,
      height: 304,
      alt: 'RR Clinic на карте: Астана, ул. Орынбор, 12',
      href: 'https://2gis.kz/astana/firm/70000001066801836',
    },
  },
  copyright: '© 2026 RR Clinic. Все права защищены.',
  legal: [
    // TODO(content): no licences page / data-processing consent yet — confirm targets with the client.
    { label: 'Лицензии клиники', href: '#licenses' },
    { label: 'Политика конфиденциальности', href: '/privacy-policy' },
    { label: 'Согласие на обработку данных', href: '/privacy-policy' },
  ],
  wordmark: {
    src: 'assets/icons/footer-wordmark.svg',
    width: 1241,
    height: 300,
    alt: 'RR Clinic',
  },
};
