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
  /** Shorter wording that keeps to two lines on phones. */
  textMobile: string;
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
  textMobile: 'К нам летят из Германии, ОАЭ, США и Израиля —\nи возвращаются с результатом, говорящим сам за себя',
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
      // TODO(content): confirm the target with the client — no "about" page exists yet.
      { label: 'Узнать больше о клинике', mobileLabel: 'О клинике', href: '#doctors', variant: 'primary' },
      { label: 'Лицензии', href: 'https://drive.google.com/file/d/1fixGxJX3GIo-xLjsyjLxcy3mydZ11tiD/view', variant: 'secondary' },
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
      width: 1072,
      height: 864,
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
  /** Dark, then green; the middle part is dark on desktop and starts the green line on phones. */
  title: [string, string, string];
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

/** A sub-direction inside a direction ("Лицо и шея" → "Подтяжка"). */
export interface OperationGroup {
  id: string;
  /** Name in the side menu and the breadcrumb. */
  label: string;
  /** Heading above the cards. */
  title: string;
  items: Operation[];
}

export interface OperationCategory {
  id: string;
  /** Name in the side menu and the breadcrumb. */
  label: string;
  /** Heading above the cards when the direction has no sub-directions. */
  title: string;
  icon: OperationIcon;
  /** Extra words the search should match for every operation in the category. */
  keywords: string[];
  /** Either the operations themselves or sub-directions with them. */
  items?: Operation[];
  groups?: OperationGroup[];
}

