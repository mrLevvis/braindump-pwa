import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BrainDumpEntry, EntryPayload } from '../../braindump/types';
import { CategoryBadge, TagBadgeList } from '../../braindump/views';
import type { TemporalStatus } from '../getTemporalStatus';

// Status → styling maps — no inline ternaries in JSX
const STATUS_TIME: Record<TemporalStatus, string> = {
  past:   'text-muted-foreground/50',
  today:  'text-primary font-medium',
  future: 'text-muted-foreground',
};
const STATUS_DOT: Record<TemporalStatus, string> = {
  past:   'bg-muted-foreground/30',
  today:  'bg-primary',
  future: 'bg-foreground/50',
};
const STATUS_CONNECTOR: Record<TemporalStatus, string> = {
  past:   'w-0 flex-1 border-l-2 border-dashed border-muted-foreground/25 mt-1',
  today:  'w-px flex-1 bg-primary/50 mt-1',
  future: 'w-px flex-1 bg-border mt-1',
};
const STATUS_CARD: Record<TemporalStatus, string> = {
  past:   'opacity-60',
  today:  '',
  future: '',
};

const ROW = [
  'w-full', 'text-left',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');
const GRID = ['grid', 'grid-cols-[3rem_1.5rem_1fr]', 'gap-x-2'].join(' ');
const TIME_CELL = [
  'text-right', 'text-xs', 'font-mono', 'tabular-nums',
  'pt-3.5', 'leading-none',
].join(' ');
const SPINE = ['flex', 'flex-col', 'items-center'].join(' ');
const DOT = ['w-2.5', 'h-2.5', 'rounded-full', 'mt-3.5', 'shrink-0'].join(' ');
const CARD_WRAP = ['pb-3', 'min-w-0'].join(' ');
const CARD_CLASS = [
  'gap-2', 'rounded-2xl', 'py-3',
  'transition', 'hover:border-foreground/20', 'hover:shadow-sm',
].join(' ');
const CARD_HEADER_CLASS = [
  'flex', 'flex-row', 'items-start', 'justify-between', 'gap-2',
  'px-3', 'pb-0',
].join(' ');
const CARD_CONTENT_CLASS = ['px-3', 'pt-0'].join(' ');

function buildDateTimeAttr(payload: EntryPayload): string | undefined {
  if (!payload.date) return undefined;
  return payload.time ? `${payload.date}T${payload.time}` : payload.date;
}

interface Props {
  entry: BrainDumpEntry;
  isLast: boolean;
  status: TemporalStatus;
  onSelect: (entry: BrainDumpEntry) => void;
}

export function TimelineItem({ entry, isLast, status, onSelect }: Readonly<Props>) {
  const displayTime = entry.payload.time ?? '--:--';
  const dateTimeAttr = buildDateTimeAttr(entry.payload);
  const title = entry.title?.trim() || entry.original_text;
  const tags = entry.payload.tags ?? [];

  return (
    <button type="button" className={ROW} onClick={() => onSelect(entry)}>
      <div className={GRID}>
        <time dateTime={dateTimeAttr} className={`${TIME_CELL} ${STATUS_TIME[status]}`}>
          {displayTime}
        </time>
        <div className={SPINE} aria-hidden="true">
          <span className={`${DOT} ${STATUS_DOT[status]}`} />
          {!isLast && <span className={STATUS_CONNECTOR[status]} />}
        </div>
        <div className={CARD_WRAP}>
          <Card size="sm" className={`${CARD_CLASS} ${STATUS_CARD[status]}`}>
            <CardHeader className={CARD_HEADER_CLASS}>
              <CardTitle className="text-sm leading-snug break-words">{title}</CardTitle>
              <CategoryBadge category={entry.category} />
            </CardHeader>
            {tags.length > 0 && (
              <CardContent className={CARD_CONTENT_CLASS}>
                <TagBadgeList tags={tags} />
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </button>
  );
}
