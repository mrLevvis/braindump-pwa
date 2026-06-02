import type { BrainDumpEntry } from '../types';
import { EntryCard } from './';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EmptyEntriesState = () => (
  <Card size="sm" className="rounded-2xl py-4">
    <CardHeader className="px-4 pb-0">
      <CardTitle>Noch keine Gedanken sortiert.</CardTitle>
    </CardHeader>
    <CardContent className="px-4 pt-2 text-sm text-muted-foreground">
      <p>Sprich oder schreibe deinen ersten Gedanken auf.</p>
    </CardContent>
  </Card>
);

export default function EntryList({ entries }: { entries: readonly BrainDumpEntry[] }) {
  if (!entries || entries.length === 0) return <EmptyEntriesState />;

  // Chronologisch sortieren (älteste unten, neueste oben)
  const sortedEntries = [...entries].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <ul className="space-y-3">
      {sortedEntries.map((entry) => (
        <li key={entry.id}>
          <EntryCard entry={entry} />
        </li>
      ))}
    </ul>
  );
}
