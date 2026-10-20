// Shared constants + pure helpers for the case strip (owner: FE-2).
// Spec: docs/design-spec.md §4 (geometry), §6 (slider), §9.3–9.4 (timings).
import type { CSSProperties } from 'react';
import type { Case, Doctor, Framing, ImageAsset, PairImage } from '../../data/types';

/** Stage-px geometry (the hero is a 1440×720 stage scaled as a unit). */
export const GEOM = {
  W: 200, // card width (Animation frame 1713:3971)
  H: 220, // card height
  PITCH: 220, // width + 20 gap
  TOP: 124, // strip top inside the 720 frame
  LIFT: 16, // hover rise (FIGMA note)
  DESIGN_W: 1440,
  // No-hover zone around the statue head (stage px from the stage centre): the pointer there
  // never picks a card, and a card whose centre is this close is mostly hidden by the statue.
  STATUE_POINTER: 150,
  // A lifted card (photo + FRAME each side) may not overlap the centre band: the hero chips row
  // ([data-cc-keepout], measured live) or, without it, ±KEEP_OUT around the stage centre.
  KEEP_OUT: 170,
  FRAME: 10,
} as const;

export const SPEED = 40; // px/s, FIGMA annotation 1716:4724 — positive = left → right
export const IDLE_FIRST_X = -40; // card 1 position in frame 1713:3971
export const RM_FIRST_X = 24; // §9.3 reduced motion
export const EDGE = 24; // keep keyboard-focused cards this far inside the stage
export const POS_MIN = 4; // §6 clamp — the 22 px knob stays inside the card (QA m-1)
export const POS_MAX = 96;

export const T = {
  decel: 600, // hover: 40 → 0
  accel: 1100, // resume: 0 → 40
  resumeDelay: 340, // = leave: the strip only moves once the lifted card has settled back
  intent: 80, // ignore pass-through hovers shorter than this
  leave: 340, // all leave transitions run 320 ms together (carousel.css)
  focusScroll: 520,
  swap: 200,
  video: 120,
  introAt: 300,
  introStep: 60,
  rampAt: 900,
  ramp: 800,
  introFallback: 2500,
  posReset: 1150, // 600 delay + 500 ease + margin
  decodeWait: 150,
} as const;

export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Places `framing` (normalised rect of the source) onto a horizontal slot of the card
 * (slot.x / slot.w as fractions of the card width, full height). Same maths as docs/data-schema.md.
 */
export function framingStyle(framing: Framing | undefined, slot = { x: 0, w: 1 }): CSSProperties | undefined {
  if (!framing) return undefined;
  const width = (slot.w * 100) / framing.w;
  const height = 100 / framing.h;
  const left = slot.x * 100 - width * framing.x;
  const top = -height * framing.y;
  const r = (n: number) => `${Math.round(n * 1000) / 1000}%`;
  return { left: r(left), top: r(top), width: r(width), height: r(height) };
}

/** Shrinks `rect` around its centre to the slot aspect: a uniform "cover" crop, never a stretch. */
function coverRect(rect: Framing, w: number, h: number, slotAspect: number): Framing {
  const rw = rect.w * w;
  const rh = rect.h * h;
  if (rw / rh > slotAspect) {
    const nw = (rh * slotAspect) / w;
    return { x: rect.x + (rect.w - nw) / 2, y: rect.y, w: nw, h: rect.h };
  }
  const nh = rw / slotAspect / h;
  return { x: rect.x, y: rect.y + (rect.h - nh) / 2, w: rect.w, h: nh };
}

/** Fallback when a case only has the side-by-side `pair` source (left half = before). */
export function fromPair(pair: PairImage, side: 'before' | 'after'): ImageAsset {
  const halfAspect = GEOM.W / 2 / GEOM.H;
  return {
    src: pair.src,
    width: pair.width,
    height: pair.height,
    framing: coverRect(pair[side], pair.width, pair.height, halfAspect),
  };
}

export interface VideoSource {
  src: string;
  type?: string;
}

/** `video` is typed `string | null`, data-schema documents `{ src, type } | null`; accept both. */
export function videoSource(item: Case): VideoSource | null {
  if (item.type !== 'video') return null;
  const raw = item.video as unknown;
  if (typeof raw === 'string' && raw) return { src: raw };
  if (raw && typeof raw === 'object' && typeof (raw as VideoSource).src === 'string' && (raw as VideoSource).src) {
    return raw as VideoSource;
  }
  return null;
}

export function doctorName(doctor: Doctor | undefined): string {
  if (!doctor) return '';
  const full = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ');
  return full || doctor.name || '';
}

export function initials(doctor: Doctor): string {
  return `${doctor.firstName?.[0] ?? ''}${doctor.lastName?.[0] ?? ''}`;
}

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/**
 * A before/after case can only be slid when both sides are full photos placed by `framing` (or cut
 * from a `pair`). Half-card crops (case-4/7 from Figma) have nothing beyond their half: any divider
 * move would open an empty gap, so those render as a static 50/50 split like the Figma frame.
 */
export function baSlidable(item: Case): boolean {
  if (item.type !== 'beforeAfter') return false;
  const side = (img: ImageAsset | null | undefined) => (img ? Boolean(img.framing) : Boolean(item.pair));
  return side(item.before) && side(item.after);
}

export function thumbImage(item: Case): ImageAsset | null {
  return item.type === 'video' ? item.poster : (item.after ?? item.before ?? null);
}

/** Registry key shared by a strip card's B/A media and its lifted clone (one divider position). */
export const cardKey = (k: number) => `card:${k}`;
