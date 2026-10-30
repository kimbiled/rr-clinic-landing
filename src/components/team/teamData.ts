import { heroData } from '../../data/hero';
import type { Doctor, ImageAsset } from '../../data/types';

export type TeamTabId = 'surgeons' | 'brigade' | 'nurses';

export interface TeamTab {
  id: TeamTabId;
  label: string;
  /** Figma tab width; the three tabs + gaps make the 587 px capsule. */
  widthClass: string;
  subtitle: string | null;
  members: Doctor[];
}

/** Design order of the "Пластические хирурги" row (design 2026-10-30); it shows nine cards, Улагашева follows them. */
const SURGEON_ORDER = [
  'kurmanbaev-rustam',
  'romanovskaya-tatyana',
  'musa-baurzhan',
  'temirkhanov-amir',
  'tulepbergenova-tomiris',
  'temirkhan-anar',
  'kodzoeva-leyla',
  'savelyev-evgeniy',
  'chatinyan-garik',
  'ulagasheva-alina',
];

/**
 * Team-card photos: the Figma card exports (assets-src/img/team-<id>-figma.svg — arches, blurred backdrop,
 * cut-out and glows) flattened at 2x, see scripts/optimize-images.sh. Kept here, not in hero.json `photo`;
 * the hero hover panel uses the face crops in hero.json `avatar` (avatar-<id>.webp).
 */
const card = (id: string): ImageAsset => ({ src: `assets/img/web/team-${id}.webp`, width: 600, height: 1124 });
export const TEAM_PHOTOS: Record<string, ImageAsset> = Object.fromEntries(SURGEON_ORDER.map((id) => [id, card(id)]));

/** Team-card copy: the card shows "Фамилия / Имя Отчество" (no patronymics in the hero data) and the lines below. */
export interface CardText {
  patronymic?: string;
  /** Operation tags over the photo. */
  tags: string[];
  /** Line above the name, e.g. "Пластический хирург • Стаж 10 лет". */
  role: string;
  /** Three lines on the card. */
  bio: string;
  /** Two figures under the bio. */
  stats: { value: string; label: string }[];
  /** "Запись закрыта" instead of the booking button. */
  bookingClosed?: boolean;
}

