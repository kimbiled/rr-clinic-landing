import { useState, type CSSProperties } from 'react';
import { asset } from '../../data/hero';
import { worldMap } from '../../data/worldMap';
import { useIsMobile } from '../../hooks/useIsMobile';

const [VIEW_LEFT, VIEW_TOP, VIEW_WIDTH, VIEW_HEIGHT] = worldMap.viewBox.split(' ').map(Number);

/** Part of the map shown, in viewBox units. Desktop (design 2026-10-28): the full width, from the Arctic
 *  islands down to just below Thailand. Phones (design 2026-10-29): Europe to Thailand. */
interface Crop {
  x: number;
  y: number;
  w: number;
  h: number;
}
const CROP_DESKTOP: Crop = { x: VIEW_LEFT, y: -250, w: VIEW_WIDTH, h: 270 };
const CROP_MOBILE: Crop = { x: 318, y: -239, w: 283, h: 242 };

type Side = 'top' | 'top-left' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom-right';

/**
 * Pins as placed in the design: dot position in % of the desktop crop, and the label's side of the dot.
 * Countries not listed here keep their generated pin and show it only while hovered.
 */
const PINS: Record<string, { x: number; y: number; side: Side; label?: string; noDot?: boolean }> = {
  canada: { x: 12.6, y: 44.9, side: 'top' },
  usa: { x: 26.2, y: 58.7, side: 'top' },
  germany: { x: 50.3, y: 45.7, side: 'top-left' },
  ukraine: { x: 55, y: 48.2, side: 'top-right' },
  moldova: { x: 54.5, y: 52.2, side: 'left' },
  italy: { x: 50, y: 57.6, side: 'bottom-left' },
  turkey: { x: 54.6, y: 58.3, side: 'bottom-right' },
  israel: { x: 56.9, y: 68.2, side: 'left' },
  russia: { x: 72.6, y: 34, side: 'top' },
  kazakhstan: { x: 67.2, y: 56.4, side: 'top-right', label: 'RR Clinic' },
  kyrgyzstan: { x: 67.7, y: 61, side: 'right', noDot: true },
  uae: { x: 61.8, y: 72.3, side: 'right' },
  thailand: { x: 74.4, y: 81.5, side: 'right' },
};
/** Reveal (Trust section data-rv): the pills rise in one by one, lowest on the map first. */
const PIN_REVEAL_START_MS = 450;
const PIN_REVEAL_STEP_MS = 140;

/** Pin → viewBox units: design pins are % of the desktop crop, generated ones % of the full viewBox. */
const fromDesktop = (x: number, y: number) => ({
  vx: CROP_DESKTOP.x + (x / 100) * CROP_DESKTOP.w,
  vy: CROP_DESKTOP.y + (y / 100) * CROP_DESKTOP.h,
});
const fromView = (x: number, y: number) => ({
  vx: VIEW_LEFT + (x / 100) * VIEW_WIDTH,
  vy: VIEW_TOP + (y / 100) * VIEW_HEIGHT,
});

/**
 * Trust world map: the static base (every other country) as an <img>, the patients' countries + Kazakhstan
 * inline on top, both cropped to the design's band of latitudes. Hovering a country or its pin highlights
 * both; leaving it resets the map.
 */
export function WorldMap({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const crop = useIsMobile() ? CROP_MOBILE : CROP_DESKTOP;
  const pins = worldMap.countries
    .map((c) => {
      const placed = PINS[c.key];
      const { vx, vy } = placed ? fromDesktop(placed.x, placed.y) : fromView(c.x, c.y);
      return {
        key: c.key,
        label: placed?.label ?? c.label,
        x: ((vx - crop.x) / crop.w) * 100,
        y: ((vy - crop.y) / crop.h) * 100,
        side: placed?.side ?? 'top',
        noDot: placed?.noDot ?? false,
        hoverOnly: !placed,
      };
    })
    .filter((p) => p.x > 2 && p.x < 98 && p.y > 2 && p.y < 98);
  const revealOrder = pins
    .filter((p) => !p.hoverOnly)
    .sort((a, b) => b.y - a.y)
    .map((p) => p.key);
  // Back to default as soon as the pointer leaves the country or its pin. Moving country → own pin fires
  // leave + enter in the same tick, so React batches them and the highlight doesn't flicker.
  const leave = () => setActive(null);

  return (
    <div
      className={`rr-map relative ${className ?? ''}`}
      style={{ aspectRatio: `${crop.w} / ${crop.h}` }}
      role="img"
      aria-label={`Карта: ${worldMap.countries
        .filter((c) => c.key !== 'kazakhstan')
        .map((c) => c.label)
        .join(', ')}; RR Clinic — Казахстан`}
    >
      {/* Full-height map shifted up inside a clipping box that fades out at the top and bottom */}
      <div className="rr-map__geo absolute inset-0 overflow-hidden">
        <div
          className="absolute"
          style={{
            left: `${((VIEW_LEFT - crop.x) / crop.w) * 100}%`,
            top: `${((VIEW_TOP - crop.y) / crop.h) * 100}%`,
            width: `${(VIEW_WIDTH / crop.w) * 100}%`,
            height: `${(VIEW_HEIGHT / crop.h) * 100}%`,
          }}
        >
          <img
            src={asset(worldMap.base)}
            width={worldMap.width}
            height={worldMap.height}
            alt=""
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute inset-0 size-full select-none"
          />

          <svg viewBox={worldMap.viewBox} className="absolute inset-0 size-full" aria-hidden="true">
            {worldMap.countries.map((c) => (
              <path
                key={c.key}
                d={c.d}
                className="rr-map__country"
                data-country={c.key}
                data-active={active === c.key || undefined}
                onPointerEnter={() => setActive(c.key)}
                onPointerLeave={leave}
              />
            ))}
          </svg>
        </div>
      </div>

      {pins.map((p) => (
        <span
          key={p.key}
          className="rr-map__pin absolute"
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              '--pin-d': `${PIN_REVEAL_START_MS + Math.max(0, revealOrder.indexOf(p.key)) * PIN_REVEAL_STEP_MS}ms`,
            } as CSSProperties
          }
          data-side={p.side}
          data-country={p.key}
          data-hover-only={p.hoverOnly || undefined}
          data-no-dot={p.noDot || undefined}
          data-active={active === p.key || undefined}
          onPointerEnter={() => setActive(p.key)}
          onPointerLeave={leave}
          aria-hidden="true"
        >
          <span className="rr-map__dot" />
          <span className="rr-map__label">{p.label}</span>
        </span>
      ))}
    </div>
  );
}
