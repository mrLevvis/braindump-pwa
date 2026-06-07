import { useState } from 'react';
import { Calendar, Circle, CircleCheck } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { BrainDumpEntry, EntryCategory } from '../types';
import { formatCreatedTime } from '../utils';
import { CATEGORY_STYLES, EntryDetailPanel, TagBadgeList } from './EntryDetailPanel';
import { useToggleTaskCompleted } from '@/hooks';

// ─── Date/time helpers ────────────────────────────────────────────────────────

const DAY_FMT = new Intl.DateTimeFormat('de-DE', { day: 'numeric' });
const MONTH_FMT = new Intl.DateTimeFormat('de-DE', { month: 'short' });

function parseDateBlock(iso: string): { day: string; month: string } | null {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return {
    day: DAY_FMT.format(d),
    month: MONTH_FMT.format(d).replace('.', ''),
  };
}

function fmtTime(startTime?: string, endTime?: string): string | null {
  if (!startTime) return null;
  return endTime ? `${startTime}–${endTime} Uhr` : `${startTime} Uhr`;
}

// ─── Shared class constants ───────────────────────────────────────────────────

const CARD_BASE = ['gap-3', 'rounded-2xl', 'py-4', 'transition', 'hover:shadow-sm'].join(' ');

const CARD_BTN = [
  'w-full', 'rounded-2xl', 'text-left',
  'focus-visible:outline-none', 'focus-visible:ring-2',
  'focus-visible:ring-ring', 'focus-visible:ring-offset-2',
].join(' ');

const FOOTER_CLS = 'px-4 pt-0 text-xs text-muted-foreground';

const TOGGLE_BTN = [
  'absolute bottom-4 right-4 z-10',
  'flex items-center justify-center h-9 w-9 rounded-lg',
  'hover:bg-muted/50 transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
].join(' ');

// ─── Card component props ─────────────────────────────────────────────────────

interface CardProps {
  entry: BrainDumpEntry;
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({ entry }: Readonly<CardProps>) {
  const [open, setOpen] = useState(false);
  const toggle = useToggleTaskCompleted();
  const { tintBackground, accent } = CATEGORY_STYLES.TASK;
  const title = entry.title?.trim() || 'Untitled';
  const tags = entry.payload?.tags ?? [];

  return (
    <>
      <div className="relative">
        <button type="button" className={CARD_BTN} onClick={() => setOpen(true)}>
          <Card className={[CARD_BASE, tintBackground, entry.completed ? 'opacity-60' : ''].join(' ')} size="sm">
            <CardContent className="space-y-1.5 px-4 pr-12">
              <p className={['text-sm font-semibold leading-snug', entry.completed ? 'line-through text-muted-foreground' : ''].join(' ')}>
                {title}
              </p>
              <TagBadgeList tags={tags} />
            </CardContent>
            <CardFooter className={FOOTER_CLS}>
              <time dateTime={entry.created_at}>{formatCreatedTime(entry.created_at)}</time>
            </CardFooter>
          </Card>
        </button>

        <button
          type="button"
          className={TOGGLE_BTN}
          onClick={() => toggle(entry.id, !entry.completed)}
          aria-label={entry.completed ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
          aria-pressed={entry.completed}
        >
          {entry.completed
            ? <CircleCheck className="h-7 w-7 text-emerald-500" aria-hidden="true" />
            : <Circle className={['h-7 w-7', accent].join(' ')} aria-hidden="true" />}
        </button>
      </div>

      <EntryDetailPanel entry={entry} open={open} onOpenChange={setOpen} />
    </>
  );
}

// ─── EventCard ────────────────────────────────────────────────────────────────

function EventCard({ entry }: Readonly<CardProps>) {
  const [open, setOpen] = useState(false);
  const { tintBackground, accentBg } = CATEGORY_STYLES.EVENT;
  const title = entry.title?.trim() || 'Untitled';
  const tags = entry.payload?.tags ?? [];
  const dateBlock = entry.payload?.date ? parseDateBlock(entry.payload.date) : null;
  const timeStr = fmtTime(entry.payload?.startTime, entry.payload?.endTime);

  return (
    <>
      <button type="button" className={CARD_BTN} onClick={() => setOpen(true)}>
        <Card className={[CARD_BASE, tintBackground].join(' ')} size="sm">
          <CardContent className="flex items-start gap-3 px-4">
            <div
              className={['shrink-0 flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 min-w-[2.75rem]', accentBg].join(' ')}
              aria-hidden="true"
            >
              {dateBlock ? (
                <>
                  <span className="text-base font-bold text-white leading-none">{dateBlock.day}</span>
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wide">{dateBlock.month}</span>
                </>
              ) : (
                <Calendar className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-sm font-semibold leading-snug">{title}</p>
              {timeStr && <p className="text-xs text-muted-foreground">{timeStr}</p>}
              <TagBadgeList tags={tags} />
            </div>
          </CardContent>
          <CardFooter className={FOOTER_CLS}>
            <time dateTime={entry.created_at}>{formatCreatedTime(entry.created_at)}</time>
          </CardFooter>
        </Card>
      </button>

      <EntryDetailPanel entry={entry} open={open} onOpenChange={setOpen} />
    </>
  );
}

// ─── NoteCard ─────────────────────────────────────────────────────────────────

function NoteCard({ entry }: Readonly<CardProps>) {
  const [open, setOpen] = useState(false);
  const { tintBackground } = CATEGORY_STYLES.NOTE;
  const title = entry.title?.trim() || 'Untitled';
  const tags = entry.payload?.tags ?? [];

  return (
    <>
      <button type="button" className={CARD_BTN} onClick={() => setOpen(true)}>
        <Card className={[CARD_BASE, tintBackground].join(' ')} size="sm">
          <CardContent className="space-y-1.5 px-4">
            <p className="text-sm font-semibold leading-snug">{title}</p>
            <TagBadgeList tags={tags} />
          </CardContent>
          <CardFooter className={FOOTER_CLS}>
            <time dateTime={entry.created_at}>{formatCreatedTime(entry.created_at)}</time>
          </CardFooter>
        </Card>
      </button>

      <EntryDetailPanel entry={entry} open={open} onOpenChange={setOpen} />
    </>
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

const CARD_REGISTRY: Record<EntryCategory, React.ComponentType<CardProps>> = {
  TASK: TaskCard,
  EVENT: EventCard,
  NOTE: NoteCard,
};

export function resolveEntryCard(category: EntryCategory): React.ComponentType<CardProps> {
  return CARD_REGISTRY[category];
}

// ─── EntryCard ────────────────────────────────────────────────────────────────

export function EntryCard({ entry }: Readonly<{ entry: BrainDumpEntry }>) {
  const CardComponent = resolveEntryCard(entry.category);
  return <CardComponent entry={entry} />;
}
