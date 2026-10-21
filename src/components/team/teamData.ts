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

/** Design order of the "Пластические хирурги" row (Figma 04 / Наша команда). */
const SURGEON_ORDER = [
  'kurmanbaev-rustam',
  'romanovskaya-tatyana',
  'musa-baurzhan',
  'temirkhanov-amir',
  'chatinyan-garik',
  'kodzoeva-leyla',
];

/**
 * Team-card copy from the design: the card shows "Фамилия / Имя Отчество" and a short note, which
 * differ from the hero data (no patronymics there). Missing entries fall back to the doctor data.
 */
/**
 * Team-card cut-outs (Figma exports, transparent background — see scripts/optimize-images.sh). Kept here,
 * not in hero.json `photo`, so the hero avatars (which fall back to `photo`) stay as they are.
 */
const cutout = (id: string, width: number): ImageAsset => ({ src: `assets/img/web/doctor-${id}.webp`, width, height: 750 });
export const TEAM_PHOTOS: Record<string, ImageAsset> = {
  'kurmanbaev-rustam': cutout('kurmanbaev-rustam', 539),
  'romanovskaya-tatyana': cutout('romanovskaya-tatyana', 565),
  'musa-baurzhan': cutout('musa-baurzhan', 601),
  'temirkhanov-amir': cutout('temirkhanov-amir', 563),
  'chatinyan-garik': cutout('chatinyan-garik', 563),
};

export const CARD_TEXT: Record<string, { patronymic?: string; note?: string }> = {
  'kurmanbaev-rustam': { patronymic: 'Амангельдыевич', note: 'Абдоминопластика с ушиванием диастаза' },
  'romanovskaya-tatyana': { patronymic: 'Владимировна' },
  'musa-baurzhan': { patronymic: 'Жаннатович' },
  'temirkhanov-amir': { patronymic: 'Багдатович' },
  'chatinyan-garik': { note: 'Открытая и закрытая ринопластика' },
};

function orderedSurgeons(doctors: Doctor[]): Doctor[] {
  const byId = new Map(doctors.map((d) => [d.id, d]));
  const head = SURGEON_ORDER.map((id) => byId.get(id)).filter((d): d is Doctor => Boolean(d));
  // Anyone else in the data (Тулепбергенова, Савельев…) follows the six from the design.
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
