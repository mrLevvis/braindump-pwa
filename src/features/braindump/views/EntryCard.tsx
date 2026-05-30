import type { BrainDumpEntry } from '../types';
import { formatCreatedTime } from '../utils';

export default function EntryCard({ entry }: { entry: BrainDumpEntry }) {
  const createdTime = formatCreatedTime(entry.created_at);
  const originalText = entry.original_text;
  const category = entry.category;
  const tags = entry.payload?.tags ?? [];

  return (
    <div>
      <span>{createdTime}  </span>
      <span>{originalText}  </span>

      <div>
        <span>{category}  </span>

        {tags.length > 0 && (
          <span>{tags.join(', ')}  </span>
        )}
      </div> 
      <div>.</div>
    </div>
  );
}
