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

/**
 * Team-card copy from the design: the card shows "Фамилия / Имя Отчество" and a short note, which
 * differ from the hero data (no patronymics there). Missing entries fall back to the doctor data.
 */
export interface CardText {
  patronymic?: string;
  note?: string;
  /** Phone card extras (design 2026-10-29), shown when present: operation tags over the photo, a role line
   *  above the name, a longer bio instead of `note`, and up to two figures. */
  tags?: string[];
  role?: string;
  bio?: string;
  stats?: { value: string; label: string }[];
}

// TODO(content): the phone design fills tags / role / bio / stats for Курманбаев only — ask the clinic for the rest.
export const CARD_TEXT: Record<string, CardText> = {
  'kurmanbaev-rustam': {
    patronymic: 'Амангельдыевич',
    note: 'Абдоминопластика с ушиванием диастаза',
    tags: ['Липоабдоминопластика', 'Маммопластика', 'Липофилинг ягодиц'],
    role: 'Основатель • Стаж 15 лет',
    bio: 'Специалист по абдоминопластике с ушиванием диастаза. Возвращает форму живота и контуры тела после родов и похудения.',
    stats: [
      { value: '10 000+', label: 'операций' },
      { value: '400', label: 'операций на теле в год' },
    ],
  },
  'romanovskaya-tatyana': { patronymic: 'Владимировна', note: 'Автор методики «Голливудский фейслифтинг»' },
  'musa-baurzhan': { patronymic: 'Жаннатович', note: 'Пластика век, увеличение и подтяжка груди' },
  'temirkhanov-amir': { patronymic: 'Багдатович', note: 'Абдоминопластика, липомоделирование' },
  'chatinyan-garik': { patronymic: 'Артурович', note: 'Челюстно-лицевой хирург, открытая и закрытая ринопластика' },
  'kodzoeva-leyla': { patronymic: 'Магомедовна', note: 'Интимная пластика и пластика груди' },
  'ulagasheva-alina': { patronymic: 'Ибрагимовна', note: 'Эстетическая хирургия груди и лица' },
  'savelyev-evgeniy': { patronymic: 'Игоревич', note: 'Восстановление фигуры и сложные повторные операции' },
  'tulepbergenova-tomiris': {
    patronymic: 'Арыстанбековна',
    note: 'Хирург-резидент, отделение пластической хирургии RR Clinic',
  },
  'temirkhan-anar': { patronymic: 'Нурланкызы', note: 'Хирург-резидент, отделение пластической хирургии RR Clinic' },
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
