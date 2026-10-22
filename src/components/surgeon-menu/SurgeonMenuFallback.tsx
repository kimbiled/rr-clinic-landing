import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useHero } from '../hero/HeroContext';
import { setPageInert } from './menuTrigger';

/**
 * N2-3: shown at once when the menu is opened before its lazy chunk (antd) has arrived.
 * Same backdrop as the real menu + a spinner; no antd here so it costs nothing on first paint.
 * Esc or a click closes it (the open flag drops, so the menu won't pop up later).
 */
export function SurgeonMenuFallback() {
  const { setSurgeonMenuOpen } = useHero();

  useEffect(() => {
    setPageInert(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSurgeonMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      setPageInert(false);
    };
  }, [setSurgeonMenuOpen]);

  return createPortal(
    <div
      className="fixed inset-0 z-(--z-menu) grid cursor-progress place-items-center bg-white"
      onClick={() => setSurgeonMenuOpen(false)}
    >
      <div role="status" className="flex flex-col items-center gap-4 font-text text-sm text-[#7b7876]">
        <span
          aria-hidden="true"
          className="size-10 animate-spin rounded-full border-2 border-[#dfdddc] border-t-[#bb9358] motion-reduce:animate-none"
        />
        Загрузка…
      </div>
    </div>,
    document.body,
  );
}
