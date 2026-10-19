import { theme } from 'antd';
import type { ThemeConfig } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { heroData } from '../../data/hero';
import type { Doctor } from '../../data/types';
import { useHero } from '../hero/HeroContext';
import { TEAM_TABS, type TeamTabId } from './teamData';
import { TeamTabs } from './TeamTabs';
import { TeamCarousel } from './TeamCarousel';
import { TeamEmpty } from './TeamEmpty';
import { useRevealOnce } from './useRevealOnce';
import { AntdProvider } from '../../theme/AntdProvider';
import { antdTheme } from '../../theme/antdTheme';
import './team.css';

/** Light-surface antd theme for this white section (the global theme is dark for the hero). */
const lightTheme: ThemeConfig = {
  ...antdTheme,
  algorithm: theme.defaultAlgorithm,
  token: {
    ...antdTheme.token,
    colorPrimary: '#c3914d',
    colorBgBase: '#ffffff',
    colorTextBase: '#2e2c2c',
    colorBgElevated: '#ffffff',
  },
  components: {
    Segmented: {
      controlHeight: 48, // 48 − 2×4 track padding = 40 px tabs; +1 px border → 50 px capsule
      trackPadding: 4,
      trackBg: '#ffffff',
      itemColor: '#a97b39',
      itemHoverColor: '#8f6526',
      itemHoverBg: 'rgba(195, 145, 77, 0.08)',
      itemActiveBg: 'rgba(195, 145, 77, 0.14)',
      itemSelectedBg: '#c3914d',
      itemSelectedColor: '#ffffff',
      fontSize: 16,
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

  const doctorsWithCases = useMemo(() => new Set(heroData.cases.map((c) => c.doctorId)), []);

  // "Подробнее": when the surgeon has works in the hero carousel, open the existing surgeon flow
  // (filter the hero by doctor) and scroll up to it; otherwise fall back to the plain link.
  const onMore = useCallback(
    (doctor: Doctor) => {
      if (!doctorsWithCases.has(doctor.id)) return false;
      selectDoctor(doctor.id);
      document.getElementById('hero')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      return true;
    },
    [doctorsWithCases, reducedMotion, selectDoctor],
  );

  return (
    <AntdProvider theme={lightTheme}>
      <section id="doctors" aria-labelledby="team-title" className="relative overflow-hidden bg-white text-neutral-900">
        <div className="relative mx-auto max-w-[1440px]">
          <span aria-hidden="true" className="team__hline" />
          <span aria-hidden="true" className="team__vline" />

          {/* Figma "Заголовок" 1240×139 @ (132, 64) */}
          <div ref={headRef} className={`team-reveal relative px-[132px] pt-16 ${headIn ? 'is-in' : ''}`}>
            <p className="h-[23px] font-text text-[18px] leading-[23px] tracking-[0.1em] text-taupe-400 uppercase">Команда</p>
            <h2
              id="team-title"
              className="mt-3 h-10 font-display text-[36px] leading-10 font-normal text-neutral-900"
            >
              Наша команда
            </h2>
            <p className="mt-3 max-w-[900px] font-text text-[22px] leading-[26px] tracking-[-0.1px] text-[#7c7876]">
              Квалифицированные специалисты, которые сопровождают вас от первой консультации до полного восстановления
            </p>
          </div>

          <div ref={bodyRef} className={`team-reveal relative mt-8 px-[132px] ${bodyIn ? 'is-in' : ''}`}>
            <div>
              <TeamTabs tabs={TEAM_TABS} value={tabId} onChange={setTabId} panelId={PANEL_ID} />
            </div>
            <p className="mt-6 h-[26px] font-text text-[22px] leading-[26px] tracking-[-0.1px] text-[#97897d]">
              {tab.subtitle}
            </p>
          </div>
        </div>

        <div id={PANEL_ID} className="relative mt-6 pb-16">
          <TeamCarousel
            key={tab.id}
            doctors={tab.members}
            label={tab.label}
            inView={bodyIn}
            reducedMotion={reducedMotion}
            onMore={onMore}
            empty={<TeamEmpty label={tab.label} />}
          />
        </div>
      </section>
    </AntdProvider>
  );
}
