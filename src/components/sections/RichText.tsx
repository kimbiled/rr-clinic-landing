import { Fragment, type ReactNode } from 'react';
import type { RichText as RichTextValue } from '../../data/landing';

/** Turns "\n" into <br>. A space goes before each break, so a layout that hides the <br> (phones:
 *  `[&_br]:hidden`) still separates the words; before a visible break it collapses. */
export function withBreaks(text: string): ReactNode {
  const parts = text.split('\n');
  return parts.map((part, i) => (
    <Fragment key={i}>
      {i > 0 && (
        <>
          {' '}
          <br />
        </>
      )}
      {part}
    </Fragment>
  ));
}

interface RichTextProps {
  value: RichTextValue;
  /** Classes for `accent` fragments (gold). */
  accentClassName?: string;
  /** Classes for `strong` fragments. */
  strongClassName?: string;
}

/** Renders a RichText value from src/data/landing.ts. */
export function RichText({ value, accentClassName, strongClassName }: RichTextProps) {
  return (
    <>
      {value.map((part, i) => {
        if (typeof part === 'string') return <Fragment key={i}>{withBreaks(part)}</Fragment>;
        if (part.tone === 'strong') {
          return (
            <strong key={i} className={strongClassName}>
              {withBreaks(part.text)}
            </strong>
          );
        }
        return (
          <span key={i} className={accentClassName}>
            {withBreaks(part.text)}
          </span>
        );
      })}
    </>
  );
}
