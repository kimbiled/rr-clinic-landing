// Single shared rAF loop for all background FX layers (design-spec §9 "Global").
// `tick(dt, now, interval)` gets dt in seconds, clamped so a resume after a pause never jumps.

const MAX_DT = 0.05;

export type TickFn = (dt: number, now: number, interval: number) => void;

export interface Loop {
  start(): void;
  stop(): void;
  readonly running: boolean;
}

export function createLoop(tick: TickFn): Loop {
  let raf = 0;
  let last = 0;

  function step(now: number) {
    raf = requestAnimationFrame(step);
    const dt = last ? Math.min((now - last) / 1000, MAX_DT) : 1 / 60;
    const interval = last ? now - last : 16.7;
    last = now;
    tick(dt, now, interval);
  }

  return {
    start() {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(step);
    },
    stop() {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    },
    get running() {
      return raf !== 0;
    },
  };
}
