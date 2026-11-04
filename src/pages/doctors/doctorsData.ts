import { heroData } from '../../data/hero';
import type { Doctor } from '../../data/types';

// "Хирурги" page (design 2026-11-03): the nine surgeons of the design, in its order, filtered by body area.

export type CategoryId = 'all' | 'breast' | 'body' | 'face' | 'eyes' | 'nose' | 'intimate';

export interface Category {
  id: CategoryId;
  label: string;
  /** public/assets/icons/… */
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all', label: 'Все хирурги', icon: 'assets/icons/team-tab-surgeons.svg' },
  { id: 'breast', label: 'Грудь', icon: 'assets/icons/operation-breast.svg' },
  { id: 'body', label: 'Тело', icon: 'assets/icons/operation-body.svg' },
  { id: 'face', label: 'Лицо', icon: 'assets/icons/operation-face.svg' },
  { id: 'eyes', label: 'Веки', icon: 'assets/icons/operation-eye.svg' },
  { id: 'nose', label: 'Нос', icon: 'assets/icons/operation-nose.svg' },
  { id: 'intimate', label: 'Интимная пластика', icon: 'assets/icons/operation-intimate.svg' },
];

/** Who operates where; the design's counts are Грудь 7, Тело 3, Лицо 2, Веки 4, Нос 1, Интимная пластика 1. */
const AREAS: Record<string, Exclude<CategoryId, 'all'>[]> = {
  'kurmanbaev-rustam': ['breast', 'body'],
  'romanovskaya-tatyana': ['face', 'eyes', 'breast'],
  'musa-baurzhan': ['eyes', 'breast'],
  'temirkhanov-amir': ['body', 'breast'],
  'tulepbergenova-tomiris': ['eyes'],
  'temirkhan-anar': ['eyes'],
  'kodzoeva-leyla': ['intimate', 'breast'],
  'savelyev-evgeniy': ['breast', 'body'],
  'chatinyan-garik': ['nose', 'face', 'breast'],
};

const byId = new Map(heroData.doctors.map((doctor) => [doctor.id, doctor]));
export const SURGEONS: Doctor[] = Object.keys(AREAS)
  .map((id) => byId.get(id))
  .filter((doctor): doctor is Doctor => Boolean(doctor));

export function surgeonsIn(category: CategoryId): Doctor[] {
  return category === 'all' ? SURGEONS : SURGEONS.filter((doctor) => AREAS[doctor.id].includes(category));
}

export const page = {
  title: 'Хирурги',
  accent: 'RR Clinic',
  subtitle: ['узких специалистов — каждый эксперт в своей зоне', 'Не делаем всё подряд, делаем своё на отлично'],
  help: { title: 'Не знаете к кому записаться?', button: 'Менеджер подберёт врача' },
};
