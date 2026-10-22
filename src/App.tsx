import { lazy, Suspense, useEffect, useRef, useState, type Ref } from 'react';
import { HeroProvider, useHero } from './components/hero/HeroContext';
import { Hero } from './components/hero/Hero';
import { MobileHero } from './components/mobile/MobileHero';
import { useIsMobile } from './hooks/useIsMobile';
import { Navbar } from './components/nav/Navbar';
import { loadSurgeonMenu } from './components/surgeon-menu/menuTrigger';
import { SurgeonMenuFallback } from './components/surgeon-menu/SurgeonMenuFallback';
import { Contacts } from './components/sections/Contacts';
import { Trust } from './components/sections/Trust';
import { Programs } from './components/sections/Programs';

// Team is below the fold and is the only section using antd (Segmented). It is code-split AND only
// requested when the visitor scrolls within ~800 px of it (R3-1), so antd never competes with the
// first screen. The placeholder keeps the #doctors anchor and the section height (design 2026-10: 717), so
// nothing shifts when it arrives and nav "Врачи" still lands in the right place.
const Team = lazy(() => import('./components/team/Team').then((m) => ({ default: m.Team })));
const TEAM_HEIGHT = 717;

function TeamPlaceholder({ sectionRef }: { sectionRef?: Ref<HTMLElement> }) {
  return <section ref={sectionRef} id="doctors" aria-label="Наша команда" style={{ minHeight: TEAM_HEIGHT, background: '#fff' }} />;
}

function DeferredTeam() {
  const placeholderRef = useRef<HTMLElement>(null);
  const [near, setNear] = useState(() => window.location.hash === '#doctors');

  useEffect(() => {
    if (near) return;
    const el = placeholderRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { rootMargin: '800px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  if (!near) return <TeamPlaceholder sectionRef={placeholderRef} />;
  return (
    <Suspense fallback={<TeamPlaceholder />}>
      <Team />
    </Suspense>
  );
}

// The surgeon menu (antd Modal/List/Avatar) is only needed on click. Its loader lives in
// menuTrigger.ts so the triggers prefetch it on hover/focus (N2-3); there is no idle prefetch, so
// antd stays off the network until the visitor shows intent (R3-1).
const SurgeonMenu = lazy(() => loadSurgeonMenu().then((m) => ({ default: m.SurgeonMenu })));

function DeferredSurgeonMenu() {
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

export default function App() {
  // Phones get their own hero (design "01_Hero" 393 px) with the menu button in it, instead of the
  // 1440 stage and the navbar island. The sections below have no phone design yet.
  const isMobile = useIsMobile();
  return (
    <HeroProvider>
      {!isMobile && <Navbar />}
      <main className="max-md:overflow-x-clip">
        {isMobile ? <MobileHero /> : <Hero />}
        <Trust />
        <DeferredTeam />
        <Programs />
        {/* "Смотреть работы" target — the cases section is the next design to come. */}
        <section id="cases" className="page-placeholder" aria-label="Кейсы до и после">
          <p>Здесь будет блок кейсов «до/после» — следующий в очереди дизайна.</p>
        </section>
        <Contacts />
      </main>
      <DeferredSurgeonMenu />
    </HeroProvider>
  );
}
