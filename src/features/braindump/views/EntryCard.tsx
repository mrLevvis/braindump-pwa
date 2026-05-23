import type { BrainDumpEntry, EntryCategory } from '../types/BrainDump';

/* -------------------------------------------------------------------------- */
/*                                   Props                                    */
/* -------------------------------------------------------------------------- */

interface EntryCardProps {
  entry: BrainDumpEntry;
}

interface CategoryBadgeProps {
  category: EntryCategory;
}

interface EntryTagsProps {
  tags: readonly string[];
}

/* -------------------------------------------------------------------------- */
/*                              Styling Tokens                                */
/* -------------------------------------------------------------------------- */
/*
 * Diese Klassen sind bewusst zentralisiert, damit:
 * - JSX fokussiert auf Struktur bleibt
 * - visuelle Anpassungen an einer Stelle passieren
 * - Card/Badge/Tag konsistent bleiben
 */

const ENTRY_CARD_CLASS = [
  'glass-panel-soft',
  'mb-3',
  'rounded-[18px]',
  'p-4',
  'transition-all',
  'duration-150',
  'hover:translate-y-[-1px]',
  'hover:shadow-[0_12px_28px_rgba(2,8,23,0.24),inset_0_1px_0_rgba(255,255,255,0.16)]',
].join(' ');

const CATEGORY_COLOR_CLASS: Record<EntryCategory, string> = {
  TASK: ['text-[var(--ok)]', 'bg-[rgba(52,211,153,0.14)]'].join(' '),
  EVENT: ['text-[var(--warn)]', 'bg-[rgba(245,158,11,0.14)]'].join(' '),
  NOTE: ['text-[var(--accent-1)]', 'bg-[rgba(123,227,255,0.12)]'].join(' '),
};

const CATEGORY_BADGE_BASE_CLASS = [
  'inline-flex',
  'rounded-full',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]',
  'px-2.5',
  'py-1',
  'text-[11px]',
  'font-semibold',
  'tracking-wide',
].join(' ');

const TAG_PILL_CLASS = [
  'rounded-md',
  'bg-[rgba(168,189,217,0.1)]',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
  'px-2.5',
  'py-1',
  'text-[10px]',
  'font-semibold',
  'tracking-wide',
  'text-[var(--text-1)]',
].join(' ');

/* -------------------------------------------------------------------------- */
/*                           Formatting / Utilities                           */
/* -------------------------------------------------------------------------- */

const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit'
});

const formatCreatedTime = (createdAtIso: string) => {
  const createdAt = new Date(createdAtIso);

  // Fail-safe fuer unerwartete oder defekte Datumswerte aus APIs/Seeds.
  if (Number.isNaN(createdAt.getTime())) return '--:--';

  return TIME_FORMATTER.format(createdAt);
};

/* -------------------------------------------------------------------------- */
/*                           Presentational Parts                             */
/* -------------------------------------------------------------------------- */

const CategoryBadge = ({ category }: Readonly<CategoryBadgeProps>) => {
  const categoryColorClass = CATEGORY_COLOR_CLASS[category];

  return (
    <span
      className={`${CATEGORY_BADGE_BASE_CLASS} ${categoryColorClass}`}
    >
      {category}
    </span>
  );
};

const EntryTags = ({ tags }: Readonly<EntryTagsProps>) => {
  // Frueher Return haelt den Happy-Path unten kompakt.
  if (tags.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className={TAG_PILL_CLASS}
        >
          {tag}
        </span>
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Container Component                           */
/* -------------------------------------------------------------------------- */

export const EntryCard = ({ entry }: Readonly<EntryCardProps>) => {
  // Daten normalisieren, damit das Rendern unten rein deklarativ bleibt.
  const { created_at, original_text, category, payload } = entry;
  const timeString = formatCreatedTime(created_at);
  const tags = payload.tags ?? [];

  return (
    <article className={ENTRY_CARD_CLASS}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-[15px] font-medium leading-snug text-[var(--text-0)]">
          {original_text}
        </p>
        <time
          className="ml-2 whitespace-nowrap text-xs text-[var(--text-1)]"
          dateTime={created_at}
        >
          {timeString}
        </time>
      </div>

      <div className="mb-3">
        <CategoryBadge category={category} />
      </div>

      <EntryTags tags={tags} />
    </article>
  );
};