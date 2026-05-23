import type { BrainDumpEntry } from '../types/BrainDump';

interface EntryCardProps {
  entry: BrainDumpEntry;
}

export const EntryCard = ({ entry }: EntryCardProps) => {
  // Wir extrahieren die Uhrzeit aus dem ISO-String für eine saubere Anzeige
  const timeString = new Date(entry.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const categoryTone: Record<BrainDumpEntry['category'], string> = {
    TASK: 'bg-[color:rgba(52,211,153,0.2)] text-[var(--ok)]',
    EVENT: 'bg-[color:rgba(245,158,11,0.2)] text-[var(--warn)]',
    NOTE: 'bg-[color:rgba(57,200,255,0.2)] text-[var(--accent-1)]',
  };

  return (
    <div className="glass-panel-soft mb-3 rounded-[18px] p-4 transition-transform duration-150 hover:-translate-y-0.5">
      <div className="flex justify-between items-start mb-2">
        <p className="font-medium leading-snug text-[var(--text-0)]">
          {entry.original_text}
        </p>
        <span className="ml-4 whitespace-nowrap text-xs text-[var(--text-1)]">
          {timeString}
        </span>
      </div>

      <div className="mt-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] ${categoryTone[entry.category]}`}
        >
          {entry.category}
        </span>
      </div>

      {/* Tags nur rendern, wenn das Array existiert und befüllt ist */}
      {entry.payload.tags && entry.payload.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {entry.payload.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-[color:rgba(168,189,217,0.16)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-1)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};