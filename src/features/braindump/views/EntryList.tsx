import type { BrainDumpEntry } from '../types';
import { EntryCard } from './';

const EmptyEntriesState = () => (
  <div>
    <p>Noch keine Gedanken sortiert.</p>
    <p>Sprich oder schreibe deinen ersten Gedanken auf.</p>
  </div>
);

export default function EntryList({ entries }: { entries: readonly BrainDumpEntry[] }) {
  if (!entries || entries.length === 0) return <EmptyEntriesState />;

  // Chronologisch sortieren (älteste unten, neueste oben)
  const sortedEntries = [...entries].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  return (
    <ul>
      {sortedEntries.map((entry) => (
        <li key={entry.id}>
          <EntryCard entry={entry} />
        </li>
      ))}
    </ul>
  );
}
