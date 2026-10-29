import { Segmented } from 'antd';
import type { ReactNode } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { TeamTab, TeamTabId } from './teamData';

/** Phone tab icons (design 2026-10-29): body outline, surgical mask, drop with a heart. */
const TAB_ICONS: Record<TeamTabId, ReactNode> = {
  surgeons: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M7 1.5c0 3-1.8 4.5-1.8 7.5 0 2.2 1.3 3.4 1.3 5.5 0 1.6-.8 2.8-.8 4M13 1.5c0 3 1.8 4.5 1.8 7.5 0 2.2-1.3 3.4-1.3 5.5 0 1.6.8 2.8.8 4M8.6 12.5c.5.4 1 .6 1.4.6s.9-.2 1.4-.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  ),
  brigade: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 6.5c2-1 4-1.5 6-1.5s4 .5 6 1.5v5c-1.6 1.8-3.8 3-6 3s-4.4-1.2-6-3v-5ZM4 8H2.5a1 1 0 0 0-1 1v.5c0 1 .8 1.8 1.8 1.9L4 11.5M16 8h1.5a1 1 0 0 1 1 1v.5c0 1-.8 1.8-1.8 1.9l-.7.1M7 8.5h6M7 11h6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  nurses: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 1.8S4.5 8 4.5 12a5.5 5.5 0 0 0 11 0C15.5 8 10 1.8 10 1.8Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M10 15.2s-2.3-1.4-2.3-3a1.2 1.2 0 0 1 2.3-.6 1.2 1.2 0 0 1 2.3.6c0 1.6-2.3 3-2.3 3Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/** Phones: the chosen tab is a green pill with icon + label, the others icon-only circles. */
function TeamTabsMobile({ tabs, value, onChange, panelId }: TeamTabsProps) {
  return (
    <div role="tablist" aria-label="Состав команды" className="flex items-center gap-2">
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            aria-label={tab.label}
            onClick={() => onChange(tab.id)}
            className="team-mtab inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-pill font-text text-[13px] leading-none font-medium"
          >
            <span className="team-mtab__icon grid size-8 place-items-center rounded-full">{TAB_ICONS[tab.id]}</span>
            {selected && <span className="pr-3.5">{tab.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

interface TeamTabsProps {
  tabs: TeamTab[];
  value: TeamTabId;
  onChange: (id: TeamTabId) => void;
  panelId: string;
}

/** Figma "Вкладки / капсула" 587×50 — antd Segmented restyled in team.css; one tab stop, ←/→ switch. */
export function TeamTabs({ tabs, value, onChange, panelId }: TeamTabsProps) {
  const isMobile = useIsMobile();
  if (isMobile) return <TeamTabsMobile tabs={tabs} value={value} onChange={onChange} panelId={panelId} />;
  return (
    <Segmented<TeamTabId>
      className="team-tabs"
      shape="round"
      name="team-tabs"
      aria-label="Состав команды"
      aria-controls={panelId}
      // rc-segmented makes the radiogroup <div> itself a tab stop, where ←/→ do nothing and the ring wraps
      // the whole capsule. Drop it, so Tab lands straight on the checked radio (arrows switch tabs) and
      // team.css rings that one item (R3-4a).
      tabIndex={-1}
      value={value}
      onChange={onChange}
      options={tabs.map((tab) => ({
        value: tab.id,
        label: tab.label,
        className: tab.widthClass,
      }))}
    />
  );
}
