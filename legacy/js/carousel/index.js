// FE-2 — cases carousel: endless strip, hover/focus lift with doctor panel, video cases,
// before/after slider, surgeon filter. Spec: docs/design-spec.md §4, §5, §6, §9.3–9.4, §9.7.
//
// Layering: the strip lives in [data-carousel] (z 2, below statue + text). Its moving track is a
// stacking context, so a z-index on a card cannot lift it over the headline. Instead the active
// card is re-rendered as a "lift" (a clone of its media + the info panel) inside
// [data-hero-overlay] (z 7, above the text), positioned from the same strip model every frame,
// while the original is hidden (opacity 0, which keeps keyboard focus on it).

import { getCases, getDoctor } from '../data/hero-data.js';
import { GEOM, buildCard, buildGrid, buildMedia, buildPanel, h } from './render.js';

const SPEED = 40; // px/s, FIGMA annotation 1716:4724
const IDLE_FIRST_X = -40; // card 1 position in frame 1713:3971
const RM_FIRST_X = 24; // §9.3 reduced motion
const EDGE = 24; // keep keyboard-focused cards this far inside the viewport

const T = {
  decel: 400, // hover: 40 → 0
  accel: 700, // resume: 0 → 40
  resumeDelay: 250,
  intent: 80, // ignore pass-through hovers shorter than this
  leave: 360, // panel 220 + card down 280 from +80
  focusScroll: 520,
  swap: 200,
  video: 120,
  introAt: 300,
  introStep: 60,
  rampAt: 900,
  ramp: 800,
  introFallback: 2500,
  posReset: 1150, // 600 delay + 500 ease + margin
};

const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** @param {{ root: HTMLElement, data: any, reducedMotion: boolean, emit: Function, on: Function }} ctx */
export async function init(ctx) {
  const mount = ctx.root?.querySelector('[data-carousel]');
  const overlay = ctx.root?.querySelector('[data-hero-overlay]');
  if (!mount || !overlay) throw new Error('[carousel] [data-carousel] / [data-hero-overlay] not found');
  if (!ctx.data?.cases?.length) return null;

  const strip = new CaseStrip(ctx, mount, overlay);
  strip.start();
  return strip;
}

class CaseStrip {
  constructor(ctx, mount, overlay) {
    this.ctx = ctx;
    this.root = ctx.root;
    this.mount = mount;
    this.overlay = overlay;

    this.cases = getCases(ctx.data);
    this.N = this.cases.length;
    this.P = this.N * GEOM.PITCH; // loop period
    this.caseById = new Map(this.cases.map((c) => [c.id, c]));

    this.cards = [];
    this.copies = 0;
    this.vw = 0;
    this.x = 0; // track translateX; normal range [-2P, -P) so copy #1 (focusable) starts in [-P, 0)
    this.vel = { from: 0, to: 0, t0: 0, dur: 1, ease: easeOutCubic };
    this.xTween = null;
    this.holding = false;
    this.introStarted = false;

    this.lifts = new Map(); // original card → lift
    this.liftOfEl = new WeakMap();
    this.pointerCard = null;
    this.pointerInside = false;
    this.intent = { card: null, timer: 0 };
    this.focusCard = null;
    this.drag = null;
    this.filter = null;

    this.videos = new Map(); // caseId → <video>, created lazily on first hover
    this.playing = null;
    this.resetTimers = new WeakMap();

    this.visible = true;
    this.raf = 0;
    this.lastT = 0;
    this.resizeRaf = 0;

    try {
      this.hinted = sessionStorage.getItem('rr-cc-hint') === '1';
    } catch {
      this.hinted = false;
    }

    this.step = this.step.bind(this);
  }

  get rm() {
    return Boolean(this.ctx.reducedMotion);
  }

  // ---------- setup ----------

  start() {
    const { mount } = this;
    mount.classList.add('cc');
    mount.setAttribute('role', 'region');
    mount.setAttribute('aria-label', 'Кейсы пациентов');
    this.overlay.classList.add('cc-overlay');

    this.vw = this.root.clientWidth || window.innerWidth;
    this.x = this.wrap((this.rm ? RM_FIRST_X : IDLE_FIRST_X) + (this.vw - GEOM.DESIGN_W) / 2 - this.P);

    this.track = h('div', 'cc-track');
    this.grid = buildGrid(this.vw);
    this.buildTrack();
    mount.replaceChildren(this.grid, this.track);
    this.render();

    this.bind();
    this.setupIntro();
  }

