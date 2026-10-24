import { useState, type CSSProperties } from 'react';
import { asset } from '../../data/hero';
import { worldMap } from '../../data/worldMap';

/** Countries without a label in the design: their pin only appears while the country is hovered. */
const HOVER_ONLY = new Set(['kazakhstan']);
/** Patients' countries too close to a labelled neighbour: just the dot, the label shows on hover. */
const DOT_ONLY = new Set(['lithuania', 'belarus', 'ukraine', 'moldova', 'italy', 'turkey', 'kyrgyzstan']);
/** Reveal (Trust section data-rv): the pills rise in one by one, lowest on the map first. */
const PIN_REVEAL_START_MS = 450;
const PIN_REVEAL_STEP_MS = 140;

/**
 * Trust world map: the static base (every other country) as an <img>, the patients' countries + Kazakhstan
 * inline on top. Hovering a country or its pin highlights both; leaving it resets the map.
 */
export function WorldMap({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const { countries } = worldMap;
  const revealOrder = countries
    .filter((c) => !HOVER_ONLY.has(c.key))
    .sort((a, b) => b.y - a.y)
    .map((c) => c.key);
  // Back to default as soon as the pointer leaves the country or its pin. Moving country → own pin fires
  // leave + enter in the same tick, so React batches them and the highlight doesn't flicker.
  const leave = () => setActive(null);

  return (
    <div
      className={`rr-map relative ${className ?? ''}`}
      style={{ aspectRatio: `${worldMap.width} / ${worldMap.height}` }}
      role="img"
      aria-label={`Карта: ${countries.map((c) => c.label).join(', ')}`}
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
        {countries.map((c) => (
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

      {/* Dot-only pins first, so the labelled pills paint over their dots where they overlap */}
      {[...countries].sort((a, b) => +DOT_ONLY.has(b.key) - +DOT_ONLY.has(a.key)).map((c) => (
        <span
          key={c.key}
          className="rr-map__pin absolute"
          style={
            {
              left: `${c.x}%`,
              top: `${c.y}%`,
              '--pin-d': `${PIN_REVEAL_START_MS + Math.max(0, revealOrder.indexOf(c.key)) * PIN_REVEAL_STEP_MS}ms`,
            } as CSSProperties
          }
          data-hover-only={HOVER_ONLY.has(c.key) || undefined}
          data-dot-only={DOT_ONLY.has(c.key) || undefined}
          data-active={active === c.key || undefined}
          onPointerEnter={() => setActive(c.key)}
          onPointerLeave={leave}
          aria-hidden="true"
        >
          <span className="rr-map__label">{c.label}</span>
          <span className="rr-map__dot" />
        </span>
      ))}
    </div>
  );
}
