import type { ImageAsset } from '../../data/types';
import surgeonFaq from '../../../scripts/surgeon-faq.json';

// A surgeon's own page (design 2026-11-04, "Рустам Курманбаев"): everything that differs between doctors.
// The designer's raw exports live in assets-src/img/doctor-rustam/; the web copies in public/assets/img/web/doctor/rustam/.

export interface PriceItem {
  name: string;
  /** Tenge, "от …". */
  price: number;
  /** After "по" in the WhatsApp message: "Хочу записаться на консультацию по увеличению груди." */
  dative: string;
}

export interface PriceGroup {
  id: string;
  /** Tab label; "\n" breaks it like the design. */
  tab: string;
  /** Heading over the list. */
  title: string;
  icon: string;
  items: PriceItem[];
}

export interface VideoReview {
  topic: string;
  title: string;
  poster: ImageAsset;
  href: string;
}

export interface EducationGroup {
  title: string;
  items: { year: string; title: string; text: string }[];
}

/** A tab of "Результаты операций": the works whose title is one of `titles`. */
export interface WorkFilter {
  label: string;
  titles: string[];
}

export interface DoctorProfile {
  /** hero.json / works.json id. */
  doctorId: string;
  /** Page address, also the breadcrumb's last step. */
  route: string;
  lastName: string;
  givenNames: string;
  /** "Рустам Курманбаев" (breadcrumb, alt texts). */
  shortName: string;
  /** "доктора Рустама" under "Результаты работ". */
  worksOf: string;
  /** WhatsApp text of "Записаться на консультацию". */
  consultationMessage: string;
  role: string;
  tags: string[];
  /** The first city is gold. */
  cities: [string, string];
  about: string;
  stats: { value: string; label: string }[];
  consultation: { inPerson: number; online: number };
  /** `story`: the Instagram-story preview beside the portrait; it opens `interview.href`. */
  hero: { background: ImageAsset; photo: ImageAsset; story: ImageAsset };
  prices: PriceGroup[];
  /** Filters over the doctor's works (works.json titles); "Все работы" comes first by itself. */
  workFilters: WorkFilter[];
  /** Index into `workFilters` selected on load; -1 = "Все работы". */
  workFilterDefault: number;
  /** "Образование и квалификация": the specialist certificate card and the accordion groups. */
  education: { certificate: { number: string; href: string }; groups: EducationGroup[] };
  /** "Достижения и опыт": the list, the cut-out portrait, the badge with the patients' faces. */
  achievements: { items: { title: string; text: string }[]; photo: ImageAsset; badge: string; instagram: string };
  interview: { poster: ImageAsset; label: string; href: string };
  reviews: {
    text: { author: string; date: string; text: string };
    tall: VideoReview;
    wide: VideoReview;
    side: VideoReview;
    /** Patients' faces in the "10 000+" card. */
    patients: string[];
    all: string;
  };
  faq: { question: string; answer: string }[];
}

const img = (src: string, width: number, height: number, alt = ''): ImageAsset => ({ src, width, height, alt });