/** Team-card copy (design 2026-10-30). Улагашева is not in the design: her text and figures come from her page. */
export const CARD_TEXT: Record<string, CardText> = {
  'kurmanbaev-rustam': {
    patronymic: 'Амангельдыевич',
    tags: ['Липоабдоминопластика', 'Маммопластика', 'Липофилинг ягодиц'],
    role: 'Основатель • Стаж 15 лет',
    bio: 'Специалист по абдоминопластике с ушиванием диастаза. Возвращает форму живота и контуры тела после родов и похудения.',
    stats: [
      { value: '10 000+', label: 'операций' },
      { value: '400', label: 'операций на теле в год' },
    ],
  },
  'romanovskaya-tatyana': {
    patronymic: 'Владимировна',
    tags: ['Фейслифтинг', 'Блефаропластика', 'Маммопластика'],
    role: 'Основатель • Стаж 27 лет',
    bio: 'Автор запатентованной методики «Голливудский фейслифтинг». Подтяжка лица и шеи с эффектом омоложения до 15 лет.',
    stats: [
      { value: '6 500', label: 'операций' },
      { value: '250', label: 'операций на лице в год' },
    ],
    bookingClosed: true,
  },
  'musa-baurzhan': {
    patronymic: 'Жаннатович',
    tags: ['Блефаропластика', 'Маммопластика', 'Подтяжка груди'],
    role: 'Пластический хирург • Стаж 10 лет',
    bio: 'Специалист по пластике век, увеличению и подтяжке груди. Возвращает лицу молодой вид за одну операцию.',
    stats: [
      { value: '2 000', label: 'операций' },
      { value: '300', label: 'операций в год' },
    ],
  },
  'temirkhanov-amir': {
    patronymic: 'Багдатович',
    tags: ['Абдоминопластика', 'Липомоделирование', 'Подтяжка груди'],
    role: 'Пластический хирург • Стаж 4 года',
    bio: 'Специалист по абдоминопластике и липомоделированию. Возвращает форму груди, живота и талии после родов за одну операцию.',
    stats: [
      { value: '1 800+', label: 'часов в операционной' },
      { value: '1', label: 'этап для коррекции фигуры' },
    ],
  },
  'tulepbergenova-tomiris': {
    patronymic: 'Арыстанбековна',
    tags: ['Блефаропластика'],
    role: 'Хирург-резидент • RR Clinic',
    bio: 'Хирург-резидент отделения пластической хирургии RR Clinic. Коррекция нависших век для более открытого взгляда.',
    stats: [
      { value: '3 000+', label: 'часов практики' },
      { value: '1 000+', label: 'операций в команде' },
    ],
  },
  'temirkhan-anar': {
    patronymic: 'Нурланкызы',
    tags: ['Блефаропластика'],
    role: 'Хирург-резидент • Практика 8+ лет',
    bio: 'Резидент отделения пластической хирургии RR Clinic, ученица Бауржана Мусы. Открытый взгляд с сохранением ваших черт.',
    stats: [
      { value: '2 000+', label: 'часов в операционной' },
      { value: '8+', label: 'лет практики' },
    ],
  },
  'kodzoeva-leyla': {
    patronymic: 'Магомедовна',
    tags: ['Интимная пластика', 'Маммопластика', 'Подтяжка груди'],
    role: 'Пластический хирург • Стаж 14 лет',
    bio: 'Специалист по интимной пластике и пластике груди. Лауреат премии «Хирург года» 2025, спикер конгресса ICTPS 2024.',
    stats: [
      { value: '1 000+', label: 'пациенток' },
      { value: '100+', label: 'операций в год' },
    ],
  },
  'savelyev-evgeniy': {
    patronymic: 'Игоревич',
    tags: ['Увеличение груди', 'Подтяжка груди', 'Повторные операции'],
    role: 'Кандидат мед. наук • Стаж 15+ лет',
    bio: 'Специализируется на пластике груди, восстановлении фигуры и сложных повторных операциях.',
    stats: [
      { value: '3 000+', label: 'операций' },
      { value: '1 000+', label: 'пациенток' },
    ],
  },
  'chatinyan-garik': {
    patronymic: 'Артурович',
    tags: ['Ринопластика', 'Подтяжка лица', 'Маммопластика'],
    role: 'Пластический хирург • Стаж 11 лет',
    bio: 'Пластический и челюстно-лицевой хирург. Выполняет открытую и закрытую ринопластику, создаёт чёткие контуры лица.',
    stats: [
      { value: '1 500+', label: 'операций' },
      { value: '400+', label: 'операций в год' },
    ],
  },
  'ulagasheva-alina': {
    patronymic: 'Ибрагимовна',
    tags: ['Пластика груди', 'Пластика лица', 'Пластика век'],
    role: 'Пластический хирург • Стаж 8+ лет',
    bio: 'Пластический хирург. Эстетическая хирургия груди и лица. Член Сибирской ассоциации пластических, реконструктивных и эстетических хирургов.',
    stats: [
      { value: '1 200+', label: 'операций' },
      { value: '8+', label: 'лет практики' },
    ],
  },
};

function orderedSurgeons(doctors: Doctor[]): Doctor[] {
  const byId = new Map(doctors.map((d) => [d.id, d]));
  const head = SURGEON_ORDER.map((id) => byId.get(id)).filter((d): d is Doctor => Boolean(d));
  // Anyone else in the data follows the design's ten.
  const tail = doctors.filter((d) => !SURGEON_ORDER.includes(d.id));
  return [...head, ...tail];
}

export const TEAM_TABS: TeamTab[] = [
  {
    id: 'surgeons',
    label: 'Пластические хирурги',
    widthClass: '',
    subtitle: 'Волшебники, которые воплощают мечты в реальность',
    members: orderedSurgeons(heroData.doctors),
  },
  // No data yet — rendered as an empty state inside the same layout.
  { id: 'brigade', label: 'Операционная бригада', widthClass: '', subtitle: null, members: [] },
  { id: 'nurses', label: 'Палатные медсестры', widthClass: '', subtitle: null, members: [] },
];
