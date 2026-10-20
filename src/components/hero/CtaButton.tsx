import type { AnchorHTMLAttributes, ButtonHTMLAttributes, Ref } from 'react';
import { asset } from '../../data/hero';

const ARROW = 'assets/icons/arrow-down-right.svg';

interface CommonProps {
  variant: 'primary' | 'secondary';
  label: string;
  /** Primary only: run the idle shimmer loop (set once the reveal is over). */
  idle?: boolean;
  className?: string;
}

type CtaButtonProps = CommonProps &
  (
    | ({ href: string; ref?: Ref<HTMLAnchorElement> } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'>)
    | ({ href?: undefined; ref?: Ref<HTMLButtonElement> } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>)
  );

const BASE =
  'rr-cta relative isolate inline-flex h-[60px] items-center justify-center gap-1 overflow-hidden rounded-[99px] px-6 py-5 ' +
  'font-display text-base leading-6 font-medium whitespace-nowrap text-white select-none cursor-pointer';

const SIZE = {
  primary: 'w-[284px]',
  secondary: 'w-[224px]',
} as const;

/** Gold "glass" CTA (spec §8): shine vectors + moving glint + arrow. Custom on purpose (not antd Button). */
export function CtaButton(props: CtaButtonProps) {
  const { variant, label, idle, className, ...rest } = props;
  const cls = `${BASE} rr-cta--${variant} ${className ?? SIZE[variant]}`;

  const inner = (
    <>
      {variant === 'primary' && (
        <span className="rr-cta__shine pointer-events-none absolute inset-0 z-0" aria-hidden="true">
          <img src={asset('assets/icons/cta-shine-1.svg')} alt="" width={126} height={154} style={{ left: 87.6, top: -37 }} />
          <img src={asset('assets/icons/cta-shine-2.svg')} alt="" width={150} height={172} style={{ left: 152.6, top: -46 }} />
          <img src={asset('assets/icons/cta-shine-1.svg')} alt="" width={126} height={154} style={{ left: 247.6, top: -37 }} />
        </span>
      )}
      <span className="rr-cta__glint" aria-hidden="true" />
      <span className="rr-cta__label">{label}</span>
      <img className="rr-cta__icon size-5" src={asset(ARROW)} width={20} height={20} alt="" aria-hidden="true" />
    </>
  );

  if (rest.href !== undefined) {
    const { ref, ...anchor } = rest as { ref?: Ref<HTMLAnchorElement> } & AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a ref={ref} className={cls} data-interactive="" data-idle={idle || undefined} {...anchor}>
        {inner}
      </a>
    );
  }

  const { ref, ...button } = rest as { ref?: Ref<HTMLButtonElement> } & ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button ref={ref} type="button" className={cls} data-interactive="" data-idle={idle || undefined} {...button}>
      {inner}
    </button>
  );
}
