import { lazy, Suspense, useEffect, useRef, useState, type Ref } from 'react';
import { HeroProvider } from './components/hero/HeroContext';
import { Hero } from './components/hero/Hero';
import { MobileHero } from './components/mobile/MobileHero';
import { MobileNav } from './components/mobile/MobileNav';
import { useIsMobile } from './hooks/useIsMobile';
import { Navbar } from './components/nav/Navbar';
import { DeferredSurgeonMenu } from './components/surgeon-menu/DeferredSurgeonMenu';
import { Trust } from './components/sections/Trust';
import { Programs } from './components/sections/Programs';
import { Journey } from './components/sections/Journey';
import { Operations } from './components/sections/Operations';
import { Works } from './components/sections/Works';
import { Reviews } from './components/sections/Reviews';
import { ClinicTour } from './components/sections/ClinicTour';
import { Faq } from './components/sections/Faq';
import { Footer } from './components/sections/Footer';

// Team is below the fold (cards, photos, carousel logic). It is code-split AND only
// requested when the visitor scrolls within ~800 px of it (R3-1), so antd never competes with the
// first screen. The placeholder keeps the #doctors anchor and the section height (design 2026-10-30: 902), so
// nothing shifts when it arrives and nav "Врачи" still lands in the right place.
const Team = lazy(() => import('./components/team/Team').then((m) => ({ default: m.Team })));
const TEAM_HEIGHT = 902;

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

export default function App() {
  // Phones get their own hero (design "01_Hero" 393 px) with the menu button in it, instead of the
  // 1440 stage and the navbar island. The sections below have no phone design yet.
  const isMobile = useIsMobile();
  return (
    <HeroProvider>
      {isMobile ? <MobileNav /> : <Navbar />}
      <main className="max-md:overflow-x-clip">
        {isMobile ? <MobileHero /> : <Hero />}
        <Trust />
        <DeferredTeam />
        <Programs />
        <Journey />
        <Operations />
        <Works />
        <Reviews />
        <ClinicTour />
        <Faq />
      </main>
      <Footer />
      <DeferredSurgeonMenu />
    </HeroProvider>
  );
}
