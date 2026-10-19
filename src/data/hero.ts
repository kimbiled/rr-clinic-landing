import raw from './hero.json';
import type { Case, Doctor, HeroData } from './types';

export const heroData = raw as unknown as HeroData;

const doctorsById = new Map(heroData.doctors.map((doctor) => [doctor.id, doctor]));

export function getDoctor(id: string | null | undefined): Doctor | undefined {
  return id ? doctorsById.get(id) : undefined;
}

export function getCasesByDoctor(doctorId: string): Case[] {
  return heroData.cases.filter((item) => item.doctorId === doctorId);
}

/** Public-folder asset URL (respects Vite `base`). */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
