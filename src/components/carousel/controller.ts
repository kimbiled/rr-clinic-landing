// Interaction controller for the case strip (owner: FE-2).
//
// Layering: the strip lives in .hero__carousel (z 2, below statue + text). Its moving track is a
// stacking context, so a z-index on a card cannot lift it over the headline. Instead the active card
// is re-rendered as a "lift" (clone of its media + the doctor panel) portalled into the hero overlay
// (z 7, above the text), positioned from the same strip model every frame, while the original is
// hidden (opacity 0, which keeps keyboard focus on it).
//
// React renders cards and lifts from `getSnapshot()`; everything per-frame (translate3d, the B/A
// divider while dragging) is written imperatively here and in StripMotion.
import type { FocusedCase } from '../hero/HeroContext';
import type { Case } from '../../data/types';
import { GEOM, POS_MAX, POS_MIN, T, baSlidable, cardKey, clamp } from './geometry';
import { StripMotion } from './motion';

type Reason = 'pointer' | 'focus';
export type LiftPhase = 'pending' | 'on' | 'leaving';
export type IntroPhase = 'wait' | 'run' | 'done';

interface Lift {
  id: number;
  k: number;
  item: Case;
  mediaCaseId: string;
  phase: LiftPhase;
  reasons: Set<Reason>;
  focus: boolean;
  timer: number;
  el: HTMLElement | null;
  commitOnAttach: boolean;
  decodeStarted: boolean;
}

export interface LiftView {
  id: number;
  k: number;
  caseId: string;
  mediaCaseId: string;
  phase: LiftPhase;
  focus: boolean;
}

export interface CarouselSnapshot {
  lifts: readonly LiftView[];
  /** Strip cards currently shown by their lift (hidden in the strip). */
  hidden: ReadonlySet<number>;
  intro: IntroPhase;
}

interface Drag {
  k: number;
  key: string;
  pointerId: number;
  originX: number; // client px of the stage's left edge at drag start
  captureEl: Element;
}

const HINT_KEY = 'rr-cc-hint';

/** B/A registry key for a lift showing another case of the doctor (thumb swap). */
export const liftMediaKey = (liftId: number, caseId: string) => `lift:${liftId}:${caseId}`;

export class CarouselController {
  readonly motion: StripMotion;
  readonly cases: readonly Case[];
  readonly caseById: ReadonlyMap<string, Case>;
  /** CSS px per stage px. Client deltas are divided by it. */
  scale = 1;
  onFocusCase: (value: FocusedCase | null) => void = () => {};

  private mount: HTMLElement | null = null;
  private lifts = new Map<number, Lift>(); // card k → lift
  private liftById = new Map<number, Lift>();
  private nextId = 1;
  private pointerK: number | null = null;
  private pointerInside = false;
  private intent: { k: number | null; timer: number } = { k: null, timer: 0 };
  private focusK: number | null = null;
  private drag: Drag | null = null;

  private baEls = new Map<string, Set<HTMLElement>>();
  private pos = new Map<string, number>();
  private resetTimers = new Map<string, number>();
  private hinted: boolean;

  private onScreen = true;
  private intro: IntroPhase = 'wait';
  private introTimer = 0;
  private listeners = new Set<() => void>();
  private snapshot: CarouselSnapshot;

  constructor(cases: readonly Case[], width: number, reducedMotion: boolean) {
    this.cases = cases;
    this.caseById = new Map(cases.map((c) => [c.id, c]));
    this.motion = new StripMotion(cases.length, width, reducedMotion);
    this.motion.canWrap = () => this.lifts.size === 0 && this.focusK === null && this.drag === null;
    try {
      this.hinted = sessionStorage.getItem(HINT_KEY) === '1';
    } catch {
      this.hinted = false;
    }
    this.snapshot = this.buildSnapshot();
  }

  get rm() {
    return this.motion.rm;
  }

  // ---------- store (useSyncExternalStore) ----------

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getSnapshot = () => this.snapshot;

  private buildSnapshot(): CarouselSnapshot {
    const lifts: LiftView[] = [];
    const hidden = new Set<number>();
    for (const l of this.liftById.values()) {
      lifts.push({ id: l.id, k: l.k, caseId: l.item.id, mediaCaseId: l.mediaCaseId, phase: l.phase, focus: l.focus });
      if (l.phase !== 'pending') hidden.add(l.k);
    }
    return { lifts, hidden, intro: this.intro };
  }

