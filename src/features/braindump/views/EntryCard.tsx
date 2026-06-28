import { useState } from 'react';
import { Calendar, CheckCircle2, Circle, Clock, ShoppingCart, Timer } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { TaskToggle } from '@/components/TaskToggle';
import type { BrainDumpEntry, EntryCategory } from '../types';
import { TIME_OF_DAY_LABEL } from '../types/BrainDump';
import { formatCreatedTime, formatCreatedDateTime } from '../utils';
import { CATEGORY_STYLES, TagBadgeList } from '../categoryStyles';
import { EntryDetailPanel } from './EntryDetailPanel';
import { useTaskCompletionFlow } from './TaskCompletionDialog';
import { useBrainDumpStore } from '../store';
import { useNow } from '@/hooks';

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

// ─── Deadline chip ────────────────────────────────────────────────────────────

function getDeadlineStep(diffMs: number): 'overdue' | 'critical' | 'warning' | 'caution' | 'safe' {
  if (diffMs <= 0) return 'overdue';
  const h = diffMs / 3_600_000;
  if (h <= 3) return 'critical';
  if (h <= 12) return 'warning';
  if (h <= 48) return 'caution';
  return 'safe';
}

const CHIP_CLS = {
  overdue:  'bg-rose-900/15 border-rose-600/30 text-rose-800 dark:bg-rose-900/30 dark:border-rose-600/50 dark:text-rose-300',
  critical: 'bg-rose-500/10 border-rose-400/30 text-rose-700 dark:bg-rose-500/20 dark:border-rose-400/50 dark:text-rose-400',
  warning:  'bg-orange-500/10 border-orange-400/30 text-orange-700 dark:bg-orange-500/20 dark:border-orange-400/50 dark:text-orange-400',
  caution:  'bg-yellow-500/10 border-yellow-400/30 text-yellow-700 dark:bg-yellow-500/20 dark:border-yellow-400/50 dark:text-yellow-400',
  safe:     'bg-emerald-500/10 border-emerald-400/30 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-400/50 dark:text-emerald-400',
};

