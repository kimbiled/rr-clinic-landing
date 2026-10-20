// The hovered/focused card re-rendered above the text: portalled into the hero overlay (z 7).
// Its translate3d is written by StripMotion every frame (same model as the strip → no drift);
// the rise (−16 px), shadow, dim hand-over and panel reveal are CSS transitions keyed off
// data-phase = pending | on | leaving (carousel.css).
import { useCallback, useEffect, useState } from 'react';
import type { Case, Doctor } from '../../data/types';
import { CaseMedia } from './CaseCard';
import { useCarousel } from './CarouselContext';
import { liftMediaKey, type LiftView } from './controller';
import { DoctorPanel } from './DoctorPanel';
import { T, cardKey } from './geometry';

interface Props {
  view: LiftView;
  item: Case;
  doctor: Doctor | undefined;
  reducedMotion: boolean;
}

interface Layer {
  caseId: string;
  entering: boolean;
}

/** §5.3 thumb swap: the new case cross-fades in over 200 ms, the old layer is dropped afterwards. */
function useLayers(mediaCaseId: string, reducedMotion: boolean): Layer[] {
  const [layers, setLayers] = useState<Layer[]>([{ caseId: mediaCaseId, entering: false }]);
  const top = layers[layers.length - 1];

  useEffect(() => {
    if (top.caseId === mediaCaseId) return;
    if (reducedMotion) {
      setLayers([{ caseId: mediaCaseId, entering: false }]);
      return;
    }
    setLayers((prev) => [...prev.filter((l) => l.caseId !== mediaCaseId), { caseId: mediaCaseId, entering: true }]);
  }, [mediaCaseId, reducedMotion, top.caseId]);

  useEffect(() => {
    if (!top.entering) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setLayers((prev) => prev.map((l) => (l === top ? { ...l, entering: false } : l))));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [top]);

  useEffect(() => {
    if (layers.length < 2 || top.entering) return;
    const timer = window.setTimeout(() => setLayers((prev) => prev.slice(-1)), T.swap + 60);
    return () => clearTimeout(timer);
  }, [layers.length, top]);

  return layers;
}

export function LiftedCard({ view, item, doctor, reducedMotion }: Props) {
  const ctrl = useCarousel();
  const { id, k, phase, focus, mediaCaseId } = view;
  const attach = useCallback(
    (el: HTMLDivElement | null) => {
      ctrl.attachLift(id, el);
      return () => ctrl.attachLift(id, null);
    },
    [ctrl, id],
  );
  const layers = useLayers(mediaCaseId, reducedMotion);
  const mediaItem = ctrl.caseById.get(mediaCaseId) ?? item;

  return (
    <div
      ref={attach}
      data-cc-k={k}
      data-cc-lift=""
      data-phase={phase}
      data-focus={focus ? '' : undefined}
      data-case={item.id}
      aria-hidden="true"
      className="cc-lift absolute left-0 top-0 h-[220px] w-[200px] select-none will-change-transform data-[phase=leaving]:pointer-events-none data-[phase=pending]:pointer-events-none data-[phase=pending]:invisible"
    >
      <div className="cc-lift__body relative w-[200px]">
        <div className="cc-lift__shadow" aria-hidden="true" />
        {/* Figma hover card: glass frame (10 px around the photo) carrying the lit contour + info. */}
        <div className="cc-lift__frame" aria-hidden="true" />
        <div className="cc-lift__media relative h-[220px] w-[200px] overflow-hidden bg-[#4a3624]">
          {layers.map((layer) => {
            const c = ctrl.caseById.get(layer.caseId) ?? item;
            const own = layer.caseId === item.id;
            return (
              <div
                key={layer.caseId}
                data-entering={layer.entering ? '' : undefined}
                className="cc-lift__layer absolute inset-0"
              >
                <CaseMedia
                  item={c}
                  baKey={own ? cardKey(k) : liftMediaKey(id, layer.caseId)}
                  eager
                  interactive
                  active={phase === 'on' && layer.caseId === mediaCaseId}
                  reducedMotion={reducedMotion}
                />
              </div>
            );
          })}
          {/* QA P-1: the strip card sits under .hero__shade (vignette + bottom fade + blurred glow);
              the overlay clone doesn't. Replay that exact layer at the card's stage position (lead's
              own classes, so it tracks their CSS), then fade it out with the rise. */}
          <div className="cc-lift__dim" aria-hidden="true">
            <div className="hero__shade cc-lift__shade">
              <div className="hero__glow" />
            </div>
          </div>
        </div>
        <DoctorPanel item={mediaItem} doctor={doctor} />
        <div className="cc-lift__ring" aria-hidden="true" />
      </div>
    </div>
  );
}
