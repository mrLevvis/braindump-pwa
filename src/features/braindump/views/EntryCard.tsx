import { useState } from 'react';
import { Calendar, CheckCircle2, Circle, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { TaskToggle } from '@/components/TaskToggle';
import type { BrainDumpEntry, EntryCategory } from '../types';
import { formatCreatedTime, formatCreatedDateTime } from '../utils';
import { CATEGORY_STYLES, TagBadgeList } from '../categoryStyles';
import { EntryDetailPanel } from './EntryDetailPanel';
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

const FOOTER_CLS = 'px-4 pt-0 text-[10px] text-muted-foreground';

// ─── Selection indicator ──────────────────────────────────────────────────────

function SelectionIndicator({ isSelected }: Readonly<{ isSelected: boolean }>) {
  return (
    <div className="pointer-events-none absolute top-3 right-3 z-10">
      {isSelected
        ? <CheckCircle2 className="h-5 w-5 text-primary" />
        : <Circle className="h-5 w-5 text-muted-foreground/40" />}
    </div>
  );
}

// ─── Card component props ─────────────────────────────────────────────────────

interface SelectionMode {
  isSelected: boolean;
  onToggleSelect: () => void;
}

interface CardProps {
  entry: BrainDumpEntry;
  selectionMode?: SelectionMode;
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({ entry, selectionMode }: Readonly<CardProps>) {
  const [open, setOpen] = useState(false);
  const toggle = useToggleTaskCompleted();
  const { tintBackground, accent, accentBg } = CATEGORY_STYLES.TASK;
  const title = entry.title?.trim() || 'Untitled';
  const tags = entry.payload?.tags ?? [];
  const selectedRing = selectionMode?.isSelected ? 'ring-2 ring-primary ring-offset-1' : '';
  const dateBlock = entry.payload?.date ? parseDateBlock(entry.payload.date) : null;
  const timeStr = fmtTime(entry.payload?.startTime, entry.payload?.endTime);
  const hasTiming = dateBlock !== null || timeStr !== null;

  const handleClick = () => {
    if (selectionMode) selectionMode.onToggleSelect();
    else setOpen(true);
  };

  return (
    <>
      <div className="relative">
        <button type="button" className={CARD_BTN} onClick={handleClick}>
          <Card className={[CARD_BASE, tintBackground, entry.completed ? 'opacity-60' : '', selectedRing].join(' ')} size="sm">
            <CardContent className={hasTiming ? 'flex items-start gap-3 px-4' : 'space-y-1.5 px-4 pr-12'}>
              {hasTiming && (
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
              )}
              <div className={['min-w-0 flex-1 space-y-1.5', hasTiming ? 'pr-10' : ''].join(' ')}>
                <p className={['text-sm font-semibold leading-snug', entry.completed ? 'line-through text-muted-foreground' : ''].join(' ')}>
                  {title}
                </p>
                {timeStr && <p className="text-xs text-muted-foreground">{timeStr}</p>}
                <TagBadgeList tags={tags} />
              </div>
            </CardContent>
            <CardFooter className={FOOTER_CLS}>
              <time dateTime={entry.created_at}>erstellt am {formatCreatedDateTime(entry.created_at)} um {formatCreatedTime(entry.created_at)} Uhr</time>
            </CardFooter>
          </Card>
        </button>

        {selectionMode
          ? <SelectionIndicator isSelected={selectionMode.isSelected} />
          : (
            <TaskToggle
              completed={entry.completed}
              accent={accent}
              size="lg"
              onToggle={() => toggle(entry.id, !entry.completed)}
              className="absolute bottom-4 right-4 z-10"
            />
          )}
      </div>

      {!selectionMode && <EntryDetailPanel entry={entry} open={open} onOpenChange={setOpen} />}
    </>
  );
}

// ─── EventCard ────────────────────────────────────────────────────────────────

function EventCard({ entry, selectionMode }: Readonly<CardProps>) {
  const [open, setOpen] = useState(false);
  const { tintBackground, accentBg } = CATEGORY_STYLES.EVENT;
  const title = entry.title?.trim() || 'Untitled';
  const tags = entry.payload?.tags ?? [];
  const dateBlock = entry.payload?.date ? parseDateBlock(entry.payload.date) : null;
  const timeStr = fmtTime(entry.payload?.startTime, entry.payload?.endTime);
  const selectedRing = selectionMode?.isSelected ? 'ring-2 ring-primary ring-offset-1' : '';

  const handleClick = () => {
    if (selectionMode) selectionMode.onToggleSelect();
    else setOpen(true);
  };

  return (
    <>
      <div className="relative">
        <button type="button" className={CARD_BTN} onClick={handleClick}>
          <Card className={[CARD_BASE, tintBackground, selectedRing].join(' ')} size="sm">
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
                <time dateTime={entry.created_at}>erstellt am {formatCreatedDateTime(entry.created_at)} um {formatCreatedTime(entry.created_at)} Uhr</time>
            </CardFooter>
          </Card>
        </button>

        {selectionMode && <SelectionIndicator isSelected={selectionMode.isSelected} />}
      </div>

      {!selectionMode && <EntryDetailPanel entry={entry} open={open} onOpenChange={setOpen} />}
    </>
  );
}

// ─── NoteCard ─────────────────────────────────────────────────────────────────

function NoteCard({ entry, selectionMode }: Readonly<CardProps>) {
  const [open, setOpen] = useState(false);
  const { tintBackground } = CATEGORY_STYLES.NOTE;
  const title = entry.title?.trim() || 'Untitled';
  const tags = entry.payload?.tags ?? [];
  const selectedRing = selectionMode?.isSelected ? 'ring-2 ring-primary ring-offset-1' : '';

  const handleClick = () => {
    if (selectionMode) selectionMode.onToggleSelect();
    else setOpen(true);
  };

  return (
    <>
      <div className="relative">
        <button type="button" className={CARD_BTN} onClick={handleClick}>
          <Card className={[CARD_BASE, tintBackground, selectedRing].join(' ')} size="sm">
            <CardContent className="space-y-1.5 px-4">
              <p className="text-sm font-semibold leading-snug">{title}</p>
              <TagBadgeList tags={tags} />
            </CardContent>
            <CardFooter className={FOOTER_CLS}>
                <time dateTime={entry.created_at}>erstellt am {formatCreatedDateTime(entry.created_at)} um {formatCreatedTime(entry.created_at)} Uhr</time>
            </CardFooter>
          </Card>
        </button>

        {selectionMode && <SelectionIndicator isSelected={selectionMode.isSelected} />}
      </div>

      {!selectionMode && <EntryDetailPanel entry={entry} open={open} onOpenChange={setOpen} />}
    </>
  );
}

// ─── ShoppingCard ─────────────────────────────────────────────────────────────


function ShoppingCard({ entry, selectionMode }: Readonly<CardProps>) {
  const [open, setOpen] = useState(false);
  const { tintBackground } = CATEGORY_STYLES.SHOPPING;
  const title = entry.title?.trim() || 'Einkaufsliste';
  const items = entry.payload?.items ?? [];
  const itemLabels = items.map((i) => (typeof i === 'string' ? i : i.label));
  const selectedRing = selectionMode?.isSelected ? 'ring-2 ring-primary ring-offset-1' : '';

  const handleClick = () => {
    if (selectionMode) selectionMode.onToggleSelect();
    else setOpen(true);
  };

  return (
    <>
      <div className="relative">
        <button type="button" className={CARD_BTN} onClick={handleClick}>
          <Card className={[CARD_BASE, tintBackground, selectedRing].join(' ')} size="sm">
            <CardContent className="space-y-2 px-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <p className="text-sm font-semibold leading-snug">{title}</p>
              </div>
              {itemLabels.length > 0 && <TagBadgeList tags={itemLabels} />}
            </CardContent>
            <CardFooter className={FOOTER_CLS}>
              <time dateTime={entry.created_at}>erstellt am {formatCreatedDateTime(entry.created_at)} um {formatCreatedTime(entry.created_at)} Uhr</time>
            </CardFooter>
          </Card>
        </button>

        {selectionMode && <SelectionIndicator isSelected={selectionMode.isSelected} />}
      </div>

      {!selectionMode && <EntryDetailPanel entry={entry} open={open} onOpenChange={setOpen} />}
    </>
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

const CARD_REGISTRY: Record<EntryCategory, React.ComponentType<CardProps>> = {
  TASK: TaskCard,
  EVENT: EventCard,
  NOTE: NoteCard,
  SHOPPING: ShoppingCard,
};

export function resolveEntryCard(category: EntryCategory): React.ComponentType<CardProps> {
  return CARD_REGISTRY[category];
}

// ─── EntryCard ────────────────────────────────────────────────────────────────

export interface EntryCardSelectionMode {
  isSelected: boolean;
  onToggleSelect: () => void;
}

export function EntryCard({ entry, selectionMode }: Readonly<{ entry: BrainDumpEntry; selectionMode?: EntryCardSelectionMode }>) {
  const CardComponent = resolveEntryCard(entry.category);
  return <CardComponent entry={entry} selectionMode={selectionMode} />;
}
