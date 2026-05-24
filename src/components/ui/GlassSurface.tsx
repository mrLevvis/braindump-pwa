import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import styles from './GlassSurface.module.css';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type GlassShine = 'subtle' | 'prominent';
export type GlassVariant = 'chrome' | 'content';

export interface GlassSurfaceProps extends HTMLAttributes<HTMLElement> {
  /** Controls the intensity of the diagonal streak + corner sparkles. */
  shine?: GlassShine;
  /**
   * chrome: translucent white glass — for top bars, modals, floating buttons.
   * content: dark surface rgba(20,20,40) — for note cards, input panels, lists.
   */
  variant?: GlassVariant;
  /** Render as any HTML element. Defaults to 'div'. */
  as?: ElementType;
  children?: ReactNode;
}

/* -------------------------------------------------------------------------- */
/*                              Component                                     */
/* -------------------------------------------------------------------------- */

/**
 * GlassSurface — reusable liquid-glass base.
 *
 * Composes three reflection layers:
 *  1. Diagonal light streak   (::before-equivalent via span, z-index: -1)
 *  2. Top-edge wet gleam      (inset box-shadow in the CSS module)
 *  3. Corner sparkles         (two <span> elements, prominent only)
 *
 * Use shine="prominent" only on hero / featured elements (FAB, active modal).
 * All other surfaces use the default shine="subtle".
 */
export const GlassSurface = ({
  shine = 'subtle',
  variant = 'chrome',
  as: Tag = 'div',
  children,
  className = '',
  ...rest
}: Readonly<GlassSurfaceProps>) => {
  const rootClass = [
    styles.root,
    variant === 'chrome' ? styles.chrome : styles.variantContent,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const streakClass = [
    styles.streak,
    shine === 'prominent' ? styles.streakProminent : styles.streakSubtle,
  ].join(' ');

  return (
    <Tag className={rootClass} {...rest}>
      {/* Layer 1: diagonal streak — z-index:-1 within isolation:isolate, stays behind content */}
      <span aria-hidden="true" className={streakClass} />

      {/* Layer 3: corner sparkles — only for hero/featured elements */}
      {shine === 'prominent' && (
        <>
          <span aria-hidden="true" className={`${styles.sparkle} ${styles.sparkleTL}`} />
          <span aria-hidden="true" className={`${styles.sparkle} ${styles.sparkleBR}`} />
        </>
      )}

      {children}
    </Tag>
  );
};