  buildTrack() {
    const copies = Math.ceil(this.vw / this.P) + 2;
    const cards = [];
    for (let copy = 0; copy < copies; copy += 1) {
      this.cases.forEach((item, i) => {
        const k = copy * this.N + i;
        const left = this.x + k * GEOM.PITCH;
        const card = buildCard(item, getDoctor(this.ctx.data, item.doctorId), {
          k,
          primary: copy === 1,
          eager: left > -GEOM.W && left < this.vw,
        });
        if (this.filter && item.doctorId !== this.filter) card.classList.add('is-dim');
        cards.push(card);
      });
    }
    this.copies = copies;
    this.cards = cards;
    this.track.style.width = `${copies * this.P}px`;
    this.track.replaceChildren(...cards);
  }

  bind() {
    const { mount, overlay } = this;
    for (const layer of [mount, overlay]) {
      layer.addEventListener('pointerover', (e) => this.onOver(e));
      layer.addEventListener('pointerout', (e) => this.onOut(e));
      layer.addEventListener('pointerdown', (e) => this.onDown(e));
    }
    overlay.addEventListener('pointermove', (e) => this.onMove(e));
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      overlay.addEventListener(type, (e) => this.onUp(e));
    }
    // No focus-on-click and no text selection / native image drag inside cards.
    mount.addEventListener('mousedown', (e) => {
      if (e.target.closest?.('.cc-card')) e.preventDefault();
    });
    overlay.addEventListener('mousedown', (e) => {
      if (e.target.closest?.('.cc-lift') && !e.target.closest('a')) e.preventDefault();
    });
    overlay.addEventListener('dragstart', (e) => e.preventDefault());

    mount.addEventListener('focusin', (e) => this.onFocusIn(e));
    mount.addEventListener('focusout', (e) => this.onFocusOut(e));
    mount.addEventListener('keydown', (e) => this.onKey(e));

