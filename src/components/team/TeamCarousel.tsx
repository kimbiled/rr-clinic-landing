import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { Doctor } from '../../data/types';
import { DoctorCard } from './DoctorCard';

const DRAG_THRESHOLD = 5;

export interface TeamScroller {
  scrollerRef: RefObject<HTMLDivElement | null>;
  listRef: RefObject<HTMLUListElement | null>;
  edges: { start: boolean; end: boolean };
  goTo: (dir: -1 | 1 | 0) => void;
  isEmpty: boolean;
}

/**
 * Scroll state of the doctor row: snap-to-card stepping, edge flags for the ←/→ buttons (which live in
 * the section header, away from the row) and mouse drag-to-scroll.
 */
export function useTeamScroller(doctors: Doctor[], reducedMotion: boolean): TeamScroller {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const drag = useRef({ active: false, moved: false, x: 0, left: 0 });
  const isEmpty = doctors.length === 0;

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    el.scrollLeft = 0;
    measure();
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [measure, doctors]);

  /** Snap positions = each card's left edge relative to the scroller's content start. */
  const snapPoints = useCallback((): number[] => {
    const el = scrollerRef.current;
    const list = listRef.current;
    const first = list?.firstElementChild as HTMLElement | null;
    if (!el || !list || !first) return [];
    const max = el.scrollWidth - el.clientWidth;
    return Array.from(list.children, (c) => Math.min(max, (c as HTMLElement).offsetLeft - first.offsetLeft));
  }, []);

  const goTo = useCallback(
    (dir: -1 | 1 | 0) => {
      const el = scrollerRef.current;
      if (!el) return;
      const points = snapPoints();
      if (!points.length) return;
      const x = el.scrollLeft;
      let nearest = 0;
      points.forEach((p, i) => {
        if (Math.abs(p - x) < Math.abs(points[nearest] - x)) nearest = i;
      });
      const target = points[Math.max(0, Math.min(points.length - 1, nearest + dir))];
      el.scrollTo({ left: target, behavior: reducedMotion ? 'auto' : 'smooth' });
    },
    [reducedMotion, snapPoints],
  );

  // ---- Mouse drag-to-scroll (touch/pen keep native scrolling) ----
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active) return;
      const dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) < DRAG_THRESHOLD) return;
      if (!d.moved) {
        d.moved = true;
        el.classList.add('is-dragging');
      }
      el.scrollLeft = d.left - dx;
    };
    const onUp = () => {
      const d = drag.current;
      if (!d.active) return;
      d.active = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (d.moved) {
        el.classList.remove('is-dragging');
        goTo(0);
        // The click that may follow this pointerup is swallowed by onClickCapture; clear the flag afterwards
        // so a later keyboard "click" on a link is not eaten.
        window.setTimeout(() => {
          d.moved = false;
        }, 0);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag.current = { active: true, moved: false, x: e.clientX, left: el.scrollLeft };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    };
    // A drag must not end in a link click.
    const onClickCapture = (e: MouseEvent) => {
      if (drag.current.moved) {
        e.preventDefault();
        e.stopPropagation();
        drag.current.moved = false;
      }
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('click', onClickCapture, true);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('click', onClickCapture, true);
      onUp();
    };
  }, [goTo, isEmpty]);

  return { scrollerRef, listRef, edges, goTo, isEmpty };
}

interface TeamCarouselProps {
  scroller: TeamScroller;
  doctors: Doctor[];
  label: string;
  inView: boolean;
  onMore?: (doctor: Doctor) => boolean;
  /** Rendered instead of the cards (empty tabs), in the same footprint. */
  empty?: ReactNode;
}

export function TeamCarousel({ scroller, doctors, label, inView, onMore, empty }: TeamCarouselProps) {
  const { scrollerRef, listRef, goTo, isEmpty } = scroller;

  return (
    <div className={`team-carousel ${inView ? 'is-in' : ''}`}>
      {isEmpty ? (
        empty
      ) : (
        <div
          ref={scrollerRef}
          className="team-scroller relative overflow-x-auto overscroll-x-contain"
          role="region"
          aria-roledescription="карусель"
          aria-label={label}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              goTo(1);
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              goTo(-1);
            }
          }}
        >
          <ul ref={listRef} className="flex w-max gap-5">
            {doctors.map((doctor, i) => (
              <DoctorCard key={doctor.id} doctor={doctor} index={i} onMore={onMore} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
