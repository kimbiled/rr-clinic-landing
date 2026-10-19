import { heroData } from '../../data/hero';
import type { Doctor } from '../../data/types';

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
  'kodzoeva-leyla',
  'chatinyan-garik',
];

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
    widthClass: 'w-[190px]',
    subtitle: 'Волшебники, которые воплощают мечты в реальность',
    members: orderedSurgeons(heroData.doctors),
  },
  // No data yet — rendered as an empty state inside the same layout.
  { id: 'brigade', label: 'Операционная бригада', widthClass: 'w-[200px]', subtitle: null, members: [] },
  { id: 'nurses', label: 'Палатные медсестры', widthClass: 'w-[179px]', subtitle: null, members: [] },
];
