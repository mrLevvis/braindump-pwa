import type { BrainDumpEntry } from '../types';
import { formatCreatedTime } from '../utils';

export default function EntryCard({ entry }: { entry: BrainDumpEntry }) {
  const tags = entry.payload?.tags ?? [];

  return (
    <div>
      <span>{entry.original_text}</span>
      <span> </span>
      <span>{formatCreatedTime(entry.created_at)}</span>

      {tags.length > 0 && (
        <div>
          <span>{tags.join(', ')}</span>
        </div>
      )}

    </div>
  );
}
