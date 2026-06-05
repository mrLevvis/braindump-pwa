import { Circle, CircleCheck } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import type { BrainDumpEntry } from '../../braindump/types';
import { CategoryBadge, TagBadgeList } from '../../braindump/views/EntryDetailPanel';
import type { TemporalStatus } from '../getTemporalStatus';

// Height threshold below which badges are hidden to avoid clutter in small blocks.
const MIN_BADGE_HEIGHT_PX = 48;

// ─── Status maps ─────────────────────────────────────────────────────────────

const OPACITY_BY_STATUS: Record<TemporalStatus, string> = {
  past:   'opacity-50 hover:opacity-70 transition-opacity',
  today:  'hover:opacity-90 transition-opacity',
  future: 'opacity-75 hover:opacity-100 transition-opacity',
};

const ACCENT_BY_STATUS: Record<TemporalStatus, string> = {
  past:   'border-l-2 border-emerald-500/60',
  today:  'border-l-2 border-primary',
  future: 'border-l-2 border-muted-foreground/40',
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
    ? 'opacity-40 hover:opacity-55 transition-opacity'
    : OPACITY_BY_STATUS[status];

  return (
    // Outer div: the positioned block container (two sibling buttons inside — valid HTML)
    <div
      className={[
        'absolute inset-x-1 rounded-lg overflow-hidden',
        opacityClass,
        ACCENT_BY_STATUS[status],
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
        <Card size="sm" className="h-full rounded-lg py-1 gap-0">
          <CardContent className={['px-2 h-full flex flex-col gap-0.5 overflow-hidden', isTask ? 'pl-6' : ''].join(' ')}>
            <time dateTime={dateTimeAttr} className="text-[10px] font-mono text-muted-foreground leading-none shrink-0">
              {startTime}{endTime ? `–${endTime}` : ''}
            </time>
            <p className={['text-xs font-medium leading-tight line-clamp-2 min-w-0 flex-1', entry.completed ? 'line-through text-muted-foreground' : ''].join(' ')}>
              {entry.title ?? entry.original_text}
            </p>
            {showBadges && (
              <div className="flex flex-wrap gap-0.5 mt-auto">
                <CategoryBadge category={entry.category} />
                {tags.length > 0 && <TagBadgeList tags={tags} />}
              </div>
            )}
          </CardContent>
        </Card>
      </button>

      {/* Checkbox — only for TASKs, floats above the detail button */}
      {isTask && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggle(entry.id, !entry.completed); }}
          aria-label={entry.completed ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
          aria-pressed={entry.completed}
          className="absolute left-1 top-1 z-10 flex items-center justify-center h-4 w-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-muted-foreground hover:text-foreground transition-colors"
        >
          {entry.completed
            ? <CircleCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            : <Circle className="h-3.5 w-3.5" aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}
