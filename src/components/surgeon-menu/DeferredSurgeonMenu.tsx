import { lazy, Suspense, useEffect, useState } from 'react';
import { useHero } from '../hero/HeroContext';
import { loadSurgeonMenu } from './menuTrigger';
import { SurgeonMenuFallback } from './SurgeonMenuFallback';

// The surgeon menu (antd Modal/List/Avatar) is only needed on click. Its loader lives in
// menuTrigger.ts so the triggers prefetch it on hover/focus (N2-3); there is no idle prefetch, so
// antd stays off the network until the visitor shows intent (R3-1).
const SurgeonMenu = lazy(() => loadSurgeonMenu().then((m) => ({ default: m.SurgeonMenu })));

export function DeferredSurgeonMenu() {
  const { surgeonMenuOpen } = useHero();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (surgeonMenuOpen) setMounted(true);
  }, [surgeonMenuOpen]);

  if (!mounted) return null;
  return (
    // N2-3: immediate dark-glass backdrop + spinner while the chunk is still in flight (first open only).
    <Suspense fallback={surgeonMenuOpen ? <SurgeonMenuFallback /> : null}>
      <SurgeonMenu />
    </Suspense>
  );
}
