import { CardContent } from '../../../components/ui/card';
import { TaskToggle } from '../../../components/TaskToggle';
import type { BrainDumpEntry } from '../../braindump/types';
import { CATEGORY_STYLES, TagBadgeList } from '../../braindump/categoryStyles';
import type { TemporalStatus } from '../getTemporalStatus';

// Height threshold below which tags are hidden to avoid clutter in small blocks.
const MIN_TAGS_HEIGHT_PX = 48;

// ─── Status maps ─────────────────────────────────────────────────────────────

const OPACITY_BY_STATUS: Record<TemporalStatus, string> = {
  past:   'opacity-60 hover:opacity-80 transition-opacity',
  today:  'hover:opacity-90 transition-opacity',
  future: 'opacity-80 hover:opacity-100 transition-opacity',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  entry: BrainDumpEntry;
  status: TemporalStatus;
  topPx: number;
  heightPx: number;
  onSelect: (entry: BrainDumpEntry) => void;
  onToggle: (id: string, completed: boolean) => void;
}

export function GridBlock({ entry, status, topPx, heightPx, onSelect, onToggle }: Readonly<Props>) {
  const { startTime, endTime, date, tags = [] } = entry.payload;
  const showTags = heightPx >= MIN_TAGS_HEIGHT_PX && tags.length > 0;
  const dateTimeAttr = date ? `${date}T${startTime}` : startTime;
  const isTask = entry.category === 'TASK';
  const opacityClass = entry.completed
    ? 'opacity-50 hover:opacity-65 transition-opacity'
    : OPACITY_BY_STATUS[status];
  const { tintBackground, accent } = CATEGORY_STYLES[entry.category];

  return (
    // Outer div: the positioned block container (two sibling buttons inside — valid HTML)
    <div
      data-entry-id={entry.id}
      className={[
        'absolute inset-x-1 rounded-lg overflow-hidden shadow-md',
        'bg-card',
        opacityClass,
      ].join(' ')}
      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
    >
      {/* Category tint overlay — on top of opaque bg-card so hour lines don't bleed through */}
      <div className={['absolute inset-0 pointer-events-none', tintBackground].join(' ')} aria-hidden="true" />

      {/* Detail button — fills the entire block */}
      <button
        type="button"
        onClick={() => onSelect(entry)}
        aria-label={`Eintrag öffnen: ${entry.title ?? entry.original_text}`}
        className="absolute inset-0 w-full h-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <CardContent className={['px-2 py-1 h-full flex flex-col gap-0.5 overflow-hidden bg-transparent', isTask ? 'pr-7' : ''].join(' ')}>
          <time dateTime={dateTimeAttr} className="text-[10px] font-mono text-foreground/60 leading-none shrink-0">
            {startTime}{endTime ? `–${endTime}` : ''}
          </time>
          <p className={['text-xs font-medium leading-tight line-clamp-2 min-w-0 flex-1', entry.completed ? 'line-through opacity-60' : ''].join(' ')}>
            {entry.title ?? entry.original_text}
          </p>
          {showTags && (
            <div className="mt-auto">
              <TagBadgeList tags={tags} />
            </div>
          )}
        </CardContent>
      </button>

      {/* Toggle — only for TASKs, bottom-right corner */}
      {isTask && (
        <TaskToggle
          completed={entry.completed}
          accent={accent}
          size="sm"
          onToggle={() => onToggle(entry.id, !entry.completed)}
          className="absolute bottom-1 right-1 z-10"
        />
      )}
    </div>
  );
}
