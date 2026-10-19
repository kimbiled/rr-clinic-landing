import { Segmented } from 'antd';
import type { TeamTab, TeamTabId } from './teamData';

interface TeamTabsProps {
  tabs: TeamTab[];
  value: TeamTabId;
  onChange: (id: TeamTabId) => void;
  panelId: string;
}

/** Figma "Вкладки / капсула" 587×50 — antd Segmented restyled in team.css; one tab stop, ←/→ switch. */
export function TeamTabs({ tabs, value, onChange, panelId }: TeamTabsProps) {
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
