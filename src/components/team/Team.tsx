import { theme } from 'antd';
import type { ThemeConfig } from 'antd';
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
import { AntdProvider } from '../../theme/AntdProvider';
import { antdTheme } from '../../theme/antdTheme';
import './team.css';

/** Sage green of the design's team block (selected tab, accent word). */
const SAGE = '#567e75';

/** Light-surface antd theme for this white section (the global theme is dark for the hero). */
const lightTheme: ThemeConfig = {
  ...antdTheme,
  algorithm: theme.defaultAlgorithm,
  token: {
    ...antdTheme.token,
    colorPrimary: SAGE,
    colorBgBase: '#ffffff',
    colorTextBase: '#2e2c2c',
    colorBgElevated: '#ffffff',
  },
  components: {
    Segmented: {
      controlHeight: 44, // 44 + 2×4 track padding + 1 px border → the design's 54 px capsule
      trackPadding: 4,
      trackBg: '#ffffff',
      itemColor: '#2f4a44',
      itemHoverColor: '#1f3631',
      itemHoverBg: 'rgba(86, 126, 117, 0.08)',
      itemActiveBg: 'rgba(86, 126, 117, 0.14)',
      itemSelectedBg: SAGE,
      itemSelectedColor: '#ffffff',
      fontSize: 15,
      motionDurationSlow: '0.35s',
    },
  },
};

const PANEL_ID = 'team-panel';

export function Team() {
  const { reducedMotion, selectDoctor } = useHero();
  const [tabId, setTabId] = useState<TeamTabId>('surgeons');
  const tab = TEAM_TABS.find((t) => t.id === tabId) ?? TEAM_TABS[0];
  const [headRef, headIn] = useRevealOnce<HTMLDivElement>();
  const [bodyRef, bodyIn] = useRevealOnce<HTMLDivElement>();
  const scroller = useTeamScroller(tab.members, reducedMotion);

  const doctorsWithCases = useMemo(() => new Set(heroData.cases.map((c) => c.doctorId)), []);

  // "Подробнее": when the surgeon has works in the hero carousel, open the existing surgeon flow
  // (filter the hero by doctor) and scroll up to it; otherwise fall back to the plain link.
  const onMore = useCallback(
    (doctor: Doctor) => {
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
    <AntdProvider theme={lightTheme}>
      <section id="doctors" aria-labelledby="team-title" className="team-section relative overflow-hidden bg-white text-neutral-900">
        <div className="relative mx-auto max-w-[1440px] px-(--team-pad) pt-16">
          <div ref={headRef} className={`team-reveal ${headIn ? 'is-in' : ''}`}>
            <p className="font-text text-[18px] leading-none tracking-[0.1em] text-[#a4a09d] uppercase">Команда</p>
            <h2 id="team-title" className="mt-[22px] font-display text-[40px] leading-[44px] font-normal tracking-[-0.025em] text-[#1b1919]">
              Наша <span className="text-[#9bb4ae]">команда</span>
            </h2>
            <p className="mt-4 max-w-[540px] font-text text-[16px] leading-5 tracking-[-0.01em] text-[#585656]">
              Квалифицированные специалисты, которые сопровождают вас от первой консультации до полного восстановления
            </p>
          </div>

          <div ref={bodyRef} className={`team-reveal mt-[18px] flex items-center justify-between ${bodyIn ? 'is-in' : ''}`}>
            <div>
              <TeamTabs tabs={TEAM_TABS} value={tabId} onChange={setTabId} panelId={PANEL_ID} />
            </div>
            <div>
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

        <div id={PANEL_ID} className="relative mt-8 pb-[42px]">
          <TeamCarousel
            scroller={scroller}
            doctors={tab.members}
            label={tab.label}
            inView={bodyIn}
            onMore={onMore}
            empty={<TeamEmpty label={tab.label} />}
          />
        </div>
      </section>
    </AntdProvider>
  );
}
