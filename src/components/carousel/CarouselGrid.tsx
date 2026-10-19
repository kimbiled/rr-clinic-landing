// Static measuring grid (§4.4): two horizontals on the card band + verticals every 220 stage px,
// aligned to x = 360, 580, 800, 1020, 1240 of the 1440 frame (centred like the statue).
import { memo } from 'react';
import { GEOM } from './geometry';

export const CarouselGrid = memo(function CarouselGrid({ width }: { width: number }) {
  const first = width / 2 - GEOM.DESIGN_W / 2 + 360;
  const start = first - Math.ceil(first / GEOM.PITCH) * GEOM.PITCH;
  const xs: number[] = [];
  for (let x = start; x <= width; x += GEOM.PITCH) if (x >= 0) xs.push(Math.round(x));

  return (
    <div className="cc-grid pointer-events-none absolute inset-0" aria-hidden="true">
      <span className="absolute inset-x-0 h-px bg-white/12" style={{ top: GEOM.TOP }} />
      <span className="absolute inset-x-0 h-px bg-white/12" style={{ top: GEOM.TOP + GEOM.H }} />
      {xs.map((x) => (
        <span key={x} className="cc-grid__v absolute top-[92px] h-[284px] w-px" style={{ left: x }} />
      ))}
    </div>
  );
});
