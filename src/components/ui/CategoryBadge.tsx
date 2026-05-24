import type { EntryCategory } from '../../features/braindump/types/BrainDump';

/* -------------------------------------------------------------------------- */
/*                                   Props                                    */
/* -------------------------------------------------------------------------- */

interface CategoryBadgeProps {
  category: EntryCategory;
}

/* -------------------------------------------------------------------------- */
/*                              Styling Tokens                                */
/* -------------------------------------------------------------------------- */

const CATEGORY_COLOR_CLASS: Record<EntryCategory, string> = {
  TASK:  ['text-[var(--ok)]',     'bg-[rgba(52,211,153,0.14)]'].join(' '),
  EVENT: ['text-[var(--warn)]',   'bg-[rgba(245,158,11,0.14)]'].join(' '),
  NOTE:  ['text-[var(--accent-1)]','bg-[rgba(123,227,255,0.12)]'].join(' '),
};

const BADGE_BASE_CLASS = [
  'inline-flex',
  'rounded-full',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]',
  'px-2.5',
  'py-1',
  'text-[11px]',
  'font-semibold',
  'tracking-wide',
].join(' ');

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export const CategoryBadge = ({ category }: Readonly<CategoryBadgeProps>) => (
  <span className={`${BADGE_BASE_CLASS} ${CATEGORY_COLOR_CLASS[category]}`}>
    {category}
  </span>
);
