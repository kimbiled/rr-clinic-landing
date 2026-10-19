import type { CSSProperties } from 'react';
import { asset } from '../../data/hero';
import { CasesCarousel } from '../carousel/CasesCarousel';
import { LightCanvas } from '../fx/LightCanvas';
import { ParticlesCanvas } from '../fx/ParticlesCanvas';
import { HeroContent } from './HeroContent';
import { useHero } from './HeroContext';

/**
 * Hero stage (owner: lead). Layer order mirrors Figma frame 1610:268; painting is governed by the
 * z-index tokens, so DOM order follows the reading/Tab order (content before the cards).
 */
export function Hero() {
  const { data, stage, setOverlayEl } = useHero();

  return (
    <section
      id="hero"
      aria-label={data.clinic.name}
      className="hero"
      style={{ '--stage-scale': stage.scale } as CSSProperties}
    >
      <div className="hero__stage">
        <div className="hero__layer hero__bg" aria-hidden="true" data-reveal="bg">
          <img src={asset(data.hero.background.src)} alt="" fetchPriority="high" />
        </div>

        <LightCanvas />

        <div className="hero__layer hero__statue" aria-hidden="true" data-reveal="statue">
          <img src={asset(data.hero.statue.src)} alt="" fetchPriority="high" />
        </div>

        <div className="hero__layer hero__shade" aria-hidden="true">
          <div className="hero__glow" />
        </div>

        <ParticlesCanvas />

        <div className="hero__layer hero__content-layer">
          <HeroContent />
        </div>

        <div className="hero__layer hero__carousel">
          <CasesCarousel />
        </div>

        <div className="hero__layer hero__overlay" ref={setOverlayEl} />
      </div>
    </section>
  );
}
