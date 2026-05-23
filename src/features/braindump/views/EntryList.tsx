import type { BrainDumpEntry } from '../types/BrainDump';
import { EntryCard } from './EntryCard';

interface EntryListProps {
  entries: BrainDumpEntry[];
}

export const EntryList = ({ entries }: EntryListProps) => {
  if (entries.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm text-[var(--text-1)]">Noch keine Gedanken sortiert.</p>
        <p className="mt-1 text-xs text-[color:color-mix(in_srgb,var(--text-1),white_8%)]">
          Sprich oder schreibe deinen ersten Gedanken auf.
        </p>
      </div>
    );
  }

  const tasks = entries.filter((e) => e.category === 'TASK');
  const events = entries.filter((e) => e.category === 'EVENT');
  const notes = entries.filter((e) => e.category === 'NOTE');

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-40 pt-2">
      {tasks.length > 0 && (
        <div className="mb-6">
          <h2 className="section-label mb-3 px-1">
            🎯 Aufgaben ({tasks.length})
          </h2>
          {tasks.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {events.length > 0 && (
        <div className="mb-6">
          <h2 className="section-label mb-3 px-1">
            📅 Termine ({events.length})
          </h2>
          {events.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {notes.length > 0 && (
        <div className="mb-6">
          <h2 className="section-label mb-3 px-1">
            📝 Notizen ({notes.length})
          </h2>
          {notes.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
};