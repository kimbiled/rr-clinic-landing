// Strip motion engine (owner: FE-2): a time-based rAF velocity model that writes translate3d only.
// No React state per frame — positions come from this model, never from layout reads.
// All units are STAGE px (the hero stage is 1440×720 scaled by `stage.scale`).
import { EDGE, GEOM, IDLE_FIRST_X, RM_FIRST_X, SPEED, T, clamp, easeInOutSine, easeOutCubic } from './geometry';

type Ease = (t: number) => number;

interface Velocity {
  from: number;
  to: number;
  t0: number;
  dur: number;
  ease: Ease;
}

interface Tween {
  from: number;
  to: number;
  t0: number;
  dur: number;
}

export interface PlacedLift {
  el: HTMLElement;
  k: number;
}

export class StripMotion {
  readonly P: number; // loop period
  /** Track translateX; normal range [-2P, -P) so copy #1 (the focusable one) starts in [-P, 0). */
  x: number;
  width: number;
  rm: boolean;
  introStarted = false;

  track: HTMLElement | null = null;
  /** Lifted clones in the overlay, positioned from the same model every frame. */
  readonly lifts = new Map<number, PlacedLift>();
  /** While false (a lift / focus / drag holds a card), the loop never wraps under it. */
  canWrap: () => boolean = () => true;

  private vel: Velocity = { from: 0, to: 0, t0: 0, dur: 1, ease: easeOutCubic };
  private tween: Tween | null = null;
  private holding = false;
  private visible = true;
  private paused = false; // e.g. the full-screen surgeon menu covers the hero (N2-9)
  private raf = 0;
  private lastT = 0;

  constructor(caseCount: number, width: number, reducedMotion: boolean) {
    this.P = caseCount * GEOM.PITCH;
    this.width = width;
    this.rm = reducedMotion;
    this.x = this.homeX();
  }

  /** Card 1 at the Figma offset (−40, or 24 with reduced motion), centred like the statue. */
  homeX(): number {
    return this.wrap((this.rm ? RM_FIRST_X : IDLE_FIRST_X) + (this.width - GEOM.DESIGN_W) / 2 - this.P);
  }

  wrap(x: number): number {
    const { P } = this;
    return -2 * P + ((((x + 2 * P) % P) + P) % P);
  }

  /** Copies of the case set needed to cover the stage width at any x in [-2P, -P). */
  static copiesFor(width: number, P: number): number {
    return Math.ceil(width / P) + 2;
  }

  // ---------- inputs ----------

  setTrack(el: HTMLElement | null) {
    this.track = el;
    this.render();
  }

  setWidth(width: number) {
    if (width === this.width) return;
    this.width = width;
    this.render();
  }

  setReducedMotion(rm: boolean) {
    if (rm === this.rm) return;
    this.rm = rm;
    if (rm) {
      this.tween = null;
      this.vel = { from: 0, to: 0, t0: 0, dur: 1, ease: easeOutCubic };
      this.stop();
      this.x = this.homeX();
      this.render();
    } else if (!this.holding && this.introStarted) {
      this.setVelocity(SPEED, T.accel, easeInOutSine);
    }
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    if (this.running()) this.kick();
    else this.stop();
  }

  /** Pause the loop while something covers the hero (surgeon menu) — same as a hidden tab. */
  setPaused(paused: boolean) {
    this.paused = paused;
    if (this.running()) this.kick();
    else this.stop();
  }

  /** Cards fade in with the hero reveal (§9.5); the strip then ramps 0 → 40 px/s. */
  startIntro(delay: number) {
    if (this.introStarted) return;
    this.introStarted = true;
    if (this.rm || this.holding) return;
    this.setVelocity(SPEED, T.ramp, easeInOutSine, Math.max(0, delay));
  }

  /** Hover / focus / drag hold: 40 → 0 over 400 ms; release: wait 250 ms, 0 → 40 over 700 ms. */
  setHold(hold: boolean) {
    if (hold === this.holding) return;
    this.holding = hold;
    if (!this.introStarted || this.rm) return;
    if (hold) this.setVelocity(0, T.decel, easeOutCubic);
    else this.setVelocity(SPEED, T.accel, easeInOutSine, T.resumeDelay);
  }

  /** Distance (stage px) card k's left edge is outside the fully-visible band, for track offset x. */
  private bandDistance(x: number, k: number): number {
    const c = x + k * GEOM.PITCH;
    const lo = EDGE;
    const hi = this.width - GEOM.W - EDGE;
    return c < lo ? lo - c : c > hi ? c - hi : 0;
  }

