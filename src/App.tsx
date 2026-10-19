import { lazy, Suspense, useEffect, useState } from 'react';
import { HeroProvider, useHero } from './components/hero/HeroContext';
import { Hero } from './components/hero/Hero';
import { Navbar } from './components/nav/Navbar';
import { loadSurgeonMenu } from './components/surgeon-menu/menuTrigger';
import { SurgeonMenuFallback } from './components/surgeon-menu/SurgeonMenuFallback';
import { About } from './components/sections/About';
import { StatsBand } from './components/sections/StatsBand';
import { Trust } from './components/sections/Trust';

// The surgeon menu (antd Modal/List/Avatar) is only needed on click: keep it out of the first-paint
// bundle and prefetch it once the page is idle so the first open is instant.
// Below the fold and the only section using antd Segmented: split it out. The fallback keeps the
// #doctors anchor and the section height (Figma 1011) so nothing shifts when it arrives.
const Team = lazy(() => import('./components/team/Team').then((m) => ({ default: m.Team })));
const TEAM_FALLBACK = <section id="doctors" aria-label="Наша команда" style={{ minHeight: 1011, background: '#fff' }} />;

// The loader lives in menuTrigger.ts so the triggers can also prefetch it on hover/focus (N2-3).
const SurgeonMenu = lazy(() => loadSurgeonMenu().then((m) => ({ default: m.SurgeonMenu })));

function DeferredSurgeonMenu() {
  const { surgeonMenuOpen } = useHero();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (surgeonMenuOpen) setMounted(true);
  }, [surgeonMenuOpen]);

  useEffect(() => {
    const prefetch = () => void loadSurgeonMenu();
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(prefetch, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(prefetch, 2500);
    return () => window.clearTimeout(id);
  }, []);

  if (!mounted) return null;
  return (
    // N2-3: immediate dark-glass backdrop + spinner while the chunk is still in flight (first open only).
    <Suspense fallback={surgeonMenuOpen ? <SurgeonMenuFallback /> : null}>
      <SurgeonMenu />
    </Suspense>
  );
}

export default function App() {
  return (
    <HeroProvider>
      <Navbar />
      <main>
        <Hero />
        <StatsBand />
        <About />
        <Trust />
        <Suspense fallback={TEAM_FALLBACK}>
          <Team />
        </Suspense>
        {/* "Смотреть работы" target — the cases section is the next design to come. */}
        <section id="cases" className="page-placeholder" aria-label="Кейсы до и после">
          <p>Здесь будет блок кейсов «до/после» — следующий в очереди дизайна.</p>
        </section>
      </main>
      <DeferredSurgeonMenu />
    </HeroProvider>
  );
}
