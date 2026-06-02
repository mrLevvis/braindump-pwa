import type { BrainDumpEntry } from '../types';
import { EntryCard } from './';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EMPTY_STATE_CARD_CLASS_NAME = ['rounded-2xl', 'border-dashed', 'bg-muted/20'].join(' ');
const EMPTY_STATE_HEADER_CLASS_NAME = ['px-4', 'pb-0', 'pt-4', 'text-center'].join(' ');
const EMPTY_STATE_CONTENT_CLASS_NAME = ['px-4', 'pb-4', 'pt-2', 'text-center', 'text-sm', 'text-muted-foreground'].join(' ');

const EmptyEntriesState = () => (
  <Card size="sm" className={EMPTY_STATE_CARD_CLASS_NAME}>
    <CardHeader className={EMPTY_STATE_HEADER_CLASS_NAME}>
      <CardTitle>Noch keine Gedanken sortiert.</CardTitle>
    </CardHeader>
    <CardContent className={EMPTY_STATE_CONTENT_CLASS_NAME}>
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
