import type { BrainDumpEntry, EntryCategory } from '../types/BrainDump';
import { EntryCard } from './EntryCard';

/* -------------------------------------------------------------------------- */
/*                                   Props                                    */
/* -------------------------------------------------------------------------- */

interface EntryListProps {
  entries: readonly BrainDumpEntry[];
}

interface EntrySectionConfig {
  category: EntryCategory;
  icon: string;
  label: string;
}

interface EntrySectionProps {
  icon: string;
  label: string;
  entries: readonly BrainDumpEntry[];
}

/* -------------------------------------------------------------------------- */
/*                              Styling Tokens                                */
/* -------------------------------------------------------------------------- */

const LIST_CONTAINER_CLASS = 'flex-1 overflow-y-auto px-4 pb-40 pt-2';
const SECTION_CONTAINER_CLASS = 'mb-6';
const SECTION_TITLE_CLASS = 'section-label mb-3 px-1';
const EMPTY_STATE_CONTAINER_CLASS = [
  'mt-12',
  'flex',
  'flex-col',
  'items-center',
  'justify-center',
  'p-8',
  'text-center',
].join(' ');
const EMPTY_STATE_TITLE_CLASS = 'text-sm text-[var(--text-1)]';
const EMPTY_STATE_HINT_CLASS = [
  'mt-1',
  'text-xs',
  'text-[color:color-mix(in_srgb,var(--text-1),white_8%)]',
].join(' ');

/* -------------------------------------------------------------------------- */
/*                           Section Configuration                            */
/* -------------------------------------------------------------------------- */

const ENTRY_SECTIONS: readonly EntrySectionConfig[] = [
  { category: 'TASK', icon: '🎯', label: 'Aufgaben' },
  { category: 'EVENT', icon: '📅', label: 'Termine' },
  { category: 'NOTE', icon: '📝', label: 'Notizen' },
];

const createEmptyGroups = (): Record<EntryCategory, BrainDumpEntry[]> => ({
  TASK: [],
  EVENT: [],
  NOTE: [],
});

/* -------------------------------------------------------------------------- */
/*                           Formatting / Utilities                           */
/* -------------------------------------------------------------------------- */

const groupEntriesByCategory = (entries: readonly BrainDumpEntry[]) => {
  return entries.reduce<Record<EntryCategory, BrainDumpEntry[]>>((groups, entry) => {
    groups[entry.category].push(entry);
    return groups;
  }, createEmptyGroups());
};

/* -------------------------------------------------------------------------- */
/*                           Presentational Parts                             */
/* -------------------------------------------------------------------------- */

const EmptyEntriesState = () => (
  <div className={EMPTY_STATE_CONTAINER_CLASS}>
    <p className={EMPTY_STATE_TITLE_CLASS}>Noch keine Gedanken sortiert.</p>
    <p className={EMPTY_STATE_HINT_CLASS}>Sprich oder schreibe deinen ersten Gedanken auf.</p>
  </div>
);

const EntrySection = ({ icon, label, entries }: Readonly<EntrySectionProps>) => (
  <div className={SECTION_CONTAINER_CLASS}>
    <h2 className={SECTION_TITLE_CLASS}>
      {icon} {label} ({entries.length})
    </h2>
    {entries.map((entry) => (
      <EntryCard key={entry.id} entry={entry} />
    ))}
  </div>
);

/* -------------------------------------------------------------------------- */
/*                              Container Component                           */
/* -------------------------------------------------------------------------- */

export const EntryList = ({ entries }: Readonly<EntryListProps>) => {
  if (entries.length === 0) return <EmptyEntriesState />;

  const entriesByCategory = groupEntriesByCategory(entries);

  return (
    <div className={LIST_CONTAINER_CLASS}>
      {ENTRY_SECTIONS
        .filter(({ category }) => entriesByCategory[category].length > 0)
        .map(({ category, icon, label }) => {
          const sectionEntries = entriesByCategory[category];

          return (
          <EntrySection
            key={category}
            icon={icon}
            label={label}
            entries={sectionEntries}
          />
          );
        })}
    </div>
  );
};