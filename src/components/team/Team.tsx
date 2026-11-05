import { useCallback, useMemo, useState } from 'react';
import { heroData } from '../../data/hero';
import type { Doctor } from '../../data/types';
import { useHero } from '../hero/HeroContext';
import { TEAM_TABS, type TeamTabId } from './teamData';
import { TeamTabs } from './TeamTabs';
import { TeamCarousel, useTeamScroller } from './TeamCarousel';
import { CarouselControls } from './CarouselControls';
import { TeamEmpty } from './TeamEmpty';
import { useRevealOnce } from './useRevealOnce';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileStepper } from '../mobile/MobileStepper';
import './team.css';

const PANEL_ID = 'team-panel';

export function Team() {
  const { reducedMotion, selectDoctor } = useHero();
  const isMobile = useIsMobile();
  const [tabId, setTabId] = useState<TeamTabId>('surgeons');
  const tab = TEAM_TABS.find((t) => t.id === tabId) ?? TEAM_TABS[0];
  const [headRef, headIn] = useRevealOnce<HTMLDivElement>();
  const [bodyRef, bodyIn] = useRevealOnce<HTMLDivElement>();
  const scroller = useTeamScroller(tab.members, reducedMotion);

  const doctorsWithCases = useMemo(() => new Set(heroData.cases.map((c) => c.doctorId)), []);

  // "Подробнее": a surgeon with their own page (/<slug>) opens it. Otherwise, when the surgeon has works
  // in the hero carousel, open the existing surgeon flow (filter the hero by doctor) and scroll up to it.
  const onMore = useCallback(
    (doctor: Doctor) => {
      if (doctor.href.startsWith('/')) return false;
      if (!doctorsWithCases.has(doctor.id)) return false;
      selectDoctor(doctor.id);
      document.getElementById('hero')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      // R3-7: move keyboard focus with the view. The filter chip ("<name> ×") is the natural landing spot:
      // its label says what is shown and how to reset, and HeroChips' polite live region announces the
      // filter. Wait a frame so the chip has dropped data-hidden (visibility: hidden can't take focus);
      // preventScroll lets the smooth scroll above do the moving.
      requestAnimationFrame(() => {
        const chip = document.querySelector<HTMLElement>('#hero .rr-filter-chip');
        chip?.focus({ preventScroll: true });
      });
      return true;
    },
    [doctorsWithCases, reducedMotion, selectDoctor],
  );

  return (
    <>
      <section id="doctors" aria-labelledby="team-title" className="team-section relative overflow-hidden bg-white text-neutral-900">
        <div className="relative mx-auto max-w-[1440px] px-(--team-pad) pt-16 max-md:pt-12">
          <div ref={headRef} className={`team-reveal ${headIn ? 'is-in' : ''}`}>
            <p className="font-text text-[18px] leading-none tracking-[0.1em] text-[#a4a09d] uppercase max-md:text-[11px]">Команда</p>
            <h2
              id="team-title"
              className="mt-[22px] font-display text-[40px] leading-[48px] font-normal text-[#1b1919] max-md:mt-3 max-md:text-[30px] max-md:leading-9"
            >
              Наша <span className="text-[#9bb4ae] max-md:text-[#5e8b7b]">команда</span>
            </h2>
            <p className="mt-4 max-w-[800px] font-text text-[18px] leading-[1.1] text-[#625f5e] max-md:mt-2 max-md:text-[18px] max-md:leading-[25px] max-md:text-[#8c8784]">
              Квалифицированные специалисты, которые сопровождают вас от первой консультации до полного восстановления
            </p>
          </div>

          <div ref={bodyRef} className={`team-reveal mt-[18px] flex items-center justify-between ${bodyIn ? 'is-in' : ''}`}>
            <div className="team-tabs-scroll max-md:min-w-0 max-md:flex-1">
              <TeamTabs tabs={TEAM_TABS} value={tabId} onChange={setTabId} panelId={PANEL_ID} />
            </div>
            <div className="max-md:hidden">
              <CarouselControls
                prevDisabled={scroller.isEmpty || scroller.edges.start}
                nextDisabled={scroller.isEmpty || scroller.edges.end}
                onPrev={() => scroller.goTo(-1)}
                onNext={() => scroller.goTo(1)}
                label={tab.label}
              />
            </div>
          </div>
        </div>

        <div id={PANEL_ID} className="relative mt-8 pb-[42px] max-md:mt-5 max-md:pb-12">
          <div key={tab.id} className="team-panel-in">
            <TeamCarousel
              scroller={scroller}
              doctors={tab.members}
              label={tab.label}
              inView={bodyIn}
              onMore={onMore}
              empty={<TeamEmpty label={tab.label} />}
            />
          </div>
          {isMobile && !scroller.isEmpty && (
            <MobileStepper
              className="mx-(--team-pad) mt-5"
              index={scroller.index}
              count={tab.members.length}
              onStep={scroller.goTo}
              prevLabel="Предыдущий врач"
              nextLabel="Следующий врач"
            />
          )}
        </div>
      </section>
    </>
  );
}
