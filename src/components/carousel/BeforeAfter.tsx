// Before/after media (§4.2 anatomy, §6 slider). The divider position (--pos), aria values and the
// dragging/resetting/hint flags are written imperatively by the controller via `registerBa`.
import { useCallback, type CSSProperties } from 'react';
import { asset } from '../../data/hero';
import type { BeforeAfterCase, ImageAsset } from '../../data/types';
import { useCarousel } from './CarouselContext';
import { baSlidable, framingStyle, fromPair } from './geometry';

const ARROW_LEFT = 'M5.37931 6.2069L4.13793 4.96552L5.37931 3.72414'; // assets/icons/arrow-left.svg
const ARROW_RIGHT = 'M4.55172 3.72414L5.7931 4.96552L4.55172 6.2069'; // assets/icons/arrow-right.svg

function Arrow({ d, side }: { d: string; side: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 9.93104 9.93104"
      aria-hidden="true"
      focusable="false"
      className={`absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 size-3 ${side === 'left' ? '-translate-x-[2.4px]' : 'translate-x-[2.4px]'}`}
    >
      <path d={d} fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Props {
  item: BeforeAfterCase;
  /** Registry key — shared by a strip card and its lifted clone so both show one divider. */
  baKey: string;
  eager: boolean;
  /** Lifted clone: draggable, glass knob with hover state. */
  interactive?: boolean;
}

export function BeforeAfter({ item, baKey, eager, interactive = false }: Props) {
  const ctrl = useCarousel();
  const register = useCallback((el: HTMLDivElement | null) => (el ? ctrl.registerBa(baKey, el) : undefined), [ctrl, baKey]);

  const before = item.before ?? (item.pair && fromPair(item.pair, 'before'));
  const after = item.after ?? (item.pair && fromPair(item.pair, 'after'));
  // Full framed photos slide; half-card crops are a static 50/50 split (see baSlidable).
  const clip = baSlidable(item);

  const image = (img: ImageAsset | undefined, side: 'before' | 'after') =>
    img ? (
      <img
        src={asset(img.src)}
        width={img.width}
        height={img.height}
        alt={img.alt ?? `${side === 'before' ? 'До' : 'После'}: ${item.title}`}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        className={
          clip
            ? 'absolute max-w-none object-cover'
            : 'absolute inset-0 size-full max-w-none object-cover'
        }
        style={clip ? framingStyle(img.framing, side === 'before' ? { x: 0, w: 0.5 } : { x: 0.5, w: 0.5 }) : undefined}
      />
    ) : null;

  return (
    <div
      ref={register}
      data-ba=""
      data-interactive={interactive && clip ? '' : undefined}
      className={`cc-ba absolute inset-0 overflow-hidden bg-[#4a3624] font-text text-white ${clip ? 'cc-ba--clip' : 'cc-ba--split'} ${
        interactive && clip ? 'cursor-ew-resize touch-none' : ''
      }`}
      style={{ '--pos': '50%' } as CSSProperties}
    >
      {/* Split panes are fixed halves (carousel.css); a utility inset-0 would override that. */}
      <div className={`cc-ba__pane cc-ba__pane--after absolute overflow-hidden ${clip ? 'inset-0' : ''}`}>{image(after, 'after')}</div>
      <div className={`cc-ba__pane cc-ba__pane--before absolute overflow-hidden ${clip ? 'inset-0' : ''}`}>{image(before, 'before')}</div>
      <div className="cc-shade-bottom" aria-hidden="true" />
      <span aria-hidden="true" className="pointer-events-none absolute left-4 top-4 text-[12px]/[12px] uppercase tracking-[0.02em] text-white/85">
        До
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute right-4 top-4 text-[12px]/[12px] uppercase tracking-[0.02em] text-white/85">
        После
      </span>
      <span aria-hidden="true" className="cc-ba__line" />
      {/* Visual only — the focusable card carries role="slider" (N2-6). No knob on a static split. */}
      {clip && (
        <span data-ba-knob="" aria-hidden="true" className="cc-ba__knob">
          <Arrow d={ARROW_LEFT} side="left" />
          <Arrow d={ARROW_RIGHT} side="right" />
        </span>
      )}
      {item.showTitle && (
        <p className="pointer-events-none absolute bottom-4 left-4 m-0 line-clamp-2 w-[108px] text-[12px]/[12px] font-medium text-white">{item.title}</p>
      )}
    </div>
  );
}
