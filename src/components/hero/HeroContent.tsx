import { useRef, type MouseEvent } from 'react';
import { asset } from '../../data/hero';
import { CtaButton } from './CtaButton';
import { HeroChips } from './HeroChips';
import { useHero } from './HeroContext';
import { useHeroReveal } from './useHeroReveal';
import './hero-content.css';

/** Glue 1–2 letter words (и, в, с…) to the next word, Russian typesetting. */
function glueShortWords(text: string): string {
  return text.replace(/(^|\s)([А-Яа-яЁёA-Za-z]{1,2})\s+/g, '$1$2 ');
}

/** Split the headline into two balanced lines at a word boundary (Figma: "…тела, лица / и груди…"). */
function splitTitle(title: string): string[] {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return [title];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')].map(glueShortWords);
}

/** Subtitle breaks after the colon, as in Figma ("…полный цикл заботы: / от онлайн-консультации…"). */
function splitSubtitle(subtitle: string): string[] {
  const i = subtitle.indexOf(': ');
  return i > 0 ? [subtitle.slice(0, i + 1), subtitle.slice(i + 2)] : [subtitle];
}

/**
 * Hero text column (Figma 1610:432): chips, h1, subtitle, CTAs. Bottom-anchored: the CTAs end at y 642
 * of the 720 stage. The layer is pointer-events:none; only [data-interactive] children catch the pointer.
 */
export function HeroContent() {
  const { data, reducedMotion, startReveal } = useHero();
  const { hero, clinic } = data;
  const primary = hero.ctas.find((c) => c.variant === 'primary');
  const secondary = hero.ctas.find((c) => c.variant === 'secondary');
  const primaryRef = useRef<HTMLAnchorElement>(null);

  const { idle } = useHeroReveal({ reducedMotion, bgSrc: asset(hero.background.src), startReveal });

  const onSeeWorks = (event: MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute('href') ?? '';
    const target = href.startsWith('#') && href.length > 1 ? document.getElementById(href.slice(1)) : null;
    if (!target) return;
    event.preventDefault();
    // scrollIntoView honours html { scroll-padding-top } so the target clears the navbar island.
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const titleLines = splitTitle(hero.title);
  const subtitle = splitSubtitle(hero.subtitle);

  return (
    <div className="absolute inset-x-0 bottom-[78px] mx-auto flex w-[760px] flex-col items-center text-center text-white">
      <HeroChips resetFocusRef={primaryRef} />

      <h1 className="font-display text-[44px] leading-[48px] font-normal tracking-[-0.02em] whitespace-nowrap">
        {titleLines.map((line, i) => (
          // Mask line: room for descenders without changing the 48 px line box.
          <span key={i} className="-mx-2 -mb-2 block overflow-hidden px-2 pb-2">
            <span className="block" data-reveal="line">
              {line}
            </span>
          </span>
        ))}
      </h1>

      <p
        className="mt-2 max-w-[700px] font-text text-[18px] leading-6 font-normal tracking-[-0.36px] text-white"
        data-reveal="subtitle"
      >
        {subtitle.map((part, i) => (
          <span key={i}>
            {i > 0 && <br />}
            {part}
          </span>
        ))}
      </p>

      <div className="mt-[19px] flex gap-3">
        {primary && (
          <span data-reveal="cta" className="inline-flex">
            <CtaButton
              ref={primaryRef}
              variant="primary"
              label={primary.label}
              idle={idle}
              data-cta={primary.id}
              data-analytics-id="hero_consultation"
              // "Подобрать специалиста" is a WhatsApp chat now; the surgeon menu lives behind the navbar "Меню".
              href={clinic.whatsappHref || primary.href}
              target={clinic.whatsappHref ? '_blank' : undefined}
              rel="noopener noreferrer"
            />
          </span>
        )}
        {secondary && (
          <span data-reveal="cta" className="inline-flex">
            <CtaButton variant="secondary" label={secondary.label} href={secondary.href} data-cta={secondary.id} onClick={onSeeWorks} />
          </span>
        )}
      </div>
    </div>
  );
}
