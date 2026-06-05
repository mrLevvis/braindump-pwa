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

// Left-border accent mirrors the dot colors from the old list view.
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
}

export function GridBlock({ entry, status, topPx, heightPx, onSelect }: Readonly<Props>) {
  const { startTime, endTime, date, tags = [] } = entry.payload;
  const showBadges = heightPx >= MIN_BADGE_HEIGHT_PX;
  const dateTimeAttr = date ? `${date}T${startTime}` : startTime;

  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      aria-label={`Eintrag öffnen: ${entry.title ?? entry.original_text}`}
      className={[
        'absolute inset-x-1 rounded-lg overflow-hidden text-left',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        OPACITY_BY_STATUS[status],
        ACCENT_BY_STATUS[status],
      ].join(' ')}
      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
    >
      <Card size="sm" className="h-full rounded-lg py-1 gap-0">
        <CardContent className="px-2 h-full flex flex-col gap-0.5 overflow-hidden">
          <time dateTime={dateTimeAttr} className="text-[10px] font-mono text-muted-foreground leading-none shrink-0">
            {startTime}{endTime ? `–${endTime}` : ''}
          </time>
          <p className="text-xs font-medium leading-tight line-clamp-2 min-w-0 flex-1">
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
  );
}
