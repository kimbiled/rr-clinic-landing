import { useSyncExternalStore } from 'react';

export const STAGE_W = 1440;
export const STAGE_H = 720;
const STAGE_MAX_SCALE = 2;
/** body has min-width 1280 (desktop scope); below that the page scrolls horizontally. */
const MIN_LAYOUT_W = 1280;
/** Never crop the composition narrower than this many stage px (keeps statue + strip readable). */
const MIN_STAGE_W = 1200;

export interface Stage {
  /** CSS px per stage px. Divide client-coordinate deltas by it; multiply canvas backing size by it. */
  scale: number;
  /** Stage width in stage px (= viewport width / scale). Height is always STAGE_H. */
  width: number;
  height: number;
}

let current: Stage = { scale: 1, width: STAGE_W, height: STAGE_H };

function measure(): Stage {
  const vw = Math.max(document.documentElement.clientWidth, MIN_LAYOUT_W);
  // "cover": fill the first screen (no light band under the hero at 1920×1080 / 2560×1440),
  // cropping the sides a little rather than letterboxing; capped so the stage never gets narrower
  // than MIN_STAGE_W and never upscales past STAGE_MAX_SCALE.
  const cover = Math.max(vw / STAGE_W, window.innerHeight / STAGE_H);
  const scale = Math.min(Math.max(cover, 1), STAGE_MAX_SCALE, Math.max(vw / MIN_STAGE_W, 1));
  const width = vw / scale;
  if (scale !== current.scale || width !== current.width) {
    current = { scale, width, height: STAGE_H };
  }
  return current;
}

function subscribe(onChange: () => void) {
  window.addEventListener('resize', onChange, { passive: true });
  return () => window.removeEventListener('resize', onChange);
}

/**
 * The hero is the 1440×720 Figma composition scaled as one unit so the strip, statue and text keep
 * their relationship at every desktop size. Scale = cover(vw/1440, vh/720), clamped to 1…2 and to
 * vw/1200 (1920×1080 → 1.5, 2560×1440 → 2, 1440×900 → 1.2, 1280×720 → 1).
 */
export function useStageScale(): Stage {
  return useSyncExternalStore(subscribe, measure, () => current);
}