function DeadlineChip({ date, deadline }: Readonly<{ date?: string; deadline: string }>) {
  const now = useNow();

  const diffMs = (() => {
    if (!date) return null;
    const [hh, mm] = deadline.split(':').map(Number);
    const target = new Date(`${date}T00:00:00`);
    target.setHours(hh, mm, 0, 0);
    return target.getTime() - now.getTime();
  })();

  const step = diffMs !== null ? getDeadlineStep(diffMs) : 'safe';
  const isOverdue = diffMs !== null && diffMs <= 0;
  const label = isOverdue ? `Überfällig · ${deadline} Uhr` : `bis ${deadline} Uhr`;

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${CHIP_CLS[step]}`}>
      <Timer className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}

// ─── Event countdown chip ─────────────────────────────────────────────────────

type EventCountdownStep = 'past' | 'ongoing' | 'now' | 'minutes' | 'hours' | 'today' | 'tomorrow' | 'soon' | 'far';

function getEventCountdownStep(date: string, endDate: string | undefined, startTime: string | undefined, now: Date): EventCountdownStep {
  const todayIso = now.toISOString().slice(0, 10);
  const effectiveEnd = endDate ?? date;

  if (effectiveEnd < todayIso) return 'past';
  if (endDate && date < todayIso && todayIso <= endDate) return 'ongoing';

  if (date === todayIso) {
    if (startTime) {
      const [hh, mm] = startTime.split(':').map(Number);
      const target = new Date(`${date}T00:00:00`);
      target.setHours(hh, mm, 0, 0);
      const diffMs = target.getTime() - now.getTime();
      if (diffMs <= 0) return 'now';
      if (diffMs < 60 * 60_000) return 'minutes';
      return 'hours';
    }
    return 'today';
  }

  const startOfDate = new Date(`${date}T00:00:00`);
  const diffDays = Math.ceil((startOfDate.getTime() - now.getTime()) / 86_400_000);
  if (diffDays === 1) return 'tomorrow';
  if (diffDays <= 7) return 'soon';
  return 'far';
}

const EVENT_CHIP_CLS: Record<Exclude<EventCountdownStep, 'far'>, string> = {
  past:     'bg-zinc-500/10 border-zinc-400/30 text-zinc-500 dark:bg-zinc-500/15 dark:border-zinc-400/40 dark:text-zinc-400',
  ongoing:  'bg-emerald-500/10 border-emerald-400/30 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-400/50 dark:text-emerald-400',
  now:      'bg-emerald-500/10 border-emerald-400/30 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-400/50 dark:text-emerald-400',
  minutes:  'bg-rose-500/10 border-rose-400/30 text-rose-700 dark:bg-rose-500/20 dark:border-rose-400/50 dark:text-rose-400',
  hours:    'bg-orange-500/10 border-orange-400/30 text-orange-700 dark:bg-orange-500/20 dark:border-orange-400/50 dark:text-orange-400',
  today:    'bg-yellow-500/10 border-yellow-400/30 text-yellow-700 dark:bg-yellow-500/20 dark:border-yellow-400/50 dark:text-yellow-400',
  tomorrow: 'bg-yellow-500/10 border-yellow-400/30 text-yellow-700 dark:bg-yellow-500/20 dark:border-yellow-400/50 dark:text-yellow-400',
  soon:     'bg-sky-500/10 border-sky-400/30 text-sky-700 dark:bg-sky-500/20 dark:border-sky-400/50 dark:text-sky-400',
};

function getEventChipLabel(step: EventCountdownStep, startTime: string | undefined, date: string, now: Date): string {
  if (step === 'past') return 'vergangen';
  if (step === 'ongoing') return 'läuft';
  if (step === 'now') return `jetzt · ${startTime} Uhr`;
  if (step === 'today' || step === 'tomorrow') {
    return step === 'today' ? 'heute' : 'morgen';
  }
  if (step === 'minutes' || step === 'hours') {
    const [hh, mm] = (startTime as string).split(':').map(Number);
    const target = new Date(`${date}T00:00:00`);
    target.setHours(hh, mm, 0, 0);
    const diffMs = target.getTime() - now.getTime();
    if (step === 'minutes') {
      const min = Math.ceil(diffMs / 60_000);
      return `in ${min} min · ${startTime} Uhr`;
    }
    const h = Math.floor(diffMs / 3_600_000);
    return `in ${h} h · ${startTime} Uhr`;
  }
  if (step === 'soon') {
    const startOfDate = new Date(`${date}T00:00:00`);
    const diffDays = Math.ceil((startOfDate.getTime() - now.getTime()) / 86_400_000);
    return `in ${diffDays} Tagen`;
  }
  return '';
}

function EventCountdownChip({ date, endDate, startTime }: Readonly<{ date?: string; endDate?: string; startTime?: string }>) {
  const now = useNow();
  if (!date) return null;

  const step = getEventCountdownStep(date, endDate, startTime, now);
  if (step === 'far') return null;

  const label = getEventChipLabel(step, startTime, date, now);

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${EVENT_CHIP_CLS[step]}`}>
      <Timer className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
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
  const { triggerToggle, dialogs } = useTaskCompletionFlow();
  const { tintBackground, accent, accentBg } = CATEGORY_STYLES.TASK;
  const title = entry.title?.trim() || 'Untitled';
  const tags = entry.payload?.tags ?? [];
  const selectedRing = selectionMode?.isSelected ? 'ring-2 ring-primary ring-offset-1' : '';
  const dateBlock = entry.payload?.date ? parseDateBlock(entry.payload.date) : null;
  const timeStr = fmtTime(entry.payload?.startTime, entry.payload?.endTime);
  const timeOfDayLabel = !timeStr && entry.payload?.timeOfDay ? TIME_OF_DAY_LABEL[entry.payload.timeOfDay] : null;
  const hasTiming = dateBlock !== null || timeStr !== null || timeOfDayLabel !== null;
  const deadline = entry.payload?.deadline;

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
                {timeOfDayLabel && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
                    {timeOfDayLabel}
                  </p>
                )}
                <TagBadgeList tags={tags} />
                {deadline && <DeadlineChip date={entry.payload?.date} deadline={deadline} />}
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
              onToggle={() => triggerToggle(entry.id, !entry.completed)}
              className="absolute bottom-4 right-4 z-10"
            />
          )}
      </div>

      {!selectionMode && <EntryDetailPanel entry={entry} open={open} onOpenChange={setOpen} />}
      {!selectionMode && dialogs}
    </>
  );
}

