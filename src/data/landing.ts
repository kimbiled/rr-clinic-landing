// Copy + content for the sections below the hero (Trust, Programs, Journey, Surgery, Operations).
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
    /** Name chips over the photo, positioned in % of the card. */
    people: { name: string; left: string; top: string }[];
  };
}

export interface Program {
  /** Small line above the title. */
  kicker: string;
  title: string;
  points: string[];
  /** Full-card photo (1176×356 card; the plain left side carries the text). */
  image: LandingImage;
}

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
      { label: 'Узнать больше о клинике', href: '#doctors', variant: 'primary' },
      { label: 'Лицензии', href: '#licenses', variant: 'secondary' },
    ],
    photo: {
      // Figma "Main content container" rendered at 2x (scripts/optimize-images.sh → trust-card).
      src: 'assets/img/web/trust-card.webp',
      width: 2480,
      height: 1120,
      alt: 'Основатели RR Clinic Рустам Курманбаев и Татьяна Романовская',
    },
    people: [
      { name: 'Курманбаев Рустам', left: '59.3%', top: '71.6%' },
      { name: 'Татьяна Романовская', left: '88.1%', top: '77.9%' },
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
      image: {
        src: 'assets/img/web/program-mommy-makeover.webp',
        width: 2349,
        height: 711,
        alt: 'Живот после беременности с растяжками, мама держит малыша',
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
      image: {
        src: 'assets/img/web/program-nonresident.webp',
        width: 2134,
        height: 647,
        alt: 'Холл RR Clinic с логотипом на стене',
      },
    },
  ],
};

// ---- "Ваш путь к преображению", "Пластическая хирургия", "Все операции" (design 2026-10-27) ----

export interface JourneyStep {
  title: string;
  text: string;
}

export interface JourneyContent {
  id: string;
  title: string;
  text: string;
  /** Toggle at the right of the heading; the first variant is shown by default. */
  variants: { id: string; label: string; steps: JourneyStep[] }[];
}

export interface SurgeryCase {
  title: string;
  /** Category in `operations` the card's title opens. */
  categoryId: string;
  before: LandingImage;
  after: LandingImage;
}

export interface SurgeryContent {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  cases: SurgeryCase[];
}

export type OperationIcon = 'face' | 'eye' | 'nose' | 'lips' | 'breast' | 'body' | 'intimate';

export interface OperationCategory {
  id: string;
  /** Short name in the list on the left. */
  label: string;
  /** Heading of the list on the right. */
  title: string;
  icon: OperationIcon;
  /** Extra words the search should match for every operation in the category. */
  keywords: string[];
  items: string[];
}

export interface OperationsContent {
  id: string;
  title: string;
  searchPlaceholder: string;
  /** Shown when the search finds nothing. */
  empty: string;
  /** WhatsApp message for an operation row; `{name}` is replaced with the operation. */
  message: string;
  categories: OperationCategory[];
  cta: { title: string; text: string; label: string; message: string };
}

export const journey: JourneyContent = {
  id: 'journey',
  title: 'Ваш путь к преображению',
  text: 'От первой консультации до полного восстановления',
  variants: [
    {
      id: 'local',
      label: 'Для жителей Астаны',
      steps: [
        { title: 'Очная консультация', text: 'Встреча с хирургом, осмотр и\nобсуждение плана операции' },
        { title: 'Подготовка', text: 'Сдача анализов, консультация\nанестезиолога, рекомендации' },
        { title: 'Палата', text: 'Стационарное пребывание с полным\nуходом и питанием' },
        { title: 'Операция', text: 'Безопасная процедура с опытной\nкомандой под контролем' },
        { title: 'Осмотры', text: 'Контроль результата, перевязки и\nреабилитация в течение года' },
      ],
    },
    {
      id: 'visitors',
      label: 'Для иногородних',
      steps: [
        { title: 'Онлайн консультация', text: 'Фото и видео по инструкции,\nконсультация хирурга в WhatsApp' },
        { title: 'Анализы', text: 'Сдача в своём городе, результаты\nотправляют онлайн' },
        { title: 'Прилет', text: 'Минимум за день до операции, по\nпрограмме «Забота под ключ»' },
        { title: 'Операция', text: 'Безопасная процедура с полным\nнаблюдением операционной бригады' },
        { title: 'Пребывание', text: 'В Астане, перевязки и снятие швов,\nдальнейшие осмотры онлайн' },
      ],
    },
  ],
};