  /**
   * N2-2: shift x by whole loop periods — visually identical — so that card k (only one copy is
   * tabbable) becomes the duplicate nearest the visible band. The track still covers the stage for
   * any x in [width − copies·P, 0]. Returns the shift in periods (0 = none).
   */
  alignForFocus(k: number): number {
    const lo = this.width - StripMotion.copiesFor(this.width, this.P) * this.P;
    let best = 0;
    let bestD = this.bandDistance(this.x, k);
    for (const m of [-1, 1, -2, 2, -3, 3]) {
      const x = this.x + m * this.P;
      if (x < lo || x > 0) continue;
      const d = this.bandDistance(x, k);
      if (d < bestD - 0.5) {
        bestD = d;
        best = m;
      }
    }
    if (best) {
      const shift = best * this.P;
      this.x += shift;
      if (this.tween) {
        this.tween.from += shift;
        this.tween.to += shift;
      }
      this.render();
    }
    return best;
  }

  /**
   * Keyboard focus: glide the strip so card k is fully inside the stage. Called after
   * alignForFocus, so the glide is at most (P − visible band) / 2 ≈ 280–400 stage px.
   */
  ensureVisible(k: number) {
    const c = this.x + k * GEOM.PITCH;
    const d = clamp(c, EDGE, this.width - GEOM.W - EDGE);
    const dist = Math.abs(d - c);
    if (dist < 0.5) return;
    const to = this.x + (d - c);
    if (this.rm) {
      this.x = to;
      this.render();
      return;
    }
    // Calm glide: duration grows with distance (≤ focusScroll), peak speed stays ≈ 2 px/ms.
    this.tween = { from: this.x, to, t0: performance.now(), dur: clamp(200 + dist * 0.8, 200, T.focusScroll) };
    this.kick();
  }

  /** Card k's left edge in stage px. */
  leftOf(k: number): number {
    return this.x + k * GEOM.PITCH;
  }

  // ---------- loop ----------

  private velocityAt(now: number): number {
    const v = this.vel;
    if (now <= v.t0) return v.from;
    const p = Math.min(1, (now - v.t0) / v.dur);
    return v.from + (v.to - v.from) * v.ease(p);
  }

  private setVelocity(to: number, dur: number, ease: Ease, delay = 0) {
    const now = performance.now();
    this.vel = { from: this.velocityAt(now), to, t0: now + delay, dur, ease };
    this.kick();
  }

  private moving(now: number): boolean {
    if (this.tween) return true;
    if (this.rm) return false;
    const v = this.vel;
    return !(v.to === 0 && now >= v.t0 + v.dur);
  }

  private running(): boolean {
    return this.visible && !this.paused && !document.hidden;
  }

  kick() {
    if (this.raf || !this.running()) return;
    const now = performance.now();
    if (!this.moving(now)) return;
    this.lastT = now;
    this.raf = requestAnimationFrame(this.step);
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private step = (now: number) => {
    this.raf = 0;
    const dt = clamp((now - this.lastT) / 1000, 0, 0.1); // time-based; clamp long frames
    this.lastT = now;

    if (this.tween) {
      const tw = this.tween;
      const p = clamp((now - tw.t0) / tw.dur, 0, 1);
      this.x = tw.from + (tw.to - tw.from) * easeOutCubic(p);
      if (p >= 1) this.tween = null;
    } else if (!this.rm) {
      this.x += this.velocityAt(now) * dt;
      if (this.canWrap()) this.x = this.wrap(this.x);
    }

    const keepGoing = this.running() && this.moving(now);
    // QA P-5: no visible snap on stop — only absorb float dust, never a 0.35 px jump.
    if (!keepGoing && Math.abs(this.x - Math.round(this.x)) < 0.05) this.x = Math.round(this.x);
    this.render();
    if (keepGoing) this.raf = requestAnimationFrame(this.step);
  };

  /** Writes only. */
  render() {
    if (this.track) this.track.style.transform = `translate3d(${this.x}px,0,0)`;
    for (const lift of this.lifts.values()) this.place(lift);
  }

  place(lift: PlacedLift) {
    const left = this.leftOf(lift.k);
    lift.el.style.transform = `translate3d(${left}px,${GEOM.TOP}px,0)`;
    // Lets the lift's dim layer replay the hero vignette at this exact spot (QA P-1).
    lift.el.style.setProperty('--cc-lx', `${left}px`);
    lift.el.style.setProperty('--cc-stage-w', `${this.width}px`);
  }

  destroy() {
    this.stop();
    this.track = null;
    this.lifts.clear();
  }
}
