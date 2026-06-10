import { CATEGORY_STYLES } from '../categoryStyles';
import type { EntryCategory } from '../types';

const CATEGORIES: readonly EntryCategory[] = ['TASK', 'EVENT', 'NOTE'];

const LABEL: Record<EntryCategory, string> = {
  TASK: 'Task',
  EVENT: 'Event',
  NOTE: 'Note',
};

const TAB_BASE = [
  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5',
  'text-sm font-medium shrink-0 transition-colors select-none',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
].join(' ');

const TAB_INACTIVE = [TAB_BASE, 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'].join(' ');
const TAB_ALL_ACTIVE = [TAB_BASE, 'bg-muted text-foreground'].join(' ');

interface Props {
  activeCategories: readonly EntryCategory[];
  onToggle: (cat: EntryCategory) => void;
  onClear: () => void;
}

export function CategoryFilterTabs({ activeCategories, onToggle, onClear }: Readonly<Props>) {
  const isAll = activeCategories.length === 0;

  return (
    <div
      className="flex items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="toolbar"
      aria-label="Kategorie-Filter"
    >
      <button type="button" className={isAll ? TAB_ALL_ACTIVE : TAB_INACTIVE} onClick={onClear} aria-pressed={isAll}>
        Alle
      </button>

      {CATEGORIES.map(cat => {
        const isActive = activeCategories.includes(cat);
        const { tintBackground, accentBg } = CATEGORY_STYLES[cat];
        const tabClass = isActive
          ? [TAB_BASE, tintBackground, 'text-foreground'].join(' ')
          : TAB_INACTIVE;

        return (
          <button
            key={cat}
            type="button"
            className={tabClass}
            onClick={() => onToggle(cat)}
            aria-pressed={isActive}
          >
            <span className={['h-2 w-2 rounded-full shrink-0', accentBg].join(' ')} aria-hidden="true" />
            {LABEL[cat]}
          </button>
        );
      })}
    </div>
  );
}
