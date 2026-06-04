import type { BrainDumpEntry, EntryPayload } from '../../braindump/types';

function buildDateTimeAttr(payload: EntryPayload): string | undefined {
  if (!payload.date) return undefined;
  return payload.time ? `${payload.date}T${payload.time}` : payload.date;
}

const ITEM = ['grid', 'grid-cols-[3rem_1.5rem_1fr]', 'gap-x-2'].join(' ');
const TIME_CELL = [
  'text-right', 'text-xs', 'font-mono', 'tabular-nums',
  'text-muted-foreground', 'pt-1', 'leading-none',
].join(' ');
const SPINE = ['flex', 'flex-col', 'items-center'].join(' ');
const DOT = ['w-2.5', 'h-2.5', 'rounded-full', 'bg-primary', 'mt-0.5', 'shrink-0'].join(' ');
const CONNECTOR = ['w-px', 'flex-1', 'bg-border', 'mt-1'].join(' ');
const CONTENT = ['pb-4', 'min-w-0'].join(' ');
const TITLE = ['text-sm', 'font-medium', 'leading-snug', 'break-words'].join(' ');

interface Props {
  entry: BrainDumpEntry;
  isLast: boolean;
}

export function TimelineItem({ entry, isLast }: Readonly<Props>) {
  const displayTime = entry.payload.time ?? '--:--';
  const dateTimeAttr = buildDateTimeAttr(entry.payload);

  return (
    <div className={ITEM}>
      <time dateTime={dateTimeAttr} className={TIME_CELL}>
        {displayTime}
      </time>
      <div className={SPINE} aria-hidden="true">
        <span className={DOT} />
        {!isLast && <span className={CONNECTOR} />}
      </div>
      <div className={CONTENT}>
        <p className={TITLE}>{entry.title ?? entry.original_text}</p>
      </div>
    </div>
  );
}
