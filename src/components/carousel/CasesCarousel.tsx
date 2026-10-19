// FE-2 — cases carousel: endless L→R strip, hover/focus lift with doctor panel (portalled above the
// text), video cases, before/after slider, surgeon emphasis. Spec: docs/design-spec.md §4, §5, §6,
// §9.3–9.4, §9.7. Rendered inside .hero__layer.hero__carousel (stage px, scaled with the stage).
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { getCasesByDoctor, getDoctor } from '../../data/hero';
import { useHero } from '../hero/HeroContext';
import { CarouselContext } from './CarouselContext';
import { CarouselGrid } from './CarouselGrid';
import { CaseCard } from './CaseCard';
import { CarouselController } from './controller';
import { LiftedCard } from './LiftedCard';
import { GEOM, T } from './geometry';
import { StripMotion } from './motion';
import './carousel.css';

export function CasesCarousel() {
  const { data, stage, reducedMotion, selectedDoctorId, setFocusedCase, overlayEl, reveal, surgeonMenuOpen } = useHero();
  const cases = data.cases;
  const [ctrl] = useState(() => new CarouselController(cases, stage.width, reducedMotion));
  const snap = useSyncExternalStore(ctrl.subscribe, ctrl.getSnapshot, ctrl.getSnapshot);
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    ctrl.onFocusCase = setFocusedCase;
    return () => setFocusedCase(null);
  }, [ctrl, setFocusedCase]);

  useLayoutEffect(() => ctrl.setStage(stage.width, stage.scale), [ctrl, stage.width, stage.scale]);
  useEffect(() => ctrl.setReducedMotion(reducedMotion), [ctrl, reducedMotion]);
  useEffect(() => ctrl.setMenuOpen(surgeonMenuOpen), [ctrl, surgeonMenuOpen]);

  useLayoutEffect(() => {
    if (!rootRef.current || !trackRef.current) return;
    return ctrl.connect(rootRef.current, trackRef.current);
  }, [ctrl]);

  // Intro: cards join the hero reveal (§9.5); fallback if the reveal never starts.
  useEffect(() => {
    if (reducedMotion) {
      ctrl.runIntro(0);
      return;
    }
    if (reveal.startedAt !== null) {
      ctrl.runIntro(Math.max(0, performance.now() - reveal.startedAt));
      return;
    }
    const timer = window.setTimeout(() => ctrl.runIntro(0), T.introFallback);
    return () => clearTimeout(timer);
  }, [ctrl, reducedMotion, reveal.startedAt]);

  const doctors = useMemo(() => new Map(cases.map((c) => [c.doctorId, getDoctor(c.doctorId)])), [cases]);
  const casesByDoctor = useMemo(() => new Map(cases.map((c) => [c.doctorId, getCasesByDoctor(c.doctorId)])), [cases]);

  // m-5: a surgeon with no cases in the strip must not dim everything.
  const filter = selectedDoctorId && casesByDoctor.get(selectedDoctorId)?.length ? selectedDoctorId : null;

  const copies = StripMotion.copiesFor(stage.width, ctrl.motion.P);
  const N = cases.length;
  const cards = [];
  for (let k = 0; k < copies * N; k += 1) {
    const item = cases[k % N];
    cards.push(
      <CaseCard
        key={k}
        k={k}
        item={item}
        doctor={doctors.get(item.doctorId)}
        primary={Math.floor(k / N) === 1}
        lifted={snap.hidden.has(k)}
        dim={filter !== null && item.doctorId !== filter}
        match={filter !== null && item.doctorId === filter}
      />,
    );
  }

  const handlers = {
    onPointerOver: (e: PointerEvent) => ctrl.onOver(e.target),
    onPointerOut: (e: PointerEvent) => ctrl.onOut(e.target, e.relatedTarget),
    onPointerDown: (e: PointerEvent) => {
      if (ctrl.onDown(e)) e.preventDefault();
    },
    onPointerMove: (e: PointerEvent) => ctrl.onMove(e),
    onPointerUp: (e: PointerEvent) => ctrl.onUp(e),
    onPointerCancel: (e: PointerEvent) => ctrl.onUp(e),
    onLostPointerCapture: (e: PointerEvent) => ctrl.onUp(e),
    // No focus-on-click, text selection or native image drag inside cards (links still work).
    onMouseDown: (e: MouseEvent) => {
      const t = e.target as Element;
      if (t.closest?.('[data-cc-k]') && !t.closest('a')) e.preventDefault();
    },
    onDragStart: (e: MouseEvent) => e.preventDefault(),
    onFocus: (e: FocusEvent) => ctrl.onFocusIn(e.target),
    onBlur: (e: FocusEvent) => ctrl.onFocusOut(e.target, e.relatedTarget),
    onKeyDown: (e: KeyboardEvent) => {
      if (ctrl.onKey(e)) e.preventDefault();
    },
  };

  return (
    <CarouselContext.Provider value={ctrl}>
      <div
        ref={rootRef}
        role="region"
        aria-label="Кейсы пациентов"
        data-intro={snap.intro}
        className="cc-root pointer-events-none absolute inset-0 overflow-clip"
        {...handlers}
      >
        <CarouselGrid width={stage.width} />
        <div
          ref={trackRef}
          className="absolute left-0 h-[220px] will-change-transform"
          style={{ top: GEOM.TOP, width: copies * ctrl.motion.P }}
        >
          {cards}
        </div>
        {overlayEl &&
          snap.lifts.map((view) => {
            const item = cases[view.k % N];
            return createPortal(
              <LiftedCard
                key={view.id}
                view={view}
                item={item}
                doctor={doctors.get(item.doctorId)}
                doctorCases={casesByDoctor.get(item.doctorId) ?? []}
                reducedMotion={reducedMotion}
              />,
              overlayEl,
              `cc-lift-${view.id}`,
            );
          })}
      </div>
    </CarouselContext.Provider>
  );
}
