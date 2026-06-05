import { Circle, CircleCheck } from 'lucide-react';
import { CardContent } from '../../../components/ui/card';
import type { BrainDumpEntry } from '../../braindump/types';
import { CategoryBadge, TagBadgeList } from '../../braindump/views/EntryDetailPanel';
import type { TemporalStatus } from '../getTemporalStatus';

// Height threshold below which badges are hidden to avoid clutter in small blocks.
const MIN_BADGE_HEIGHT_PX = 48;

// ─── Status maps ─────────────────────────────────────────────────────────────

const OPACITY_BY_STATUS: Record<TemporalStatus, string> = {
  past:   'opacity-60 hover:opacity-80 transition-opacity',
  today:  'hover:opacity-90 transition-opacity',
  future: 'opacity-80 hover:opacity-100 transition-opacity',
};

// Background + left accent per status — applied to the outer container so it
// shows through a transparent card, giving blocks a distinct colored chip look.
const STYLE_BY_STATUS: Record<TemporalStatus, string> = {
  past:   'border-l-2 border-emerald-500/50 bg-muted/40',
  today:  'border-l-2 border-primary bg-primary/10',
  future: 'border-l-2 border-muted-foreground/30 bg-muted/25',
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
  const showBadges = heightPx >= MIN_BADGE_HEIGHT_PX;
  const dateTimeAttr = date ? `${date}T${startTime}` : startTime;
  const isTask = entry.category === 'TASK';
  const opacityClass = entry.completed
    ? 'opacity-50 hover:opacity-65 transition-opacity'
    : OPACITY_BY_STATUS[status];

  return (
    // Outer div: the positioned block container (two sibling buttons inside — valid HTML)
    <div
      className={[
        'absolute inset-x-1 rounded-lg overflow-hidden shadow-sm',
        opacityClass,
        STYLE_BY_STATUS[status],
      ].join(' ')}
      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
    >
      {/* Detail button — fills the entire block */}
      <button
        type="button"
        onClick={() => onSelect(entry)}
        aria-label={`Eintrag öffnen: ${entry.title ?? entry.original_text}`}
        className="absolute inset-0 w-full h-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        {/* Transparent card so the outer div's background shows through */}
        <CardContent className={['px-2 py-1 h-full flex flex-col gap-0.5 overflow-hidden bg-transparent', isTask ? 'pr-7' : ''].join(' ')}>
          <time dateTime={dateTimeAttr} className="text-[10px] font-mono text-foreground/60 leading-none shrink-0">
            {startTime}{endTime ? `–${endTime}` : ''}
          </time>
          <p className={['text-xs font-medium leading-tight line-clamp-2 min-w-0 flex-1', entry.completed ? 'line-through opacity-60' : ''].join(' ')}>
            {entry.title ?? entry.original_text}
          </p>
          {showBadges && (
            <div className="flex flex-wrap gap-0.5 mt-auto">
              <CategoryBadge category={entry.category} />
              {tags.length > 0 && <TagBadgeList tags={tags} />}
            </div>
          )}
        </CardContent>
      </button>

      {/* Toggle — only for TASKs, bottom-right corner */}
      {isTask && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggle(entry.id, !entry.completed); }}
          aria-label={entry.completed ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
          aria-pressed={entry.completed}
          className="absolute bottom-1 right-1 z-10 flex items-center justify-center h-6 w-6 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground/40 hover:text-emerald-500 transition-colors"
        >
          {entry.completed
            ? <CircleCheck className="h-5 w-5 text-emerald-500" aria-hidden="true" />
            : <Circle className="h-5 w-5" aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}
