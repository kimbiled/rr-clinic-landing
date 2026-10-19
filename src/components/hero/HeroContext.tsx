import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { heroData } from '../../data/hero';
import type { HeroData } from '../../data/types';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useStageScale, type Stage } from '../../hooks/useStageScale';

export interface FocusedCase {
  caseId: string;
  doctorId: string;
}

export interface Reveal {
  /** performance.now() when the content reveal timeline started (spec §9.5 t=0), null before. */
  startedAt: number | null;
  duration: number;
}

interface HeroState {
  data: HeroData;
  stage: Stage;
  reducedMotion: boolean;
  /** Surgeon chosen in the surgeon menu; the carousel emphasises that doctor's cases. */
  selectedDoctorId: string | null;
  selectDoctor: (doctorId: string | null) => void;
  /** Card currently hovered/focused in the carousel (FX dims particles while set). */
  focusedCase: FocusedCase | null;
  setFocusedCase: (value: FocusedCase | null) => void;
  /** Surgeon menu open state (opened from the primary CTA and nav "Врачи"). */
  surgeonMenuOpen: boolean;
  setSurgeonMenuOpen: (open: boolean) => void;
  reveal: Reveal;
  startReveal: (duration: number) => void;
  /** z-7 layer above the text; the carousel portals the lifted card + doctor panel here. */
  overlayEl: HTMLDivElement | null;
  setOverlayEl: (el: HTMLDivElement | null) => void;
}

const HeroContext = createContext<HeroState | null>(null);

export function HeroProvider({ children }: { children: ReactNode }) {
  const stage = useStageScale();
  const reducedMotion = useReducedMotion();
  const [selectedDoctorId, selectDoctor] = useState<string | null>(null);
  const [focusedCase, setFocusedCase] = useState<FocusedCase | null>(null);
  const [surgeonMenuOpen, setSurgeonMenuOpen] = useState(false);
  const [reveal, setReveal] = useState<Reveal>({ startedAt: null, duration: 0 });
  const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null);

  const value = useMemo<HeroState>(
    () => ({
      data: heroData,
      stage,
      reducedMotion,
      selectedDoctorId,
      selectDoctor,
      focusedCase,
      setFocusedCase,
      surgeonMenuOpen,
      setSurgeonMenuOpen,
      reveal,
      startReveal: (duration) => setReveal({ startedAt: performance.now(), duration }),
      overlayEl,
      setOverlayEl,
    }),
    [stage, reducedMotion, selectedDoctorId, focusedCase, surgeonMenuOpen, reveal, overlayEl],
  );

  return <HeroContext.Provider value={value}>{children}</HeroContext.Provider>;
}

export function useHero(): HeroState {
  const ctx = useContext(HeroContext);
  if (!ctx) throw new Error('useHero must be used inside <HeroProvider>');
  return ctx;
}