    window.addEventListener('resize', () => {
      if (this.resizeRaf) return;
      this.resizeRaf = requestAnimationFrame(() => {
        this.resizeRaf = 0;
        this.relayout();
      });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stopLoop();
      else this.kick();
    });
    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.visible) this.kick();
        else this.stopLoop();
      });
      this.io.observe(this.root);
    }

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener?.('change', () => {
      if (this.rm) {
        this.xTween = null;
        this.stopLoop();
      } else if (!this.holding && this.introStarted) {
        this.setVelocity(SPEED, T.accel, easeInOutSine);
      }
    });

    this.ctx.on('surgeon:select', (detail) => this.applyFilter(detail?.doctorId ?? null));
  }

  /** Cards fade in with the hero reveal (§9.5), then the strip ramps 0 → 40 px/s. */
  setupIntro() {
    let fallback = 0;
    const offs = [];
    const run = () => {
      if (this.introStarted) return;
      this.introStarted = true;
      clearTimeout(fallback);
      offs.forEach((off) => off());
      this.mount.classList.remove('is-intro-wait');
      if (this.rm) return;

      let order = 0;
      for (const card of this.cards) {
        const left = this.x + Number(card.dataset.k) * GEOM.PITCH;
        if (left > -GEOM.W && left < this.vw) {
          card.style.animationDelay = `${T.introAt + T.introStep * order}ms`;
          order += 1;
        }
      }
      this.mount.classList.add('is-intro');
      setTimeout(() => {
        this.mount.classList.remove('is-intro');
        for (const card of this.cards) card.style.animationDelay = '';
      }, T.introAt + T.introStep * order + 700);

      if (!this.holding) this.setVelocity(SPEED, T.ramp, easeInOutSine, T.rampAt);
    };

    // hero.js removes `js-reveal` from <html> when its reveal starts (or when it is skipped).
    const pending = document.documentElement.classList.contains('js-reveal') && !this.rm;
    if (!pending) {
      run();
      return;
    }
    this.mount.classList.add('is-intro-wait');
    offs.push(this.ctx.on('hero:reveal', run), this.ctx.on('hero:revealed', run));
    fallback = setTimeout(run, T.introFallback);
  }

  relayout() {
    const vw = this.root.clientWidth;
    if (!vw || vw === this.vw) return;
    this.vw = vw;
    this.cancelIntent();
    for (const lift of [...this.lifts.values()]) this.removeLift(lift);
    this.pointerCard = null;
    if (Math.ceil(vw / this.P) + 2 !== this.copies) this.buildTrack();
    const grid = buildGrid(vw);
    this.grid.replaceWith(grid);
    this.grid = grid;
    this.render();
    this.updateMotion();
  }

  // ---------- motion model ----------

  wrap(x) {
    const { P } = this;
    return -2 * P + ((((x + 2 * P) % P) + P) % P);
  }

  canWrap() {
    return this.lifts.size === 0 && !this.focusCard && !this.drag;
  }

  velocityAt(now) {
    const v = this.vel;
    if (now <= v.t0) return v.from;
    const p = Math.min(1, (now - v.t0) / v.dur);
    return v.from + (v.to - v.from) * v.ease(p);
  }

  setVelocity(to, dur, ease, delay = 0) {
    const now = performance.now();
    this.vel = { from: this.velocityAt(now), to, t0: now + delay, dur, ease };
    this.kick();
  }

  moving(now) {
    if (this.xTween) return true;
    if (this.rm) return false;
    const v = this.vel;
    return !(v.to === 0 && now >= v.t0 + v.dur);
  }

  running() {
    return this.visible && !document.hidden;
  }

  kick() {
    if (this.raf || !this.running()) return;
    const now = performance.now();
    if (!this.moving(now)) return;
    this.lastT = now;
    this.raf = requestAnimationFrame(this.step);
  }

  stopLoop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  step(now) {
    this.raf = 0;
    const dt = clamp((now - this.lastT) / 1000, 0, 0.1); // time-based; clamp long frames
    this.lastT = now;

    if (this.xTween) {
      const tw = this.xTween;
      const p = clamp((now - tw.t0) / tw.dur, 0, 1);
      this.x = tw.from + (tw.to - tw.from) * easeOutCubic(p);
      if (p >= 1) this.xTween = null;
    } else if (!this.rm) {
      this.x += this.velocityAt(now) * dt;
      if (this.canWrap()) this.x = this.wrap(this.x);
    }

    const keepGoing = this.running() && this.moving(now);
    if (!keepGoing) this.x = Math.round(this.x); // settle on whole pixels when stopped
    this.render();
    if (keepGoing) this.raf = requestAnimationFrame(this.step);
  }

  /** Writes only — positions come from the model, never from layout reads. */
  render() {
    this.track.style.transform = `translate3d(${this.x}px,0,0)`;
    for (const lift of this.lifts.values()) this.placeLift(lift);
  }

  placeLift(lift) {
    lift.el.style.transform = `translate3d(${this.x + lift.k * GEOM.PITCH}px,${GEOM.TOP}px,0)`;
  }

  hasActive() {
    for (const lift of this.lifts.values()) if (lift.state !== 'leaving') return true;
    return false;
  }

  /** Pause while the pointer is on a card / lift, a card is lifted or focused, or a drag is live. */
  updateMotion() {
    const hold = this.pointerInside || this.focusCard !== null || this.drag !== null || this.hasActive();
    if (hold === this.holding) return;
    this.holding = hold;
    if (!this.introStarted) return;
    if (hold) this.setVelocity(0, T.decel, easeOutCubic);
    else this.setVelocity(SPEED, T.accel, easeInOutSine, T.resumeDelay);
  }

  /** Keyboard focus: glide the strip so the focused card is fully on screen. */
  ensureVisible(card) {
    const c = this.x + Number(card.dataset.k) * GEOM.PITCH;
    const d = clamp(c, EDGE, this.vw - GEOM.W - EDGE);
    if (Math.abs(d - c) < 0.5) return;
    const to = this.x + (d - c);
    if (this.rm) {
      this.x = to;
      this.render();
      return;
    }
    this.xTween = { from: this.x, to, t0: performance.now(), dur: T.focusScroll };
    this.kick();
  }

  // ---------- pointer ----------

  cardOf(node) {
    if (!node || typeof node.closest !== 'function') return null;
    const liftEl = node.closest('.cc-lift');
    if (liftEl) return this.liftOfEl.get(liftEl)?.card ?? null;
    const card = node.closest('.cc-card');
    return card && this.track.contains(card) ? card : null;
  }

  onOver(e) {
    const card = this.cardOf(e.target);
    if (!card) return;
    if (!this.pointerInside) {
      this.pointerInside = true;
      this.updateMotion();
    }
    if (this.drag) return;
    const thumb = e.target.closest('[data-thumb]');
    if (thumb) {
      const lift = this.lifts.get(card);
      if (lift?.state === 'on') this.swapMedia(lift, thumb.dataset.thumb);
    }
    this.hoverCard(card);
  }

  hoverCard(card) {
    if (this.pointerCard === card) return;
    this.pointerCard = card;
    const lift = this.lifts.get(card);
    if (lift && lift.state !== 'leaving') {
      lift.reasons.add('pointer');
      return;
    }
    this.cancelIntent();
    this.intent.card = card;
    this.intent.timer = setTimeout(() => {
      this.intent.card = null;
      if (this.pointerCard === card) this.activate(card, 'pointer');
    }, lift ? 0 : T.intent); // re-entering a card that is still settling revives it at once
  }

  cancelIntent() {
    clearTimeout(this.intent.timer);
    this.intent.card = null;
  }

  onOut(e) {
    if (this.drag) return; // pointer is captured; drag end decides
    const from = this.cardOf(e.target);
    const to = this.cardOf(e.relatedTarget);
    if (from === to) return;
    if (from) {
      if (this.pointerCard === from) this.pointerCard = null;
      if (this.intent.card === from) this.cancelIntent();
      this.release(from, 'pointer');
    }
    if (!to && this.pointerInside) {
      this.pointerInside = false;
      if (this.focusCard && !this.lifts.has(this.focusCard)) this.activate(this.focusCard, 'focus');
      this.updateMotion();
    }
  }

  onDown(e) {
    if (e.button !== 0) return;
    if (e.target.closest?.('.cc-panel')) return; // panel: links/thumbs, no drag
    const card = this.cardOf(e.target);
    if (!card) return;
    this.cancelIntent();
    this.pointerCard = card;
    this.pointerInside = true;
    const lift = this.activate(card, 'pointer', { immediate: true });
    const ba = lift?.media.classList.contains('cc-ba') ? lift.media : null;
    if (!ba) {
      this.updateMotion();
      return;
    }
    e.preventDefault();
    try {
      ba.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
    this.drag = { lift, ba, id: e.pointerId, originX: this.root.getBoundingClientRect().left };
    ba.classList.remove('is-hint', 'is-resetting');
    ba.classList.add('is-dragging');
    this.dragTo(e.clientX);
    this.updateMotion();
  }

  onMove(e) {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    this.dragTo(e.clientX);
  }

  dragTo(clientX) {
    const { lift, ba, originX } = this.drag;
    const left = originX + this.x + lift.k * GEOM.PITCH;
    const pos = clamp(((clientX - left) / GEOM.W) * 100, 0, 100);
    this.setPos(ba, pos);
    if (lift.mediaCase === lift.item) {
      const orig = lift.card.querySelector('.cc-ba');
      if (orig) this.setPos(orig, pos);
    }
  }

  onUp(e) {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    const { lift, ba } = this.drag;
    ba.classList.remove('is-dragging');
    this.drag = null;
    try {
      if (ba.hasPointerCapture(e.pointerId)) ba.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    // Released outside the lifted card → behave like a normal pointer leave.
    const under = e.type === 'pointerup' ? document.elementFromPoint(e.clientX, e.clientY) : null;
    const to = this.cardOf(under);
    if (to !== lift.card) {
      if (this.pointerCard === lift.card) this.pointerCard = null;
      this.release(lift.card, 'pointer');
      this.pointerInside = Boolean(to);
      if (to) this.hoverCard(to);
    }
    this.updateMotion();
  }

  // ---------- keyboard ----------

  onFocusIn(e) {
    const card = e.target.closest?.('.cc-card');
    if (!card) return;
    // Focus must never scroll the clipped layers.
    if (this.mount.scrollLeft) this.mount.scrollLeft = 0;
    if (this.root.scrollLeft) this.root.scrollLeft = 0;
    let keyboard = true;
    try {
      keyboard = card.matches(':focus-visible');
    } catch {
      /* old engines: treat as keyboard */
    }
    if (!keyboard) return;
    this.focusCard = card;
    this.ensureVisible(card);
    this.activate(card, 'focus');
    this.updateMotion();
  }

  onFocusOut(e) {
    const card = e.target.closest?.('.cc-card');
    if (!card) return;
    if (e.relatedTarget && card.contains(e.relatedTarget)) return;
    if (this.focusCard === card) this.focusCard = null;
    this.release(card, 'focus');
    this.updateMotion();
  }

  onKey(e) {
    const card = e.target.closest?.('.cc-card');
    if (!card || e.target !== card) return;
    const ba = card.querySelector('.cc-ba');
    if (!ba) return;
    const cur = this.getPos(ba);
    const stepPct = e.shiftKey ? 10 : 5;
    let next;
    switch (e.key) {
      case 'ArrowLeft': next = cur - stepPct; break;
      case 'ArrowRight': next = cur + stepPct; break;
      case 'Home': next = 0; break;
      case 'End': next = 100; break;
      default: return;
    }
    e.preventDefault();
    next = clamp(next, 0, 100);
    ba.classList.remove('is-resetting');
    this.setPos(ba, next);
    const lift = this.lifts.get(card);
    if (lift && lift.mediaCase === lift.item && lift.media.classList.contains('cc-ba')) {
      lift.media.classList.remove('is-hint');
      this.setPos(lift.media, next);
    }
  }

  // ---------- before / after ----------

  getPos(ba) {
    const v = parseFloat(ba.style.getPropertyValue('--pos'));
    return Number.isFinite(v) ? v : 50;
  }

  setPos(ba, pos) {
    const rounded = Math.round(pos * 10) / 10;
    ba.style.setProperty('--pos', `${rounded}%`);
    const knob = ba.querySelector('.cc-ba__knob');
    if (knob) {
      const n = Math.round(pos);
      knob.setAttribute('aria-valuenow', String(n));
      knob.setAttribute('aria-valuetext', `До ${n}%, после ${100 - n}%`);
    }
  }

  /** §6: after the card is left, the divider eases back to 50% (600 ms delay, 500 ms). */
  resetPos(card) {
    const ba = card.querySelector('.cc-ba');
    if (!ba || this.getPos(ba) === 50) return;
    clearTimeout(this.resetTimers.get(ba));
    if (this.rm) {
      this.setPos(ba, 50);
      return;
    }
    ba.classList.add('is-resetting');
    this.setPos(ba, 50);
    this.resetTimers.set(ba, setTimeout(() => ba.classList.remove('is-resetting'), T.posReset));
  }

  // ---------- lift (portal into the overlay layer) ----------

  activate(card, reason, { immediate = false } = {}) {
    let lift = this.lifts.get(card);
    if (lift && lift.state !== 'leaving') {
      lift.reasons.add(reason);
      if (reason === 'focus') lift.el.classList.add('is-focus');
      if (immediate && lift.state === 'pending') this.commit(lift);
      return lift;
    }

    // One lifted card at a time.
    for (const other of [...this.lifts.values()]) {
      if (other !== lift && other.state !== 'leaving') this.deactivate(other);
    }

    if (lift) {
      // Revive a card that is still settling down: no rebuild, no flicker.
      clearTimeout(lift.timer);
      lift.state = 'on';
      lift.reasons = new Set([reason]);
      lift.el.classList.remove('is-leaving');
      lift.el.classList.add('is-on');
      lift.el.classList.toggle('is-focus', reason === 'focus');
      this.mediaEnter(lift);
      this.emitFocus(lift);
      this.updateMotion();
      return lift;
    }

    lift = this.createLift(card);
    lift.reasons.add(reason);
    if (reason === 'focus') lift.el.classList.add('is-focus');
    this.lifts.set(card, lift);

    if (immediate || this.rm) {
      this.commit(lift);
    } else {
      // Swap only once the clone's images are decoded, so the hand-over is invisible.
      const imgs = [...lift.media.querySelectorAll('img')];
      Promise.race([
        Promise.allSettled(imgs.map((i) => (i.decode ? i.decode() : Promise.resolve()))),
        new Promise((resolve) => setTimeout(resolve, 150)),
      ]).then(() => {
        if (this.lifts.get(card) === lift && lift.state === 'pending') this.commit(lift);
      });
    }
    this.updateMotion();
    return lift;
  }

  createLift(card) {
    const item = this.caseById.get(card.dataset.case);
    const doctor = getDoctor(this.ctx.data, item.doctorId);
    const media = card.querySelector('.cc-media').cloneNode(true);
    media.classList.remove('is-playing', 'is-resetting', 'is-dragging', 'is-hint');
    for (const image of media.querySelectorAll('img')) image.loading = 'eager';
    media.querySelector('.cc-ba__knob')?.removeAttribute('role');

    const layer = h('div', 'cc-lift__layer', null, [media]);
    const mediaWrap = h('div', 'cc-lift__media', null, [layer]);
    const panel = buildPanel(item, doctor, item.doctorId ? getCases(this.ctx.data, item.doctorId) : []);
    const shadow = h('div', 'cc-lift__shadow', { 'aria-hidden': 'true' });
    const body = h('div', 'cc-lift__body', null, [shadow, mediaWrap, panel]);
    const el = h('div', 'cc-lift is-pending', { 'aria-hidden': 'true', 'data-case': item.id }, [body]);

    const lift = {
      card,
      k: Number(card.dataset.k),
      item,
      doctor,
      el,
      mediaWrap,
      panel,
      media,
      mediaCase: item,
      state: 'pending',
      reasons: new Set(),
      timer: 0,
      videoTimer: 0,
    };
    this.liftOfEl.set(el, lift);
    this.placeLift(lift);
    this.overlay.append(el);

    // One layout read per activation (not per frame): panel height drives the shadow box.
    const panelH = panel.offsetHeight || 82;
    el.style.setProperty('--panel-h', `${panelH}px`);
    el.style.setProperty('--shadow-s', String(GEOM.H / (GEOM.H + panelH)));
    return lift;
  }

  commit(lift) {
    lift.state = 'on';
    lift.el.classList.remove('is-pending');
    lift.card.classList.add('is-lifted'); // same task as the reveal → no frame with both/neither
    if (this.rm) lift.el.classList.add('is-on');
    else {
      requestAnimationFrame(() => {
        if (lift.state === 'on') lift.el.classList.add('is-on');
      });
    }
    this.mediaEnter(lift);
    this.emitFocus(lift);
  }

  release(card, reason) {
    const lift = this.lifts.get(card);
    if (!lift || lift.state === 'leaving') return;
    lift.reasons.delete(reason);
    if (reason === 'focus') lift.el.classList.remove('is-focus');
    if (lift.reasons.size === 0) this.deactivate(lift);
    else this.updateMotion();
  }

  deactivate(lift) {
    if (lift.state === 'leaving') return;
    lift.reasons.clear();
    if (lift.state === 'pending') {
      this.removeLift(lift);
      return;
    }
    lift.state = 'leaving';
    lift.el.classList.remove('is-on', 'is-focus');
    lift.el.classList.add('is-leaving');
    this.mediaLeave(lift);
    if (!this.hasActive()) this.ctx.emit('carousel:blur', {});
    if (this.rm) this.removeLift(lift);
    else lift.timer = setTimeout(() => this.removeLift(lift), T.leave);
    this.updateMotion();
  }

  removeLift(lift) {
    clearTimeout(lift.timer);
    clearTimeout(lift.videoTimer);
    const wasShown = lift.state === 'on' || lift.state === 'leaving';
    if (lift.state === 'on') {
      this.mediaLeave(lift);
      if (!this.hasActiveExcept(lift)) this.ctx.emit('carousel:blur', {});
    }
    lift.state = 'gone';
    lift.el.remove();
    if (this.lifts.get(lift.card) === lift) this.lifts.delete(lift.card);
    lift.card.classList.remove('is-lifted');
    if (wasShown) this.resetPos(lift.card);
    this.updateMotion();
    this.kick();
  }

  hasActiveExcept(skip) {
    for (const lift of this.lifts.values()) if (lift !== skip && lift.state !== 'leaving') return true;
    return false;
  }

  emitFocus(lift) {
    this.ctx.emit('carousel:focus', { caseId: lift.mediaCase.id, doctorId: lift.mediaCase.doctorId ?? null });
  }

  /** §5.3: hovering a thumbnail cross-fades the lifted card to that case. */
  swapMedia(lift, caseId) {
    if (lift.mediaCase.id === caseId) return;
    const item = this.caseById.get(caseId);
    if (!item) return;
    this.mediaLeave(lift);
    const prevLayer = lift.media.parentNode;
    const next = buildMedia(item, { eager: true });
    next.querySelector('.cc-ba__knob')?.removeAttribute('role');
    const layer = h('div', 'cc-lift__layer is-entering', null, [next]);
    lift.mediaWrap.append(layer);
    lift.media = next;
    lift.mediaCase = item;
    const title = lift.panel.querySelector('.cc-panel__title');
    if (title) title.textContent = item.title;
    for (const t of lift.panel.querySelectorAll('[data-thumb]')) {
      t.classList.toggle('is-current', t.dataset.thumb === caseId);
    }
    if (this.rm) {
      layer.classList.remove('is-entering');
      prevLayer?.remove();
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.remove('is-entering')));
      setTimeout(() => prevLayer?.remove(), T.swap + 60);
    }
    this.mediaEnter(lift);
    this.emitFocus(lift);
  }

  // ---------- media (video / hint) ----------

  mediaEnter(lift) {
    const item = lift.mediaCase;
    clearTimeout(lift.videoTimer);
    if (item.type === 'video' && item.video?.src) {
      lift.videoTimer = setTimeout(() => this.playVideo(lift), this.rm ? 0 : T.video);
    }
    if (item.type === 'beforeAfter' && !this.hinted && !this.rm && lift.media.classList.contains('cc-ba')) {
      this.hinted = true;
      try {
        sessionStorage.setItem('rr-cc-hint', '1');
      } catch {
        /* storage blocked */
      }
      lift.media.classList.add('is-hint');
    }
  }

  mediaLeave(lift) {
    clearTimeout(lift.videoTimer);
    const media = lift.media;
    media.classList.remove('is-playing');
    const video = media.querySelector('video');
    if (video) this.stopVideo(video);
  }

  createVideo(item) {
    const video = document.createElement('video');
    video.className = 'cc-vid__video';
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'none';
    for (const attr of ['muted', 'playsinline', 'loop', 'disablepictureinpicture']) video.setAttribute(attr, '');
    video.setAttribute('aria-hidden', 'true');
    video.tabIndex = -1;
    if (item.poster?.src) video.poster = item.poster.src;
    // Lazy: the source is attached on the first hover only.
    if (item.video.type) {
      const source = document.createElement('source');
      source.src = item.video.src;
      source.type = item.video.type;
      video.append(source);
    } else {
      video.src = item.video.src;
    }
    return video;
  }

  playVideo(lift) {
    const item = lift.mediaCase;
    const media = lift.media;
    if (lift.state !== 'on' || !media.isConnected || !item.video?.src) return;

    let video = this.videos.get(item.id);
    if (!video) {
      video = this.createVideo(item);
      this.videos.set(item.id, video);
    }
    if (this.playing && this.playing !== video) this.stopVideo(this.playing); // one video at a time
    if (video.parentNode !== media) media.insertBefore(video, media.querySelector('.cc-shade'));
    this.playing = video;

    video.addEventListener('playing', () => {
      if (this.playing === video && video.parentNode === media && lift.state === 'on') media.classList.add('is-playing');
    }, { once: true });

    let attempt;
    try {
      attempt = video.play();
    } catch (error) {
      attempt = Promise.reject(error);
    }
    Promise.resolve(attempt).catch(() => {
      // Autoplay refused, source missing or interrupted by pause(): keep the poster.
      media.classList.remove('is-playing');
      if (this.playing === video) this.playing = null;
    });
  }

  stopVideo(video) {
    try {
      video.pause();
      if (video.readyState > 0) video.currentTime = 0;
    } catch {
      /* not loaded yet */
    }
    if (this.playing === video) this.playing = null;
  }

  // ---------- surgeon filter ----------

  applyFilter(doctorId) {
    this.filter = doctorId || null;
    for (const card of this.cards) {
      card.classList.toggle('is-dim', Boolean(this.filter) && card.dataset.doctor !== this.filter);
    }
    this.mount.classList.toggle('has-filter', Boolean(this.filter));
  }
}
