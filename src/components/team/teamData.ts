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

/** Design order of the "Пластические хирурги" row (design 2026-10-28, ten cards). */
const SURGEON_ORDER = [
  'kurmanbaev-rustam',
  'romanovskaya-tatyana',
  'musa-baurzhan',
  'temirkhanov-amir',
  'chatinyan-garik',
  'kodzoeva-leyla',
  'ulagasheva-alina',
  'savelyev-evgeniy',
  'tulepbergenova-tomiris',
  'temirkhan-anar',
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
  /** One line with ⌄ on the card; the full text (and `stats`) when expanded. */
  bio: string;
  stats?: { value: string; label: string }[];
}

/**
 * Team-card copy (design 2026-10-29). The design shows each bio cut to one line; where the rest is not in
 * the design it is completed from the hero data / the doctor's page.
 * TODO(content): confirm the full bios with the clinic.
 */
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
    bio: 'Автор запатентованной методики «Голливудский фейслифтинг» — авторской подтяжки лица и шеи на основе Deep Plane Facelift.',
  },
  'musa-baurzhan': {
    patronymic: 'Жаннатович',
    tags: ['Блефаропластика', 'Маммопластика', 'Подтяжка груди'],
    role: 'Пластический хирург • Стаж 10 лет',
    bio: 'Специалист по пластике век, увеличению и подтяжке груди.',
  },
  'temirkhanov-amir': {
    patronymic: 'Багдатович',
    tags: ['Абдоминопластика', 'Липомоделирование', 'Подтяжка груди'],
    role: 'Пластический хирург • Стаж 4 года',
    bio: 'Специалист по абдоминопластике и липомоделированию, комплексной коррекции фигуры.',
  },
  'chatinyan-garik': {
    patronymic: 'Артурович',
    tags: ['Ринопластика', 'Подтяжка лица', 'Маммопластика'],
    role: 'Пластический хирург • Стаж 11 лет',
    bio: 'Пластический и челюстно-лицевой хирург. Выполняет открытую и закрытую ринопластику.',
  },
  'kodzoeva-leyla': {
    patronymic: 'Магомедовна',
    tags: ['Интимная пластика', 'Маммопластика', 'Подтяжка груди'],
    role: 'Пластический хирург • Стаж 14 лет',
    bio: 'Специалист по интимной пластике и пластике груди.',
  },
  'ulagasheva-alina': {
    patronymic: 'Ибрагимовна',
    tags: ['Пластика груди', 'Пластика лица', 'Пластика век'],
    role: 'Пластический хирург • Стаж 8+ лет',
    bio: 'Эстетическая хирургия груди и лица.',
  },
  'savelyev-evgeniy': {
    patronymic: 'Игоревич',
    tags: ['Увеличение груди', 'Подтяжка груди', 'Повторные операции'],
    role: 'Кандидат мед. наук • Стаж 15+ лет',
    bio: 'Специализируется на пластике груди, восстановлении фигуры и сложных повторных операциях.',
  },
  'tulepbergenova-tomiris': {
    patronymic: 'Арыстанбековна',
    tags: ['Блефаропластика'],
    role: 'Хирург-резидент • RR Clinic',
    bio: 'Хирург-резидент отделения пластической хирургии RR Clinic.',
  },
  'temirkhan-anar': {
    patronymic: 'Нурланкызы',
    tags: ['Блефаропластика'],
    role: 'Хирург-резидент • Практика 8+ лет',
    bio: 'Резидент отделения пластической хирургии RR Clinic.',
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
