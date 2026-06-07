import { Badge } from '@/components/ui/badge';
import type { EntryCategory } from './types';

interface CategoryStyle {
  /** Subtle tint filling the entire card background — primary identity signal. */
  tintBackground: string;
  /** Text/icon color for accent elements (e.g. TASK circle icon). */
  accent: string;
  /** Solid fill for identity blocks (e.g. EVENT date tile). */
  accentBg: string;
  /** Badge config — used only in the DetailPanel dialog header. */
  badge: Readonly<{ label: string; variant: 'default' | 'secondary' | 'outline'; className: string }>;
}

export const CATEGORY_STYLES: Record<EntryCategory, CategoryStyle> = {
  TASK: {
    tintBackground: 'bg-violet-500/10 dark:bg-violet-500/15',
    accent: 'text-violet-500',
    accentBg: 'bg-violet-500',
    badge: { label: 'Task', variant: 'default', className: 'bg-violet-500/90 text-white hover:bg-violet-500/80' },
  },
  EVENT: {
    tintBackground: 'bg-sky-500/10 dark:bg-sky-500/15',
    accent: 'text-sky-500',
    accentBg: 'bg-sky-500',
    badge: { label: 'Event', variant: 'secondary', className: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200' },
  },
  NOTE: {
    tintBackground: 'bg-amber-500/10 dark:bg-amber-500/15',
    accent: 'text-amber-500',
    accentBg: 'bg-amber-500',
    badge: { label: 'Note', variant: 'outline', className: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200' },
  },
};

const TAG_BADGE_CLASS_NAME = [
  'text-[11px]', 'font-normal', 'bg-white', 'border-0', 'text-foreground/70', 'dark:bg-white/10',
].join(' ');

export const TagBadgeList = ({ tags }: Readonly<{ tags: readonly string[] }>) => {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag, index) => (
        <Badge key={`${tag}-${index}`} variant="outline" className={TAG_BADGE_CLASS_NAME}>
          {tag}
        </Badge>
      ))}
    </div>
  );
};

export const CategoryBadge = ({ category }: Readonly<{ category: EntryCategory }>) => {
  const { badge } = CATEGORY_STYLES[category];

  return (
    <Badge variant={badge.variant} className={badge.className}>
      {badge.label.toUpperCase()}
    </Badge>
  );
};