export interface OperationsContent {
  id: string;
  eyebrow: string;
  /** Dark, then green. */
  title: [string, string];
  text: string;
  searchPlaceholder: string;
  /** Breadcrumb root for directions without sub-directions. */
  rootLabel: string;
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
  title: ['Ваш путь ', 'к ', 'преображению'],
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

/** The five facelift photos from the 2026-10-30 design (940 × 650 and close). */
const operationPhoto = (name: string, width: number, height: number, alt: string): LandingImage => ({
  src: `assets/img/web/operation-${name}.webp`,
  width,
  height,
  alt,
});

/** Catalog card photos (design 2026-11-08), cropped to the card's 5:4. */
const catalogPhoto = (name: string, alt: string, width = 680, height = 544): LandingImage => ({
  src: `assets/img/web/catalog/${name}.webp`,
  width,
  height,
  alt,
});

const op = (name: string, price: string, description: string, image: LandingImage): Operation => ({
  name,
  description,
  price: `от ${price} ₸`,
  image,
});

export const operations: OperationsContent = {
  id: 'operations',
  eyebrow: 'Услуги',
  title: ['Каталог ', 'операций'],
  text: 'Выберите направление — покажем операции, стоимость «от» и результаты наших хирургов.',
  searchPlaceholder: 'Найти операцию',
  rootLabel: 'Каталог операций',
  noPrice: 'Стоимость — на консультации',
  moreLabel: 'Подробнее',
  empty: 'Такой операции нет в списке — напишите нам, хирург подскажет, что подойдёт.',
  message: 'Здравствуйте! Хочу записаться на консультацию: {name}',
  categories: [
    {
      id: 'face',
      label: 'Лицо и шея',
      title: 'Пластика лица и шеи',
      icon: 'face',
      keywords: ['лицо', 'шея', 'лифтинг', 'омоложение', 'фейслифтинг'],
      groups: [
        {
          id: 'face-lift',
          label: 'Подтяжка',
          title: 'Подтяжка лица и шеи',
          items: [
            op('Пластика лба', '1 000 000', 'Разглаживает горизонтальные морщины и приподнимает брови — взгляд становится открытым.', operationPhoto('forehead', 847, 586, 'Женщина приподнимает кожу лба')),
            op('Эндоскопическая подтяжка', '1 500 000', 'Подтяжка через небольшие проколы: минимум следов и короткое восстановление.', operationPhoto('endoscopic', 858, 593, 'Мужчина с отмеченными точками проколов на висках')),
            op('СМАС-подтяжка лица', '2 500 000', 'Подтяжка глубокого мышечного слоя: возвращает контур скул, щёк и линии подбородка.', operationPhoto('smas', 940, 650, 'Врач проводит осмотр лица пациентки')),
            op('Подтяжка шеи (платизмопластика)', '1 800 000', 'Подтягивает шею и нижнюю треть лица, убирает дряблость и «брыли».', catalogPhoto('neck-lift', 'Шея женщины со стрелками направлений подтяжки', 680, 543)),
            op('Круговая подтяжка лица', '5 500 000', 'Комплексное омоложение лица и шеи за одну операцию.', operationPhoto('circular', 940, 650, 'Профиль женщины с линией разреза у уха')),
          ],
        },
        {
          id: 'face-contour',
          label: 'Контур лица',
          title: 'Контур лица',
          items: [
            op('Удаление комков Биша', '500 000', 'Подчёркивает скулы и делает контур щёк тоньше.', catalogPhoto('bichat', 'Лицо женщины с отмеченной зоной на щеке')),
            op('Липофилинг лица', '300 000', 'Восполняет объём скул и щёк собственным жиром.', catalogPhoto('face-lipofilling', 'Лицо женщины: половина до и после липофилинга')),
            op('Липосакция подбородка', '300 000', 'Убирает второй подбородок и делает чёткой линию шеи.', catalogPhoto('chin-liposuction', 'Профиль мужчины с линией подбородка')),
          ],
        },
        {
          id: 'face-lips-ears',
          label: 'Губы и уши',
          title: 'Губы и уши',
          items: [
            op('Пластика губ (VY, булхорн)', '300 000', 'Увеличивает объём губ или укорачивает расстояние от носа до губы.', catalogPhoto('lip-lift', 'Губы со стрелками подтяжки к носу')),
            op('Удаление геля из губ', '600 000', 'Убирает биополимерный гель — последствие неудачного филлера.', catalogPhoto('lip-gel-removal', 'Врач осматривает губы пациентки')),
            op('Отопластика', '600 000', 'Корректирует форму и положение ушей.', catalogPhoto('otoplasty', 'Врач размечает ухо пациента')),
          ],
        },
      ],
    },
    {
      id: 'eyelids',
      label: 'Веки',
      title: 'Пластика век',
      icon: 'eye',
      keywords: ['блефаропластика', 'глаза'],
      items: [
        op('Верхняя блефаропластика', '250 000', 'Убирает нависание кожи верхнего века. Европеизация — дополнительно.', catalogPhoto('upper-blepharoplasty', 'Лицо пациентки: половина до и после верхней блефаропластики', 680, 543)),
        op('Нижняя блефаропластика', '220 000', 'Убирает мешки под глазами — с наружным швом или без него.', catalogPhoto('lower-blepharoplasty', 'Глаза мужчины до и после нижней блефаропластики')),
        op('Круговая блефаропластика', '700 000', 'Верхние и нижние веки за одну операцию.', catalogPhoto('circular-blepharoplasty', 'Глаза пациентки до и после круговой блефаропластики', 375, 300)),
        op('Эпикантопластика', '250 000', 'Открывает внутренний угол глаза.', catalogPhoto('epicanthoplasty', 'Глаза пациентки до и после эпикантопластики')),
        op('Липофилинг век', '300 000', 'Восполняет запавшие зоны вокруг глаз.', catalogPhoto('eyelid-lipofilling', 'Лицо женщины с отмеченными зонами вокруг глаз')),
      ],
    },
    {
      id: 'nose',
      label: 'Нос',
      title: 'Пластика носа',
      icon: 'nose',
      keywords: ['ринопластика'],
      items: [
        op('Ринопластика', '800 000', 'Коррекция формы носа — от кончика до полной.', catalogPhoto('rhinoplasty', 'Профиль пациентки до и после ринопластики')),
        op('Вторичная ринопластика', '3 200 000', 'Исправление результата предыдущей операции.', catalogPhoto('secondary-rhinoplasty', 'Профиль женщины с линией спинки носа')),
        op('Септопластика', '500 000', 'Выравнивает перегородку и облегчает дыхание.', catalogPhoto('septoplasty', 'Нос мужчины снизу с линией перегородки')),
      ],
    },
    {
      id: 'breast',
      label: 'Грудь',
      title: 'Пластика груди',
      icon: 'breast',
      keywords: ['маммопластика', 'импланты'],
      items: [
        op('Увеличение груди', '1 200 000', 'Импланты для желаемого объёма и формы.', catalogPhoto('breast-augmentation', 'Пациентка держит имплант у груди')),
        op('Подтяжка груди', '1 600 000', 'Возвращает форму — с имплантами или собственными тканями.', catalogPhoto('breast-lift', 'Врач размечает грудь пациентки')),
        op('Уменьшение груди', '2 500 000', 'Уменьшает объём и снимает нагрузку со спины.', catalogPhoto('breast-reduction', 'Пациентка в топе со стрелками уменьшения груди')),
        op('Повторные операции', '2 200 000', 'Замена или удаление имплантов с коррекцией формы.', catalogPhoto('breast-revision', 'Врач показывает пациентке импланты')),
        op('Липофилинг груди', '900 000', 'Мягкий объём собственным жиром.', catalogPhoto('breast-lipofilling', 'Врач размечает зоны липофилинга на теле пациентки')),
        op('Коррекция гинекомастии', '1 000 000', 'Плоский рельеф мужской груди.', catalogPhoto('gynecomastia', 'Врач размечает грудь пациента')),
      ],
    },
    {
      id: 'body',
      label: 'Тело',
      title: 'Пластика тела',
      icon: 'body',
      keywords: ['фигура', 'живот', 'липосакция'],
      items: [
        op('Абдоминопластика', '900 000', 'Плоский живот и ушивание диастаза — мини или полная.', catalogPhoto('abdominoplasty', 'Живот пациентки до и после абдоминопластики', 525, 420)),
        op('Липосакция и липомоделирование', '250 000', 'Убирает локальные отложения и формирует силуэт.', catalogPhoto('liposuction', 'Торс пациента до и после липосакции', 525, 420)),
        op('Липомоделирование + абдоминопластика', '3 000 000', 'Живот и талия за одну операцию.', catalogPhoto('lipo-abdominoplasty', 'Живот пациентки до и после операции', 525, 420)),
        op('Пластика ягодиц', '600 000', 'Объём и форма — липофилингом или имплантами.', catalogPhoto('buttocks', 'Ягодицы пациентки до и после пластики', 525, 420)),
        op('Подтяжка рук и бёдер', '1 500 000', 'Убирает дряблую кожу плеч и бёдер.', catalogPhoto('arm-thigh-lift', 'Рука с разметкой подтяжки плеча')),
        op('Боди-лифт', '2 000 000', 'Комплексная подтяжка тела после похудения.', catalogPhoto('body-lift', 'Женщина собирает лишнюю кожу на животе')),
        op('Пластика рубца после кесарева', '400 000', 'Делает рубец тонким и незаметным.', catalogPhoto('c-section-scar', 'Рубец после кесарева сечения')),
        op('Липофилинг кистей рук', '200 000', 'Омолаживает кисти рук собственным жиром.', catalogPhoto('hand-lipofilling', 'Кисти рук женщины', 680, 543)),
      ],
    },
    {
      id: 'intimate',
      label: 'Интимная пластика',
      title: 'Интимная пластика',
      icon: 'intimate',
      keywords: ['лабиопластика', 'вагинопластика'],
      items: [
        op('Лабиопластика', '300 000', 'Коррекция малых и больших половых губ.', catalogPhoto('labiaplasty', 'Цветок лилии')),
        op('Липофилинг половых губ', '455 000', 'Объём и упругость собственным жиром.', catalogPhoto('labia-lipofilling', 'Половинка персика и шприц')),
        op('Нитевой лифтинг промежности', '585 000', 'Малоинвазивная подтяжка без разрезов.', catalogPhoto('perineum-thread-lift', 'Лепесток розы с хирургической нитью')),
        op('Пластика стенок влагалища и промежности', '1 000 000', 'Восстановление после родов: кольпорафия, перинеорафия.', catalogPhoto('vaginoplasty', 'Бутон тюльпана')),
      ],
    },
  ],
  cta: {
    title: 'Не знаете, какая операция вам\u00a0нужна?',
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

export interface ClinicTourContent {
  id: string;
  title: string;
  text: string;
  /**
   * Grid order (design 2026-11-04): the first photo stands two rows tall on the left, the last one lies two columns
   * wide at the bottom; the rest fill the cells between them in order.
   */
  items: { label: string; image: LandingImage }[];
}

const tourPhoto = (name: string, width: number, height: number, alt: string): LandingImage => ({
  src: `assets/img/web/tour-${name}.webp`,
  width,
  height,
  alt,
});

export const clinicTour: ClinicTourContent = {
  id: 'clinic',
  title: 'Знакомство с RR Clinic',
  text: 'Посмотрите, как клиника выглядит изнутри, — от ресепшена до кабинетов. Чтобы перед первым визитом здесь уже было немного знакомо.',
  items: [
    { label: 'Фасад здания', image: tourPhoto('facade', 800, 994, 'Здание RR Clinic с вывеской на фасаде') },
    { label: 'Кабинеты врачей', image: tourPhoto('cabinets', 900, 503, 'Кабинет врача с рабочим столом и кушеткой') },
    { label: 'Реабилитационная', image: tourPhoto('rehab', 900, 503, 'Реабилитационная палата с двумя кроватями') },
    { label: 'Reception', image: tourPhoto('reception', 900, 503, 'Стойка ресепшена в холле клиники') },
    { label: 'Операционная', image: tourPhoto('surgery', 900, 503, 'Хирурги во время операции') },
    { label: 'Палаты', image: tourPhoto('wards', 900, 503, 'Палата с функциональными кроватями') },
    { label: 'Холл RR Clinic', image: tourPhoto('hall', 1376, 768, 'Холл клиники с логотипом RR Clinic на стене') },
  ],
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
  items: [
    {
      topic: 'prep',
      question: 'Как выбрать хирурга и подходящую операцию?',
      answer:
        'Начните с консультации по вашему запросу: коррекции лица, груди, тела или интимной зоны. Врач оценит ' +
        'состояние здоровья и особенности тканей, объяснит варианты, ограничения и подготовку к операции. Если ещё ' +
        'не выбрали специалиста, оставьте заявку, и мы поможем подобрать хирурга.',
    },
    {
      topic: 'prep',
      question: 'Можно ли обойтись без операции?',
      answer:
        'Иногда да. Тренировки и косметологические процедуры могут помочь при отдельных изменениях, но не устраняют ' +
        'выраженный избыток кожи или опущение груди. После родов возможность операции оценивают с учётом ' +
        'восстановления, завершения кормления, стабильности веса и планов на следующую беременность.',
    },
    {
      topic: 'prep',
      question: 'Можно ли одновременно скорректировать живот и грудь?',
      answer:
        'В некоторых случаях коррекцию живота, груди и отдельных зон тела можно объединить. Хирург оценивает ' +
        'состояние здоровья, объём вмешательства и его предполагаемую длительность. После сочетанной операции ' +
        'проходит один общий период восстановления, но сама операция может быть связана с большей нагрузкой на ' +
        'организм. Иногда безопаснее проводить коррекцию поэтапно.',
    },
    {
      topic: 'after',
      question: 'Останутся ли рубцы?',
      answer:
        'Да, после разрезов остаются рубцы. Их расположение и длина зависят от операции и выбранной техники. Со ' +
        'временем они обычно становятся светлее и менее заметными, но полностью не исчезают. До операции хирург ' +
        'объяснит, где пройдут разрезы и как ухаживать за рубцами.',
    },
    {
      topic: 'safety',
      question: 'Насколько безопасна операция в вашей клинике?',
      answer:
        'Любая операция связана с рисками. Перед вмешательством хирург и анестезиолог оценивают состояние здоровья, ' +
        'результаты обследования и противопоказания. С учётом этого подбирают объём операции и обезболивание. ' +
        'Возможные осложнения, меры профилактики и ограничения на время восстановления обсуждаются заранее.',
    },
    {
      topic: 'safety',
      question: 'Какая будет анестезия?',
      answer:
        'Вид анестезии зависит от операции и состояния здоровья. Возможны местное обезболивание или общий наркоз. ' +
        'Анестезиолог изучит результаты обследований, уточнит сведения об аллергиях и предыдущих анестезиях, ' +
        'объяснит выбранный вариант. Во время операции медицинская команда контролирует ваше состояние.',
    },
    {
      topic: 'after',
      question: 'Сколько займёт восстановление?',
      answer:
        'Сроки зависят от операции и объёма коррекции. После вмешательства возможны боль, отёки и синяки; врач ' +
        'назначит обезболивание и уход. Хирург объяснит, когда можно работать, заниматься спортом и поднимать ' +
        'ребёнка, нужна ли помощь дома. Контрольные осмотры проходят по назначенному графику.',
    },
    {
      topic: 'after',
      question: 'Когда я увижу результат?',
      answer:
        'Изменения становятся заметнее по мере уменьшения отёка. Итог оценивают после заживления тканей, обычно ' +
        'через несколько месяцев; срок зависит от операции. Желаемую степень изменений и естественность результата ' +
        'обсуждают с хирургом заранее, с учётом ваших исходных данных. Фотографии других пациентов помогают обсудить ' +
        'пожелания, но не гарантируют такой же результат.',
    },
    {
      topic: 'prices',
      question: 'Есть ли рассрочка и кредит?',
      answer: 'Да, операцию можно оплатить в рассрочку или кредит через Kaspi и Halyk.',
    },
    {
      topic: 'prep',
      question: 'В каком формате проходит консультация?',
      answer: 'Консультация проходит очно в клинике в Астане или онлайн.',
    },
    {
      topic: 'prices',
      question: 'Что входит в стоимость операции?',
      answer:
        'Состав услуг зависит от вида и объёма коррекции. После консультации менеджер пришлёт подробный расчёт. ' +
        'Анализы сдаются отдельно. До записи на операцию уточните, включены ли анестезия, пребывание в клинике, ' +
        'компрессионное бельё и контрольные осмотры, чтобы заранее понимать полную сумму.',
    },
    {
      topic: 'visitors',
      question: 'Я из другого города. Сколько нужно быть в Астане?',
      answer:
        'Начните с онлайн-консультации: хирург поможет предварительно спланировать обследования и срок пребывания ' +
        'в Астане. Он зависит от операции, перевязок и контрольных осмотров. До покупки билетов согласуйте даты с ' +
        'клиникой. Возможность дальнейшего наблюдения онлайн обсудите с врачом.',
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
      // The designer's map with its pin and label, cropped from the footer design; the card opens 2GIS.
      src: 'assets/img/web/footer-map.webp',
      width: 471,
      height: 244,
      alt: 'RR Clinic на карте: Астана, ул. Орынбор, 12',
      href: 'https://2gis.kz/astana/firm/70000001066801836',
    },
  },
  copyright: '© 2026 RR Clinic. Все права защищены.',
  legal: [
    // TODO(content): no data-processing consent yet — confirm the target with the client.
    { label: 'Лицензии клиники', href: 'https://drive.google.com/file/d/1fixGxJX3GIo-xLjsyjLxcy3mydZ11tiD/view' },
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