export const surgery: SurgeryContent = {
  id: 'surgery',
  eyebrow: 'Услуги',
  title: 'Пластическая хирургия',
  text: 'Операции для лица и тела — выберите интересующее направление.',
  cases: [
    {
      title: 'Увеличение груди',
      categoryId: 'breast',
      before: { src: 'assets/img/web/surgery-breast-before.webp', width: 800, height: 1410, alt: 'Грудь до увеличения' },
      after: { src: 'assets/img/web/surgery-breast-after.webp', width: 800, height: 1410, alt: 'Грудь после увеличения' },
    },
    {
      title: 'Голливудский фейслифтинг',
      categoryId: 'face',
      before: { src: 'assets/img/web/surgery-facelift-before.webp', width: 765, height: 1024, alt: 'Лицо до фейслифтинга' },
      after: { src: 'assets/img/web/surgery-facelift-after.webp', width: 765, height: 1024, alt: 'Лицо после фейслифтинга' },
    },
    {
      title: 'Абдоминопластика',
      categoryId: 'body',
      before: { src: 'assets/img/web/surgery-abdominoplasty-before.webp', width: 800, height: 1600, alt: 'Живот до абдоминопластики' },
      after: { src: 'assets/img/web/surgery-abdominoplasty-after.webp', width: 800, height: 1600, alt: 'Живот после абдоминопластики' },
    },
  ],
};

export const operations: OperationsContent = {
  id: 'operations',
  title: 'Все операции',
  searchPlaceholder: 'Найти операцию, например «пластика век»',
  empty: 'Такой операции нет в списке — напишите нам, хирург подскажет, что подойдёт.',
  message: 'Здравствуйте! Хочу записаться на консультацию: {name}',
  // TODO(content): only "Лицо" is spelled out in the design; the other lists follow the counts in it and the
  // operations on the doctors' pages — confirm with the client.
  categories: [
    {
      id: 'face',
      label: 'Лицо',
      title: 'Подтяжка и пластика лица',
      icon: 'face',
      keywords: ['лифтинг', 'омоложение'],
      items: ['Голливудский фейслифтинг', 'Пластика лба', 'СМАС-подтяжка лица', 'Эндоскопическая подтяжка', 'Круговая подтяжка лица'],
    },
    {
      id: 'eyelids',
      label: 'Веки',
      title: 'Пластика век',
      icon: 'eye',
      keywords: ['блефаропластика', 'глаза'],
      items: [
        'Верхняя блефаропластика',
        'Нижняя блефаропластика',
        'Круговая блефаропластика',
        'Трансконъюнктивальная блефаропластика',
        'Кантопексия',
      ],
    },
    {
      id: 'nose',
      label: 'Нос',
      title: 'Пластика носа',
      icon: 'nose',
      keywords: ['ринопластика'],
      items: ['Ринопластика', 'Септопластика'],
    },
    {
      id: 'ears-lips',
      label: 'Уши и губы',
      title: 'Пластика ушей и губ',
      icon: 'lips',
      keywords: ['отопластика', 'хейлопластика'],
      items: ['Отопластика', 'Хейлопластика', 'Липлифтинг'],
    },
    {
      id: 'breast',
      label: 'Грудь',
      title: 'Пластика груди',
      icon: 'breast',
      keywords: ['маммопластика', 'импланты'],
      items: ['Увеличение груди', 'Подтяжка груди', 'Уменьшение груди', 'Замена имплантов', 'Коррекция асимметрии груди'],
    },
    {
      id: 'body',
      label: 'Тело',
      title: 'Пластика тела',
      icon: 'body',
      keywords: ['фигура', 'живот', 'липосакция'],
      items: [
        'Абдоминопластика',
        'Липоабдоминопластика',
        'Абдоминопластика с ушиванием диастаза',
        'Липомоделирование',
        'Липофилинг',
        'Брахиопластика',
        'Подтяжка бёдер',
        'Mommy Makeover',
      ],
    },
    {
      id: 'intimate',
      label: 'Интимная пластика',
      title: 'Интимная пластика',
      icon: 'intimate',
      keywords: ['лабиопластика'],
      items: ['Лабиопластика', 'Пластика больших половых губ', 'Вагинопластика', 'Перинеопластика', 'Липофилинг половых губ'],
    },
  ],
  cta: {
    title: 'Не знаете, с чего начать?',
    text: 'Обсудите свой запрос с хирургом.',
    label: 'Записаться на очную консультацию',
    message: 'Здравствуйте! Хочу записаться на очную консультацию',
  },
};

export type FaqTopic = 'safety' | 'prep' | 'prices' | 'after' | 'visitors';

export interface FaqContent {
  id: string;
  title: string;
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
  wordmark: string;
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
        { label: 'До/после', href: '#surgery' },
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
  wordmark: 'RR Clinic',
};
