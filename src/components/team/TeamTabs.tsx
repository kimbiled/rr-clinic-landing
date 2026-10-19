import { Segmented } from 'antd';
import type { TeamTab, TeamTabId } from './teamData';

interface TeamTabsProps {
  tabs: TeamTab[];
  value: TeamTabId;
  onChange: (id: TeamTabId) => void;
  panelId: string;
}

/** Figma "Вкладки / капсула" 587×50 — antd Segmented restyled in team.css. */
export function TeamTabs({ tabs, value, onChange, panelId }: TeamTabsProps) {
  return (
    <Segmented<TeamTabId>
      className="team-tabs"
      shape="round"
      name="team-tabs"
      aria-label="Состав команды"
      aria-controls={panelId}
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