  private emit() {
    this.snapshot = this.buildSnapshot();
    for (const fn of this.listeners) fn();
  }

  // ---------- lifecycle ----------

  connect(mount: HTMLElement, track: HTMLElement): () => void {
    this.mount = mount;
    this.motion.setTrack(track);
    this.motion.setVisible(!document.hidden);

    const onVisibility = () => this.motion.setVisible(!document.hidden && this.onScreen);
    document.addEventListener('visibilitychange', onVisibility);
    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(([entry]) => {
        this.onScreen = entry.isIntersecting;
        onVisibility();
      });
      io.observe(mount);
    }
    this.updateMotion();
    this.motion.kick();

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      io?.disconnect();
      this.motion.setVisible(false); // stops the rAF loop
      this.motion.setTrack(null);
      this.cancelIntent();
      clearTimeout(this.introTimer);
      for (const lift of [...this.liftById.values()]) this.removeLift(lift, false);
      for (const t of this.resetTimers.values()) clearTimeout(t);
      this.resetTimers.clear();
      this.pointerK = null;
      this.pointerInside = false;
      this.focusK = null;
      this.drag = null;
      this.mount = null;
      this.snapshot = this.buildSnapshot(); // no notify during unmount; React re-reads on remount
    };
  }

  /** Stage resize: drop lifts (their slot maths changed), keep x. */
  setStage(width: number, scale: number) {
    this.scale = scale || 1;
    if (width === this.motion.width) return;
    this.cancelIntent();
    for (const lift of [...this.liftById.values()]) this.removeLift(lift, true);
    // Layout moved under the pointer: forget the hover hold; the next pointerover re-establishes it.
    this.pointerK = null;
    this.pointerInside = false;
    this.motion.setWidth(width);
    this.updateMotion();
  }

  /** N2-9: the surgeon menu covers the hero — stop the rAF loop like for a hidden tab. */
  setMenuOpen(open: boolean) {
    this.motion.setPaused(open);
  }

  setReducedMotion(rm: boolean) {
    if (rm === this.motion.rm) return;
    this.motion.setReducedMotion(rm);
    if (rm && this.intro !== 'done') this.finishIntro();
  }

  // ---------- intro (§9.5: cards 300 → 720 ms, stagger 60; ramp from 900 ms over 800 ms) ----------

  /** `elapsed` = ms since the hero reveal t=0 (0 when started now). */
  runIntro(elapsed: number) {
    if (this.intro !== 'wait') return;
    if (this.rm) {
      this.finishIntro();
      return;
    }
    let order = 0;
    const track = this.motion.track;
    if (track) {
      for (const el of track.querySelectorAll<HTMLElement>('[data-cc-card]')) {
        const left = this.motion.leftOf(Number(el.dataset.ccK));
        if (left > -GEOM.W && left < this.motion.width) {
          el.style.animationDelay = `${T.introAt + T.introStep * order - elapsed}ms`;
          order += 1;
        }
      }
    }
    this.intro = 'run';
    this.motion.startIntro(T.rampAt - elapsed);
    this.emit();
    this.introTimer = window.setTimeout(() => this.finishIntro(), T.introAt + T.introStep * order + 700 - elapsed);
  }

  private finishIntro() {
    clearTimeout(this.introTimer);
    for (const el of this.motion.track?.querySelectorAll<HTMLElement>('[data-cc-card]') ?? []) {
      el.style.animationDelay = '';
    }
    this.motion.startIntro(0);
    if (this.intro === 'done') return;
    this.intro = 'done';
    this.emit();
  }

  // ---------- hit testing ----------

  cardOf(node: EventTarget | null): number | null {
    if (!(node instanceof Element)) return null;
    const el = node.closest<HTMLElement>('[data-cc-k]');
    if (!el) return null;
    if (!('ccLift' in el.dataset) && !this.mount?.contains(el)) return null;
    const k = Number(el.dataset.ccK);
    return Number.isFinite(k) ? k : null;
  }

  /**
   * Pointer hit test with no-hover zones: a card behind the statue head, the pointer over the head,
   * or a card cut by the screen edge never lifts (no stop, no panel over the statue). Lifts already sit above
   * the statue, so they stay hoverable. Keyboard focus is not gated.
   */
  private pointerCard(target: EventTarget | null, clientX: number): number | null {
    const k = this.cardOf(target);
    if (k === null || !this.mount || (target as Element).closest('[data-cc-lift]')) return k;
    const mid = this.motion.width / 2;
    const mountLeft = this.mount.getBoundingClientRect().left;
    const stageX = (clientX - mountLeft) / this.scale;
    if (Math.abs(stageX - mid) < GEOM.STATUE_POINTER) return null;
    const left = this.motion.leftOf(k);
    const [a, b] = this.keepOut(mountLeft);
    if (left - GEOM.FRAME < b && left + GEOM.W + GEOM.FRAME > a) return null;
    // Cards cut by the screen edge are only half visible: not selectable either.
    if (left < 0 || left + GEOM.W > this.motion.width) return null;
    return k;
  }

  /** Centre band (stage px) a lifted card's frame must stay clear of: the hero chips row. */
  private keepOut(mountLeft: number): [number, number] {
    const band = document.querySelector('[data-cc-keepout]')?.getBoundingClientRect();
    if (band && band.width > 0) {
      return [(band.left - mountLeft) / this.scale, (band.right - mountLeft) / this.scale];
    }
    const mid = this.motion.width / 2;
    return [mid - GEOM.KEEP_OUT, mid + GEOM.KEEP_OUT];
  }

  // ---------- pointer ----------

  onOver(target: EventTarget | null, clientX: number) {
    const k = this.pointerCard(target, clientX);
    if (k === null) return;
    if (!this.pointerInside) {
      this.pointerInside = true;
      this.updateMotion();
    }
    if (this.drag) return;
    const thumb = (target as Element).closest<HTMLElement>('[data-thumb]');
    if (thumb?.dataset.thumb) {
      const lift = this.lifts.get(k);
      if (lift?.phase === 'on') this.swapMedia(lift, thumb.dataset.thumb);
    }
    this.hoverCard(k);
  }

  private hoverCard(k: number) {
    if (this.pointerK === k) return;
    this.pointerK = k;
    const lift = this.lifts.get(k);
    if (lift && lift.phase !== 'leaving') {
      lift.reasons.add('pointer');
      return;
    }
    this.cancelIntent();
    this.intent.k = k;
    // Re-entering a card that is still settling revives it at once.
    this.intent.timer = window.setTimeout(
      () => {
        this.intent.k = null;
        if (this.pointerK === k) this.activate(k, 'pointer');
      },
      lift ? 0 : T.intent,
    );
  }

  private cancelIntent() {
    clearTimeout(this.intent.timer);
    this.intent.k = null;
  }

  onOut(target: EventTarget | null, related: EventTarget | null, clientX: number) {
    if (this.drag) return; // pointer is captured; drag end decides
    const from = this.cardOf(target);
    const to = this.pointerCard(related, clientX);
    if (from === to) return;
    if (from !== null) {
      if (this.pointerK === from) this.pointerK = null;
      if (this.intent.k === from) this.cancelIntent();
      this.release(from, 'pointer');
    }
    if (to === null && this.pointerInside) {
      this.pointerInside = false;
      if (this.focusK !== null && !this.lifts.has(this.focusK)) this.activate(this.focusK, 'focus');
      this.updateMotion();
    }
  }

  /** Returns true when a before/after drag started (caller should preventDefault). */
  onDown(e: { button: number; target: EventTarget | null; pointerId: number; clientX: number }): boolean {
    if (e.button !== 0 || !(e.target instanceof Element)) return false;
    if (e.target.closest('[data-cc-panel]')) return false; // panel: links/thumbs, no drag
    const k = this.pointerCard(e.target, e.clientX);
    if (k === null) return false;
    this.cancelIntent();
    this.pointerK = k;
    this.pointerInside = true;
    const lift = this.activate(k, 'pointer', true);
    const media = this.caseById.get(lift.mediaCaseId);
    if (!media || !baSlidable(media) || !this.mount) {
      this.updateMotion();
      return false;
    }
    const key = lift.mediaCaseId === lift.item.id ? cardKey(k) : liftMediaKey(lift.id, lift.mediaCaseId);
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
    this.drag = { k, key, pointerId: e.pointerId, originX: this.mount.getBoundingClientRect().left, captureEl: e.target };
    this.setBaFlag(key, 'hint', false);
    this.setBaFlag(key, 'resetting', false);
    this.setBaFlag(key, 'dragging', true);
    this.dragTo(e.clientX);
    this.updateMotion();
    return true;
  }

  onMove(e: { pointerId: number; clientX: number; target: EventTarget | null }) {
    // A card can leave the statue zone under a pointer that is already on it: pick it up on move.
    if (!this.drag && this.pointerK === null) this.onOver(e.target, e.clientX);
    if (!this.drag || e.pointerId !== this.drag.pointerId) return;
    this.dragTo(e.clientX);
  }

  /** client px → stage px (÷ stage.scale), then relative to the card's model position. */
  private dragTo(clientX: number) {
    const drag = this.drag;
    if (!drag) return;
    const stageX = (clientX - drag.originX) / this.scale;
    const pos = ((stageX - this.motion.leftOf(drag.k)) / GEOM.W) * 100;
    this.setPos(drag.key, clamp(pos, POS_MIN, POS_MAX));
  }

  onUp(e: { pointerId: number; type: string; clientX: number; clientY: number }) {
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    this.setBaFlag(drag.key, 'dragging', false);
    this.drag = null;
    try {
      if (drag.captureEl.hasPointerCapture(e.pointerId)) drag.captureEl.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    // Released outside the lifted card → behave like a normal pointer leave.
    const under = e.type === 'pointerup' ? document.elementFromPoint(e.clientX, e.clientY) : null;
    const to = this.pointerCard(under, e.clientX);
    if (to !== drag.k) {
      if (this.pointerK === drag.k) this.pointerK = null;
      this.release(drag.k, 'pointer');
      this.pointerInside = to !== null;
      if (to !== null) this.hoverCard(to);
    }
    this.updateMotion();
  }

  // ---------- keyboard (focus = hover) ----------

  onFocusIn(target: EventTarget | null) {
    if (!(target instanceof HTMLElement) || !('ccCard' in target.dataset)) return;
    // Focus must never scroll the clipped layers.
    if (this.mount?.scrollLeft) this.mount.scrollLeft = 0;
    let keyboard = true;
    try {
      keyboard = target.matches(':focus-visible');
    } catch {
      /* old engines: treat as keyboard */
    }
    if (!keyboard) return;
    const k = Number(target.dataset.ccK);
    this.focusK = k;
    // N2-2: jump to the nearest duplicate first (invisible, whole periods), then glide a short way.
    if (this.motion.alignForFocus(k) !== 0) {
      // Lifts are placed by card index — after a period shift they'd jump; drop them (focus re-lifts).
      this.cancelIntent();
      for (const lift of [...this.liftById.values()]) this.removeLift(lift, true);
      this.pointerK = null;
    }
    this.motion.ensureVisible(k);
    this.activate(k, 'focus');
    this.updateMotion();
  }

  onFocusOut(target: EventTarget | null, related: EventTarget | null) {
    if (!(target instanceof HTMLElement) || !('ccCard' in target.dataset)) return;
    if (related instanceof Node && target.contains(related)) return;
    const k = Number(target.dataset.ccK);
    if (this.focusK === k) this.focusK = null;
    this.release(k, 'focus');
    this.updateMotion();
  }

  /** ←/→ 5 %, Shift ±10 %, Home/End 4/96 % (§6). Returns true when handled. */
  onKey(e: { key: string; shiftKey: boolean; target: EventTarget | null }): boolean {
    if (!(e.target instanceof HTMLElement) || !('ccCard' in e.target.dataset)) return false;
    const k = Number(e.target.dataset.ccK);
    const item = this.cases[k % this.cases.length];
    if (!item || !baSlidable(item)) return false;
    const key = cardKey(k);
    const cur = this.getPos(key);
    const step = e.shiftKey ? 10 : 5;
    let next: number;
    switch (e.key) {
      case 'ArrowLeft':
        next = cur - step;
        break;
      case 'ArrowRight':
        next = cur + step;
        break;
      case 'Home':
        next = POS_MIN;
        break;
      case 'End':
        next = POS_MAX;
        break;
      default:
        return false;
    }
    this.setBaFlag(key, 'resetting', false);
    this.setBaFlag(key, 'hint', false);
    this.setPos(key, clamp(next, POS_MIN, POS_MAX));
    return true;
  }

  // ---------- before / after registry ----------

  /** Ref-callback helper: registers a B/A media root; returns the cleanup. */
  registerBa(key: string, el: HTMLElement): () => void {
    let set = this.baEls.get(key);
    if (!set) {
      set = new Set();
      this.baEls.set(key, set);
    }
    set.add(el);
    this.writePos(el, this.getPos(key));
    return () => {
      set.delete(el);
      if (set.size === 0 && this.baEls.get(key) === set) this.baEls.delete(key);
    };
  }

  getPos(key: string): number {
    return this.pos.get(key) ?? 50;
  }

  private setPos(key: string, pos: number) {
    const rounded = Math.round(pos * 10) / 10;
    this.pos.set(key, rounded);
    for (const el of this.baEls.get(key) ?? []) this.writePos(el, rounded);
  }

  private writePos(el: HTMLElement, pos: number) {
    el.style.setProperty('--pos', `${pos}%`);
    // N2-6: the focusable strip card itself is the slider (the lifted clone is aria-hidden).
    const slider = el.closest('[data-cc-card][role="slider"]');
    if (slider) {
      const n = Math.round(pos);
      slider.setAttribute('aria-valuenow', String(n));
      slider.setAttribute('aria-valuetext', `До ${n}%, после ${100 - n}%`);
    }
  }

  /** State flags live in data-attributes React never renders, so re-renders can't clobber them. */
  private setBaFlag(key: string, flag: 'dragging' | 'resetting' | 'hint', on: boolean, onlyIn?: HTMLElement) {
    for (const el of this.baEls.get(key) ?? []) {
      if (onlyIn && !onlyIn.contains(el)) continue;
      if (on) el.dataset[flag] = '';
      else delete el.dataset[flag];
    }
  }

  /** §6: after the card is left, the divider eases back to 50 % (600 ms delay, 500 ms). */
  private resetPos(key: string) {
    if (this.getPos(key) === 50) return;
    clearTimeout(this.resetTimers.get(key));
    if (this.rm) {
      this.setPos(key, 50);
      return;
    }
    this.setBaFlag(key, 'resetting', true);
    this.setPos(key, 50);
    this.resetTimers.set(
      key,
      window.setTimeout(() => {
        this.resetTimers.delete(key);
        this.setBaFlag(key, 'resetting', false);
      }, T.posReset),
    );
  }

  // ---------- lifts ----------

  private activate(k: number, reason: Reason, immediate = false): Lift {
    let lift = this.lifts.get(k);
    if (lift && lift.phase !== 'leaving') {
      lift.reasons.add(reason);
      if (reason === 'focus' && !lift.focus) {
        lift.focus = true;
        this.emit();
      }
      if (immediate && lift.phase === 'pending') {
        if (lift.el) this.commit(lift);
        else lift.commitOnAttach = true;
      }
      return lift;
    }

    // One lifted card at a time.
    for (const other of [...this.lifts.values()]) {
      if (other !== lift && other.phase !== 'leaving') this.deactivate(other);
    }

    if (lift) {
      // Revive a card that is still settling down: no rebuild, no flicker.
      clearTimeout(lift.timer);
      lift.phase = 'on';
      lift.reasons = new Set([reason]);
      lift.focus = reason === 'focus';
      this.emitFocus(lift);
      this.emit();
      this.updateMotion();
      return lift;
    }

    const item = this.cases[k % this.cases.length];
    lift = {
      id: this.nextId++,
      k,
      item,
      mediaCaseId: item.id,
      phase: 'pending',
      reasons: new Set([reason]),
      focus: reason === 'focus',
      timer: 0,
      el: null,
      commitOnAttach: immediate || this.rm,
      decodeStarted: false,
    };
    this.lifts.set(k, lift);
    this.liftById.set(lift.id, lift);
    this.emit();
    this.updateMotion();
    return lift;
  }

  /** Ref callback of <LiftedCard>: place it, then reveal once its images are decoded. */
  attachLift(id: number, el: HTMLElement | null) {
    const lift = this.liftById.get(id);
    if (!lift || lift.el === el) return;
    lift.el = el;
    if (!el) {
      this.motion.lifts.delete(id);
      return;
    }
    const placed = { el, k: lift.k };
    this.motion.lifts.set(id, placed);
    this.motion.place(placed);
    if (lift.phase !== 'pending') return;
    void el.offsetWidth; // flush the hidden resting state so pending → on transitions
    if (lift.commitOnAttach || this.rm) {
      this.commit(lift);
      return;
    }
    if (lift.decodeStarted) return;
    lift.decodeStarted = true;
    // Swap only once the clone's images are decoded, so the hand-over is invisible.
    const imgs = [...el.querySelectorAll('img')];
    Promise.race([
      Promise.allSettled(imgs.map((img) => img.decode())),
      new Promise((resolve) => setTimeout(resolve, T.decodeWait)),
    ]).then(() => {
      if (this.liftById.get(id) === lift && lift.phase === 'pending') this.commit(lift);
    });
  }

  private commit(lift: Lift) {
    lift.phase = 'on';
    lift.commitOnAttach = false;
    const media = this.caseById.get(lift.mediaCaseId);
    const dragging = this.drag?.k === lift.k;
    if (media && baSlidable(media) && !this.hinted && !this.rm && !dragging && lift.el) {
      this.hinted = true;
      try {
        sessionStorage.setItem(HINT_KEY, '1');
      } catch {
        /* storage blocked */
      }
      this.setBaFlag(cardKey(lift.k), 'hint', true, lift.el); // first B/A hover per session
    }
    this.emitFocus(lift);
    this.emit(); // same commit hides the strip card and shows the lift: no frame with both/neither
    this.updateMotion();
  }

  private release(k: number, reason: Reason) {
    const lift = this.lifts.get(k);
    if (!lift || lift.phase === 'leaving') return;
    lift.reasons.delete(reason);
    if (reason === 'focus' && lift.focus) {
      lift.focus = false;
      this.emit();
    }
    if (lift.reasons.size === 0) this.deactivate(lift);
    else this.updateMotion();
  }

  private deactivate(lift: Lift) {
    if (lift.phase === 'leaving') return;
    lift.reasons.clear();
    if (lift.phase === 'pending') {
      this.removeLift(lift, true);
      return;
    }
    lift.phase = 'leaving';
    lift.focus = false;
    if (!this.hasActive()) this.onFocusCase(null);
    if (this.rm) {
      this.removeLift(lift, true);
      return;
    }
    lift.timer = window.setTimeout(() => this.removeLift(lift, true), T.leave);
    this.emit();
    this.updateMotion();
  }

  private removeLift(lift: Lift, notify: boolean) {
    clearTimeout(lift.timer);
    if (!this.liftById.has(lift.id)) return;
    const wasShown = lift.phase !== 'pending';
    const wasOn = lift.phase === 'on';
    this.liftById.delete(lift.id);
    if (this.lifts.get(lift.k) === lift) this.lifts.delete(lift.k);
    this.motion.lifts.delete(lift.id);
    for (const key of [...this.pos.keys()]) if (key.startsWith(`lift:${lift.id}:`)) this.pos.delete(key);
    if (wasOn && !this.hasActive()) this.onFocusCase(null);
    if (!notify) return;
    if (wasShown) this.resetPos(cardKey(lift.k));
    this.emit();
    this.updateMotion();
    this.motion.kick();
  }

  /** §5.3: hovering a thumbnail cross-fades the lifted card to that case. */
  private swapMedia(lift: Lift, caseId: string) {
    if (lift.mediaCaseId === caseId || !this.caseById.has(caseId)) return;
    lift.mediaCaseId = caseId;
    this.emitFocus(lift);
    this.emit();
  }

  private hasActive() {
    for (const lift of this.lifts.values()) if (lift.phase !== 'leaving') return true;
    return false;
  }

  private emitFocus(lift: Lift) {
    const media = this.caseById.get(lift.mediaCaseId) ?? lift.item;
    this.onFocusCase({ caseId: media.id, doctorId: media.doctorId });
  }

  /** Hold while the pointer is on a card / lift, a card is lifted or focused, or a drag is live. */
  private updateMotion() {
    this.motion.setHold(this.pointerInside || this.focusK !== null || this.drag !== null || this.hasActive());
  }
}
