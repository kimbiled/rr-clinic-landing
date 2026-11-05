import { useRef, type KeyboardEvent } from 'react';
import { asset } from '../../data/hero';
import type { TeamTab, TeamTabId } from './teamData';

interface TeamTabsProps {
  tabs: TeamTab[];
  value: TeamTabId;
  onChange: (id: TeamTabId) => void;
  panelId: string;
}

/**
 * Capsule tabs; phones show the selected label and icon-only buttons for the rest.
 *
 * Plain buttons instead of antd Segmented: Segmented slides a thumb between the old and new item and paints
 * the selected item only after that motion ends, while on phones the selected item also changes width — the
 * thumb then raced a box that had already jumped, which looked laggy. Here the colour and the width change
 * together in one CSS transition (team.css).
 */
export function TeamTabs({ tabs, value, onChange, panelId }: TeamTabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // Radio-group keys: ←/→ (and Home/End) move and select, as Segmented did.
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? (index - 1 + tabs.length) % tabs.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : -1;
    if (next < 0) return;
    event.preventDefault();
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label="Состав команды" className="team-tabs">
      {tabs.map((tab, i) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-controls={panelId}
            aria-label={tab.label}
            tabIndex={selected ? 0 : -1}
            data-analytics-id={`team_tab_${tab.id}`}
            className="team-tabs__item"
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => onKeyDown(event, i)}
          >
            <span className="team-tabs__icon">
              <img src={asset(`assets/icons/team-tab-${tab.id}.svg`)} width={24} height={24} alt="" />
            </span>
            <span className="team-tabs__text" aria-hidden="true">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