const rustam: DoctorProfile = {
  doctorId: 'kurmanbaev-rustam',
  route: '/doctors/kurmanbayev-rustam/',
  lastName: 'Курманбаев',
  givenNames: 'Рустам Амангельдыевич',
  shortName: 'Рустам Курманбаев',
  worksOf: 'доктора Рустама',
  consultationMessage: 'Здравствуйте! Хочу записаться на консультацию к доктору Рустаму Курманбаеву',
  role: 'Основатель · Пластический хирург',
  tags: ['Липоабдоминопластика', 'Маммопластика', 'Липофилинг ягодиц'],
  cities: ['Астана,', 'Москва, Новосибирск'],
  about: 'Специализируется на коррекции живота и пластике груди. Одно из основных направлений — абдоминопластика с ушиванием диастаза.',
  stats: [
    { value: '4800+', label: 'проведенных абдоминопластик' },
    { value: '2000+', label: 'проведенных маммопластик' },
    { value: '400+', label: 'операций в год' },
    { value: '15', label: 'лет в пластической хирургии' },
  ],
  consultation: { inPerson: 20000, online: 10000 },
  hero: {
    // Designer's exports (assets-src/img/doctor-rustam/): the blurred hall, the 450×642 portrait, the story preview.
    background: img('assets/img/web/doctor/rustam/hero-bg.webp', 2160, 1035),
    photo: img('assets/img/web/doctor/rustam/hero.webp', 900, 1284, 'Рустам Курманбаев, пластический хирург'),
    story: img('assets/img/web/doctor/rustam/story.webp', 384, 684, 'Рустам Курманбаев рассказывает о себе'),
  },
  prices: [
    {
      id: 'mammoplasty',
      tab: 'Маммопластика',
      title: 'Маммопластика',
      icon: 'assets/icons/operation-breast.svg',
      items: [
        { name: 'Увеличение груди', price: 2800000, dative: 'увеличению груди' },
        { name: 'Подтяжка груди без использования имплантов', price: 3500000, dative: 'подтяжке груди без использования имплантов' },
        { name: 'Подтяжка груди с использованием имплантов', price: 3900000, dative: 'подтяжке груди с использованием имплантов' },
      ],
    },
    {
      id: 'abdominoplasty',
      tab: 'Абдоминопластика',
      title: 'Абдоминопластика',
      icon: 'assets/icons/operation-body.svg',
      items: [
        { name: 'Абдоминопластика', price: 3000000, dative: 'абдоминопластике' },
        { name: 'Липомоделирование талии с абдоминопластикой', price: 6000000, dative: 'липомоделированию талии с абдоминопластикой' },
      ],
    },
    {
      id: 'liposculpture',
      tab: 'Липомоделирование',
      title: 'Липомоделирование',
      icon: 'assets/icons/program-waist.svg',
      items: [
        { name: 'Липомоделирование талии', price: 3500000, dative: 'липомоделированию талии' },
        { name: 'Липомоделирование бедер', price: 1800000, dative: 'липомоделированию бёдер' },
        { name: 'Липомоделирование плечевой зоны', price: 1200000, dative: 'липомоделированию плечевой зоны' },
        { name: 'Липомоделирование грудной и лопаточной зоны', price: 1800000, dative: 'липомоделированию грудной и лопаточной зоны' },
        { name: 'Гинекомастия', price: 1500000, dative: 'гинекомастии' },
      ],
    },
    {
      id: 'eyelids',
      tab: 'Пластика век',
      title: 'Пластика век',
      icon: 'assets/icons/operation-eye.svg',
      items: [
        { name: 'Верхняя блефаропластика', price: 800000, dative: 'верхней блефаропластике' },
        { name: 'Нижняя блефаропластика', price: 800000, dative: 'нижней блефаропластике' },
        { name: 'Круговая блефаропластика', price: 2000000, dative: 'круговой блефаропластике' },
      ],
    },
    {
      id: 'lipofilling',
      tab: 'Липофилинг\nи коррекция тела',
      title: 'Липофилинг и коррекция тела',
      icon: 'assets/icons/operation-body-contouring.svg',
      items: [
        { name: 'Липофилинг ягодиц', price: 1200000, dative: 'липофилингу ягодиц' },
        { name: 'Липофилинг кистей рук', price: 800000, dative: 'липофилингу кистей рук' },
        { name: 'Липофилинг зоны декольте', price: 1000000, dative: 'липофилингу зоны декольте' },
        { name: 'Плазменная подтяжка 1 зоны (спина, бедра, живот, плечевая зона)', price: 1000000, dative: 'плазменной подтяжке' },
        { name: 'Брахиопластика', price: 1500000, dative: 'брахиопластике' },
        { name: 'Феморопластика', price: 1800000, dative: 'феморопластике' },
        { name: 'Верхний бодилифт', price: 2000000, dative: 'верхнему бодилифту' },
        { name: 'Нижний бодилифт с глютеопластикой (абдомино, подтяжка ягодиц с увеличением)', price: 7500000, dative: 'нижнему бодилифту с глютеопластикой' },
        { name: 'Глютеопластика (увеличение ягодиц имплантами)', price: 3200000, dative: 'глютеопластике' },
      ],
    },
    {
      id: 'intimate',
      tab: 'Интимная пластика',
      title: 'Интимная пластика — М и Ж',
      icon: 'assets/icons/operation-intimate.svg',
      items: [
        { name: 'Липофилинг полового органа', price: 800000, dative: 'липофилингу полового органа' },
        // The design says "Удлинение Федора"; written out until the clinic confirms its own wording.
        { name: 'Удлинение полового члена', price: 1500000, dative: 'удлинению полового члена' },
        { name: 'Липофилинг половых губ', price: 800000, dative: 'липофилингу половых губ' },
      ],
    },
  ],
  workFilters: [
    { label: 'Абдоминопластика', titles: ['Абдоминопластика'] },
    { label: 'Маммопластика', titles: ['Маммопластика', 'Операции на груди'] },
    { label: 'Липомоделирование', titles: ['Липомоделирование', 'Липофилинг ягодиц'] },
  ],
  workFilterDefault: 0,
  education: {
    certificate: {
      number: 'KZ61VBM02152825',
      href: 'https://drive.google.com/file/d/1GvNGB2HXchxamX90drG3e1ZTCfAoRBBq/view?usp=drive_link',
    },
    groups: [
      {
        title: 'Базовое образование',
        items: [
          { year: '2013', title: 'Лечебное дело', text: 'Государственный медицинский университет города Семей, Казахстан. Базовое образование.' },
          { year: '2015', title: 'Интернатура по хирургии', text: 'Государственный медицинский университет города Семей, Казахстан.' },
          { year: '2017', title: 'Ординатура по пластической хирургии', text: 'Новосибирский государственный университет, Россия.' },
        ],
      },
      {
        title: 'Повышение квалификации',
        items: [
          {
            year: '2015',
            title: 'Пластическая хирургия',
            text: 'Курс у президента Ассоциации пластических хирургов Казахстана Болата Каленовича Баирова. Алматы, Казахстан.',
          },
          { year: '2016', title: 'Реконструктивная и эстетическая хирургия', text: 'Университетская клиника Charité. Берлин, Германия.' },
          { year: '2016', title: 'Пластическая хирургия', text: 'Курс в клинике Clinica da Lagoa. Рио-де-Жанейро, Бразилия.' },
        ],
      },
      {
        title: 'Стажировки и совместная практика',
        items: [
          { year: '2016', title: 'Стажировка по BBL', text: 'Стажировка у Dr. Alexander Aslani. Европа.' },
          { year: '2017', title: 'Совместная практика', text: 'Совместная практика с Dr. Marcus Petros. Колумбия.' },
        ],
      },
      {
        title: 'Конгрессы',
        items: [
          {
            year: '2024',
            title: 'Национальный конгресс',
            text: 'XIII Национальный конгресс имени Миланова «Пластическая хирургия, эстетическая медицина и косметология».',
          },
        ],
      },
    ],
  },
  achievements: {
    items: [
      { title: 'Более 10 000 операций', text: 'Практический опыт в пластической хирургии груди и тела.' },
      { title: 'Обучение у Constantino Mendieta', text: 'Обучался у пластического хирурга Constantino Mendieta в США.' },
      { title: 'Две операции под одним наркозом', text: 'Выполняет несколько вмешательств в рамках одной операции под одним наркозом.' },
      { title: 'Повторная коррекция и пластика\nпосле похудения', text: 'Работает с последствиями предыдущих операций и избытками кожи после снижения веса.' },
      { title: 'Основатель RR Clinic', text: 'Основал клинику пластической хирургии в Астане.' },
    ],
    // assets-src/img/doctor-kurmanbaev-rustam-figma.svg (the cut-out), 1000 px wide.
    photo: img('assets/img/web/doctor/rustam/achievements.webp', 1000, 1393, 'Рустам Курманбаев'),
    badge: '10 000+',
    instagram: 'https://www.instagram.com/dr.rustam.kz/',
  },
  interview: {
    poster: img('assets/img/web/doctor/rustam/interview.webp', 1008, 750, 'Рустам Курманбаев в операционной'),
    label: 'Смотреть интервью с Рустамом Курманбаевым',
    // TODO(content): the interview video itself; for now the doctor's Instagram.
    href: 'https://www.instagram.com/dr.rustam.kz/',
  },
  reviews: {
    text: {
      author: 'Амина',
      date: '18 мая 2026',
      text: 'Всем привет! Меня зовут Амина. Я прошла абдоминопластику с ушиванием диастаза. После родов мой живот потерял былую плоскость, также остались…',
    },
    tall: {
      topic: 'Пластическая операция',
      title: 'Интервью с Алией',
      poster: img('assets/img/web/doctor/rustam/review-aliya.webp', 740, 840, 'Пациентка Алия'),
      href: 'https://www.instagram.com/p/Dd_LT1BCJkA/?img_index=2',
    },
    wide: {
      topic: 'Результат спустя\n2,5 месяца',
      title: 'Видеоотзыв',
      poster: img('assets/img/web/doctor/rustam/review-result-2-5.webp', 1010, 504, 'Пациентка через 2,5 месяца после операции'),
      href: 'https://www.instagram.com/dr.rustam.kz/reel/CwuJzvPt_1s/',
    },
    side: {
      topic: 'Операция на груди',
      title: 'Интервью с Евгенией',
      poster: img('assets/img/web/doctor/rustam/review-evgenia.webp', 674, 1152, 'Пациентка Евгения'),
      href: 'https://www.instagram.com/p/Dd_LT1BCJkA/?img_index=5',
    },
    patients: [1, 2, 3, 4].map((n) => `assets/img/web/doctor/rustam/patient-${n}.webp`),
    all: 'https://www.instagram.com/rr.clinic.kz/',
  },
  faq: surgeonFaq['kurmanbayev-rustam'],
};

/** By the page's data-doctor attribute (doctors/<slug>/index.html). */
export const PROFILES: Record<string, DoctorProfile> = { 'kurmanbayev-rustam': rustam };