// ─── EventCard ────────────────────────────────────────────────────────────────

function EventCard({ entry, selectionMode }: Readonly<CardProps>) {
  const [open, setOpen] = useState(false);
  const { tintBackground, accentBg } = CATEGORY_STYLES.EVENT;
  const title = entry.title?.trim() || 'Untitled';
  const tags = entry.payload?.tags ?? [];
  const endDate = entry.payload?.endDate;
  const dateBlock = entry.payload?.date ? parseDateBlock(entry.payload.date) : null;
  const endDateBlock = endDate ? parseDateBlock(endDate) : null;
  const timeStr = fmtTime(entry.payload?.startTime, entry.payload?.endTime);
  const timeOfDayLabel = !timeStr && entry.payload?.timeOfDay ? TIME_OF_DAY_LABEL[entry.payload.timeOfDay] : null;
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
              {endDateBlock ? (
                <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                  <div className={['flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 min-w-[2.75rem]', accentBg].join(' ')}>
                    <span className="text-base font-bold text-white leading-none">{dateBlock?.day}</span>
                    <span className="text-[10px] font-medium text-white/80 uppercase tracking-wide">{dateBlock?.month}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground/50">–</span>
                  <div className={['flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 min-w-[2.75rem]', accentBg].join(' ')}>
                    <span className="text-base font-bold text-white leading-none">{endDateBlock.day}</span>
                    <span className="text-[10px] font-medium text-white/80 uppercase tracking-wide">{endDateBlock.month}</span>
                  </div>
                </div>
              ) : (
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
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-sm font-semibold leading-snug">{title}</p>
                {!endDateBlock && timeStr && <p className="text-xs text-muted-foreground">{timeStr}</p>}
                {!endDateBlock && timeOfDayLabel && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
                    {timeOfDayLabel}
                  </p>
                )}
                <TagBadgeList tags={tags} />
                <EventCountdownChip date={entry.payload?.date} endDate={entry.payload?.endDate} startTime={entry.payload?.startTime} />
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
  const payloadItems = entry.payload?.items ?? [];
  const itemLabels = payloadItems.map((i) => (typeof i === 'string' ? i : i.label));
  const selectedRing = selectionMode?.isSelected ? 'ring-2 ring-primary ring-offset-1' : '';

  const storeItems = useBrainDumpStore(s => s.items);
  const liveItems = entry.captureId
    ? storeItems.filter(i => i.source_dump === entry.captureId)
    : [];

  const total = (() => {
    if (liveItems.length > 0) {
      const priced = liveItems.filter(i => i.estimated_price != null);
      if (priced.length === 0) return null;
      return priced.reduce((sum, i) => sum + (i.estimated_price ?? 0), 0);
    }
    const priced = payloadItems.filter(
      (i): i is { label: string; estimatedPrice: number } =>
        typeof i !== 'string' && i.estimatedPrice != null
    );
    if (priced.length === 0) return null;
    return priced.reduce((sum, i) => sum + i.estimatedPrice, 0);
  })();

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
              <div className={['flex items-center gap-2', selectionMode ? 'pr-6' : ''].join(' ')}>
                <ShoppingCart className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <p className="text-sm font-semibold leading-snug">{title}</p>
                {total != null && (
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
                    ~{total.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </span>
                )}
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
