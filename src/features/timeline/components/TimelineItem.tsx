import { Card, CardContent } from '../../../components/ui/card';
import type { BrainDumpEntry, EntryPayload } from '../../braindump/types';
import { CategoryBadge, TagBadgeList } from '../../braindump/views/EntryDetailPanel';
import type { TemporalStatus } from '../getTemporalStatus';

function buildDateTimeAttr(payload: EntryPayload): string | undefined {
  if (!payload.date) return undefined;
  return payload.time ? `${payload.date}T${payload.time}` : payload.date;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const ITEM = ['grid', 'grid-cols-[3rem_2rem_1fr]', 'gap-x-2'].join(' ');

// ─── Time cell ────────────────────────────────────────────────────────────────

const TIME_BASE = ['text-xs', 'font-mono', 'tabular-nums', 'text-right', 'pt-2', 'leading-none', 'self-start'].join(' ');
const TIME_BY_STATUS: Record<TemporalStatus, string> = {
  past:   [TIME_BASE, 'text-muted-foreground/50'].join(' '),
  today:  [TIME_BASE, 'text-muted-foreground'].join(' '),
  future: [TIME_BASE, 'text-muted-foreground/70'].join(' '),
};

// ─── Spine ────────────────────────────────────────────────────────────────────

const SPINE = ['flex', 'flex-col', 'items-center'].join(' ');

const DOT_BY_STATUS: Record<TemporalStatus, string> = {
  past:   ['h-2.5', 'w-2.5', 'rounded-full', 'bg-emerald-500/70', 'shrink-0', 'mt-1.5'].join(' '),
  today:  ['h-2.5', 'w-2.5', 'rounded-full', 'bg-primary', 'ring-2', 'ring-primary/25', 'shrink-0', 'mt-1.5'].join(' '),
  future: ['h-2.5', 'w-2.5', 'rounded-full', 'bg-muted-foreground/30', 'shrink-0', 'mt-1.5'].join(' '),
};

// Solid for past (already happened), dashed for everything still ahead
const CONNECTOR_SOLID  = ['w-px', 'flex-1', 'bg-border', 'mt-1'].join(' ');
const CONNECTOR_DASHED = ['w-0', 'flex-1', 'border-l-[1.5px]', 'border-dashed', 'border-border/60', 'mt-1'].join(' ');

function connectorClass(status: TemporalStatus): string {
  return status === 'past' ? CONNECTOR_SOLID : CONNECTOR_DASHED;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

const CARD_BTN = [
  'w-full', 'text-left', 'pb-3',
  'rounded-2xl',
  'focus-visible:outline-none', 'focus-visible:ring-2',
  'focus-visible:ring-ring', 'focus-visible:ring-offset-2',
].join(' ');

const CARD_WRAPPER_BY_STATUS: Record<TemporalStatus, string> = {
  past:   'opacity-60 transition-opacity hover:opacity-80',
  today:  'transition-opacity hover:opacity-90',
  future: 'opacity-80 transition-opacity hover:opacity-100',
};

const CARD_TITLE = ['text-sm', 'font-medium', 'leading-snug', 'mb-2'].join(' ');
const CARD_BADGES = ['flex', 'flex-wrap', 'items-center', 'gap-1.5'].join(' ');

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  entry: BrainDumpEntry;
  status: TemporalStatus;
  isLast: boolean;
  onSelect: (entry: BrainDumpEntry) => void;
}

export function TimelineItem({ entry, status, isLast, onSelect }: Readonly<Props>) {
  const displayTime = entry.payload.time ?? '--:--';
  const dateTimeAttr = buildDateTimeAttr(entry.payload);
  const tags = entry.payload.tags ?? [];

  return (
    <div className={ITEM}>
      <time dateTime={dateTimeAttr} className={TIME_BY_STATUS[status]}>
        {displayTime}
      </time>

      <div className={SPINE} aria-hidden="true">
        <span className={DOT_BY_STATUS[status]} />
        {!isLast && <span className={connectorClass(status)} />}
      </div>

      <button
        type="button"
        className={CARD_BTN}
        onClick={() => onSelect(entry)}
        aria-label={`Eintrag öffnen: ${entry.title ?? entry.original_text}`}
      >
        <div className={CARD_WRAPPER_BY_STATUS[status]}>
          <Card size="sm" className="py-3 gap-2">
            <CardContent className="px-4">
              <p className={CARD_TITLE}>{entry.title ?? entry.original_text}</p>
              <div className={CARD_BADGES}>
                <CategoryBadge category={entry.category} />
                <TagBadgeList tags={tags} />
              </div>
            </CardContent>
          </Card>
        </div>
      </button>
    </div>
  );
}
