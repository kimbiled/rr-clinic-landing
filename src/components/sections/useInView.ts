import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import './reveal.css';

export interface UseInViewOptions {
  /** IntersectionObserver threshold (0–1). Default 0. */
  threshold?: number;
  /** Default: trigger once the element is 12% inside the viewport bottom. */
  rootMargin?: string;
  /** Stop observing after the first hit (default true). */
  once?: boolean;
}

/**
 * Reports whether an element has entered the viewport. Without IntersectionObserver it reports `true`
 * straight away, so content never stays hidden.
 *
 *   const { ref, inView } = useInView<HTMLElement>();
 *   <section ref={ref} {...revealScope(inView)}>
 *     <h2 {...revealItem(0)}>…</h2>
 *     <p {...revealItem(1)}>…</p>
 *   </section>
 */
export function useInView<T extends Element = HTMLElement>({
  threshold = 0,
  rootMargin = '0px 0px -12% 0px',
  once = true,
}: UseInViewOptions = {}): { ref: RefObject<T | null>; inView: boolean } {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        // The first callback fires on observe() with isIntersecting = true for ANY overlap (even edge-adjacent),
        // whatever the threshold — so a non-zero threshold must also be checked against the ratio.
        const hit = entry.isIntersecting && (threshold <= 0 || entry.intersectionRatio >= threshold - 0.001);
        if (hit) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}

/** Props for the reveal container: children marked with `revealItem()` fade/slide in when `inView`. */
export function revealScope(inView: boolean) {
  return { 'data-rv': inView ? 'in' : 'out' } as const;
}

/** Props for one revealed child; `index` sets the stagger step (90 ms each). */
export function revealItem(index: number) {
  return { 'data-rv-item': '', style: { '--rv-i': index } as CSSProperties } as const;
}
