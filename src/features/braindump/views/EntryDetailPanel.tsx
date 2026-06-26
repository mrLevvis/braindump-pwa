import { useState } from 'react';
import { Circle, CircleCheck, ChevronDown, ChevronRight, Clock, GitFork, RefreshCw, ShoppingCart, Sun, Timer } from 'lucide-react';
import { useNow } from '@/hooks';
import { useBrainDumpStore } from '../store';
import type { EntryCategory } from '../types';
import { useTaskCompletionFlow } from './TaskCompletionDialog';
import { formatCreatedDateTime, formatCreatedTime } from '../utils/formatTime';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { BrainDumpEntry, EntryPatch, RecurrenceScope } from '../types';
import { getSuccessors } from '../utils/dependencies';
import { TIME_OF_DAY_LABEL } from '../types/BrainDump';
import { CATEGORY_STYLES, CategoryBadge, TagBadgeList } from '../categoryStyles';
import { RecurrenceScopeDialog } from './RecurrenceScopeDialog';
import { formatRecurrenceRule } from '../../timeline/recurrenceUtils';
import { useDaySelectionStore } from '../../timeline/store/DaySelectionStore';
import { DetailPanelMenu } from './DetailPanelMenu';
import { EntryEditForm } from './EntryEditForm';
import { ShoppingItemsSection } from './ShoppingItemsSection';
import { useEntryDetailActions } from '../hooks/useEntryDetailActions';

// ─── Per-category panel styles ────────────────────────────────────────────────

interface PanelStyle {
  headerBg:      string;
  labelText:     string;
  sectionBg:     string;
  sectionBorder: string;
  bulletColor:   string;
  timingBg:      string;
  timingBorder:  string;
  navBtn:        string;
}

const PANEL_STYLES: Record<EntryCategory, PanelStyle> = {
  TASK: {
    headerBg:      'bg-violet-500/10 dark:bg-violet-500/15',
    labelText:     'text-violet-600 dark:text-violet-400',
    sectionBg:     'bg-violet-500/5',
    sectionBorder: 'border-violet-200 dark:border-violet-800/60',
    bulletColor:   'bg-violet-400 dark:bg-violet-500',
    timingBg:      'bg-violet-500/5',
    timingBorder:  'border-violet-200 dark:border-violet-800/60',
    navBtn:        'text-violet-700 border-violet-400/50 hover:bg-violet-500/10 dark:text-violet-400',
  },
  EVENT: {
    headerBg:      'bg-sky-500/10 dark:bg-sky-500/15',
    labelText:     'text-sky-600 dark:text-sky-400',
    sectionBg:     'bg-sky-500/5',
    sectionBorder: 'border-sky-200 dark:border-sky-800/60',
    bulletColor:   'bg-sky-400 dark:bg-sky-500',
    timingBg:      'bg-sky-500/5',
    timingBorder:  'border-sky-200 dark:border-sky-800/60',
    navBtn:        'text-sky-700 border-sky-400/50 hover:bg-sky-500/10 dark:text-sky-400',
  },
  NOTE: {
    headerBg:      'bg-amber-500/10 dark:bg-amber-500/15',
    labelText:     'text-amber-600 dark:text-amber-500',
    sectionBg:     'bg-amber-500/5',
    sectionBorder: 'border-amber-200 dark:border-amber-800/60',
    bulletColor:   'bg-amber-400 dark:bg-amber-500',
    timingBg:      'bg-amber-500/5',
    timingBorder:  'border-amber-200 dark:border-amber-800/60',
    navBtn:        '',
  },
  SHOPPING: {
    headerBg:      'bg-emerald-500/10 dark:bg-emerald-500/15',
    labelText:     'text-emerald-600 dark:text-emerald-400',
    sectionBg:     'bg-emerald-500/5',
    sectionBorder: 'border-emerald-200 dark:border-emerald-800/60',
    bulletColor:   'bg-emerald-400 dark:bg-emerald-500',
    timingBg:      'bg-emerald-500/5',
    timingBorder:  'border-emerald-200 dark:border-emerald-800/60',
    navBtn:        'text-emerald-700 border-emerald-400/50 hover:bg-emerald-500/10 dark:text-emerald-400',
  },
};

// ─── Date/time formatters ─────────────────────────────────────────────────────

const FMT_DAY      = new Intl.DateTimeFormat('de-DE', { day: 'numeric' });
const FMT_MONTH_S  = new Intl.DateTimeFormat('de-DE', { month: 'short' });
const FMT_WEEKDAY  = new Intl.DateTimeFormat('de-DE', { weekday: 'long' });

function parseLocalDate(iso: string): Date | null {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ─── TimingCard ───────────────────────────────────────────────────────────────

function TimingCard({ date, endDate, startTime, endTime, timeOfDay, accentBg, borderClass, bgClass, onNavigate }: Readonly<{
  date?: string; endDate?: string; startTime?: string; endTime?: string; timeOfDay?: string;
  accentBg: string; borderClass: string; bgClass: string;
  onNavigate?: () => void;
}>) {
  if (!date && !startTime) return null;

  const parsed       = date    ? parseLocalDate(date)    : null;
  const parsedEnd    = endDate ? parseLocalDate(endDate) : null;
  const day          = parsed    ? FMT_DAY.format(parsed)    : null;
  const monthS       = parsed    ? FMT_MONTH_S.format(parsed).replace('.', '')    : null;
  const endDay       = parsedEnd ? FMT_DAY.format(parsedEnd) : null;
  const endMonthS    = parsedEnd ? FMT_MONTH_S.format(parsedEnd).replace('.', '') : null;
  const weekday      = parsed    ? FMT_WEEKDAY.format(parsed)    : null;
  const endWeekday   = parsedEnd ? FMT_WEEKDAY.format(parsedEnd) : null;
  const timeStr      = startTime
    ? endTime ? `${startTime} – ${endTime} Uhr` : `${startTime} Uhr`
    : null;

  const dateTile = (d: string, m: string) => (
    <div className={[
      'shrink-0 flex flex-col items-center justify-center rounded-lg',
      'min-w-[3rem] py-2 px-1', accentBg,
    ].join(' ')}>
      <span className="text-xl font-bold text-white leading-none">{d}</span>
      <span className="text-[10px] font-semibold text-white/75 uppercase tracking-wider mt-0.5">{m}</span>
    </div>
  );

  const timeChip = timeStr ? (
    <span className="inline-flex items-center gap-1 mt-1 rounded-full border bg-background/60 px-2 py-0.5 text-xs font-medium text-foreground">
      <Clock className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
      {timeStr}
    </span>
  ) : !timeStr && timeOfDay ? (
    <span className="inline-flex items-center gap-1 mt-1 rounded-full border bg-background/60 px-2 py-0.5 text-xs font-medium text-foreground">
      <Sun className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
      {timeOfDay}
    </span>
  ) : null;

  const rangeTimeChip = (time: string) => (
    <span className="inline-flex items-center gap-1 mt-1 rounded-full border bg-background/60 px-2 py-0.5 text-xs font-medium text-foreground">
      <Clock className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
      {time} Uhr
    </span>
  );

  const inner = parsedEnd ? (
    // ── Mehrtägiger Zeitraum: zwei vollständige Blöcke mit Bindestrich ──────
    <div className="flex items-center gap-3 min-w-0 flex-1 flex-wrap">
      <div className="flex items-center gap-3 shrink-0">
        {day && monthS && dateTile(day, monthS)}
        <div className="space-y-0.5 text-left">
          {weekday && <p className="text-sm font-semibold text-foreground">{weekday}</p>}
          {rangeTimeChip(startTime ?? '00:00')}
        </div>
      </div>
      <span className="text-base font-semibold text-muted-foreground/50 shrink-0 px-1" aria-hidden="true">–</span>
      <div className="flex items-center gap-3 shrink-0">
        {endDay && endMonthS && dateTile(endDay, endMonthS)}
        <div className="space-y-0.5 text-left">
          {endWeekday && <p className="text-sm font-semibold text-foreground">{endWeekday}</p>}
          {rangeTimeChip(endTime ?? '23:59')}
        </div>
      </div>
    </div>
  ) : (
    // ── Einzeltermin: bisherige Darstellung ───────────────────────────────
    <>
      {parsed && day && monthS && dateTile(day, monthS)}
      <div className="min-w-0 flex-1 space-y-0.5 text-left">
        {weekday && <p className="text-sm font-semibold text-foreground">{weekday}</p>}
        {timeChip}
      </div>
    </>
  );

  const cardCls = `flex items-center gap-4 rounded-xl border ${borderClass} ${bgClass} p-3`;

  if (onNavigate) {
    return (
      <button
        type="button"
        onClick={onNavigate}
        aria-label="Zur Timeline navigieren"
        className={`${cardCls} w-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
      >
        {inner}
      </button>
    );
  }

  return <div className={cardCls}>{inner}</div>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EXCERPT_HIGHLIGHT: Record<EntryCategory, string> = {
  TASK:     'bg-violet-500/25 dark:bg-violet-500/30 rounded-sm',
  EVENT:    'bg-sky-500/25 dark:bg-sky-500/30 rounded-sm',
  NOTE:     'bg-amber-500/25 dark:bg-amber-500/30 rounded-sm',
  SHOPPING: 'bg-emerald-500/25 dark:bg-emerald-500/30 rounded-sm',
};

// ─── DeadlineCountdown ───────────────────────────────────────────────────────

const DEADLINE_STEPS = {
  overdue:  { container: 'bg-rose-900/10 border-rose-700/40 dark:bg-rose-900/25 dark:border-rose-600/50', text: 'text-rose-900 dark:text-rose-300', sub: 'text-rose-800/60 dark:text-rose-400/70', barColor: 'hsl(0,65%,38%)' },
  critical: { container: 'bg-rose-500/10 border-rose-400/40 dark:bg-rose-500/20 dark:border-rose-400/50', text: 'text-rose-700 dark:text-rose-400',   sub: 'text-rose-600/60 dark:text-rose-400/70',    barColor: 'hsl(5,80%,55%)' },
  warning:  { container: 'bg-orange-500/10 border-orange-400/40 dark:bg-orange-500/20 dark:border-orange-400/50', text: 'text-orange-700 dark:text-orange-400', sub: 'text-orange-600/60 dark:text-orange-400/70', barColor: 'hsl(28,90%,55%)' },
  caution:  { container: 'bg-yellow-500/10 border-yellow-400/40 dark:bg-yellow-500/20 dark:border-yellow-400/50', text: 'text-yellow-700 dark:text-yellow-400',  sub: 'text-yellow-600/60 dark:text-yellow-400/70',  barColor: 'hsl(50,90%,48%)' },
  safe:     { container: 'bg-emerald-500/10 border-emerald-400/40 dark:bg-emerald-500/20 dark:border-emerald-400/50', text: 'text-emerald-700 dark:text-emerald-400', sub: 'text-emerald-600/60 dark:text-emerald-400/70', barColor: 'hsl(145,65%,45%)' },
} as const;

type DeadlineStep = keyof typeof DEADLINE_STEPS;

function getDeadlineStep(diffMs: number): DeadlineStep {
  if (diffMs <= 0) return 'overdue';
  const h = diffMs / 3_600_000;
  if (h <= 3) return 'critical';
  if (h <= 12) return 'warning';
  if (h <= 48) return 'caution';
  return 'safe';
}

function fmtDuration(ms: number): string {
  const totalMin = Math.floor(Math.abs(ms) / 60_000);
  const days  = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const min   = totalMin % 60;
  if (days > 0) return `${days} Tag${days !== 1 ? 'e' : ''} ${hours} Std`;
  if (hours > 0) return `${hours} Std ${min} Min`;
  return `${min} Min`;
}

function DeadlineCountdown({ date, deadline, completed }: Readonly<{ date?: string; deadline: string; completed: boolean }>) {
  const now = useNow();

  const diffMs = (() => {
    if (!date) return null;
    const [hh, mm] = deadline.split(':').map(Number);
    const target = new Date(`${date}T00:00:00`);
    target.setHours(hh, mm, 0, 0);
    return target.getTime() - now.getTime();
  })();

  const isOverdue = diffMs !== null && diffMs <= 0;

  // ── Completed on time ────────────────────────────────────────────────────
  if (completed && !isOverdue) {
    return (
      <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 dark:bg-emerald-500/20 dark:border-emerald-400/50 flex items-center gap-2.5 px-3 py-2.5">
        <CircleCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Rechtzeitig erledigt</p>
          <p className="text-xs mt-0.5 text-emerald-600/60 dark:text-emerald-400/70">Deadline war {deadline} Uhr</p>
        </div>
      </div>
    );
  }

  // ── Completed but was already overdue ────────────────────────────────────
  if (completed && isOverdue) {
    return (
      <div className="rounded-xl border border-rose-700/40 bg-rose-900/10 dark:bg-rose-900/25 dark:border-rose-600/50 flex items-center gap-2.5 px-3 py-2.5">
        <CircleCheck className="h-4 w-4 shrink-0 text-rose-700 dark:text-rose-400" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">Erledigt – Deadline überschritten</p>
          <p className="text-xs mt-0.5 text-rose-700/60 dark:text-rose-400/70">
            Deadline war {deadline} Uhr
            {diffMs !== null && ` · ${fmtDuration(diffMs)} überfällig`}
          </p>
        </div>
      </div>
    );
  }

  // ── Active countdown ──────────────────────────────────────────────────────
  const step = diffMs !== null ? getDeadlineStep(diffMs) : 'safe';
  const cls  = DEADLINE_STEPS[step];

  const urgencyPct = diffMs === null ? 0
    : isOverdue ? 100
    : Math.max(3, Math.round(100 - Math.min(diffMs / (72 * 3_600_000), 1) * 100));

  const countdownLabel = diffMs === null ? null
    : isOverdue ? `Überfällig – seit ${fmtDuration(diffMs)}`
    : `Noch ${fmtDuration(diffMs)}`;

  return (
    <div className={`rounded-xl border overflow-hidden ${cls.container}`}>
      {diffMs !== null && (
        <div className="relative h-1 bg-black/5 dark:bg-white/5">
          <div
            className="absolute inset-y-0 left-0 transition-[width,background-color] duration-700"
            style={{ width: `${urgencyPct}%`, backgroundColor: cls.barColor }}
          />
        </div>
      )}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Timer className={`h-4 w-4 shrink-0 ${cls.text}`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          {countdownLabel && (
            <p className={`text-sm font-semibold leading-snug ${cls.text}`}>{countdownLabel}</p>
          )}
          <p className={`text-xs mt-0.5 ${cls.sub}`}>
            {isOverdue ? 'War fällig' : 'Fällig'} bis {deadline} Uhr
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function navigateTimeline(date?: string, entryId?: string) {
  if (entryId) useDaySelectionStore.getState().setPendingScrollEntryId(entryId);
  const path = date ? `/timeline/${date}` : '/timeline';
  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function OriginalText({ text, excerpt, category, borderClass, bgClass }: Readonly<{
  text: string; excerpt?: string; category: EntryCategory; borderClass: string; bgClass: string;
}>) {
  const cls = `rounded-lg border ${borderClass} ${bgClass} p-3 text-sm leading-relaxed whitespace-pre-wrap break-words`;

  if (!excerpt) return <p className={cls}>{text}</p>;
  const idx = text.indexOf(excerpt);
  if (idx === -1) return <p className={cls}>{text}</p>;

  return (
    <p className={cls}>
      {text.slice(0, idx)}
      <mark className={`not-italic ${EXCERPT_HIGHLIGHT[category]}`}>{text.slice(idx, idx + excerpt.length)}</mark>
      {text.slice(idx + excerpt.length)}
    </p>
  );
}

// ─── EntryDetailPanel ─────────────────────────────────────────────────────────

export function EntryDetailPanel({ entry, open, onOpenChange }: Readonly<{
  entry: BrainDumpEntry; open: boolean; onOpenChange: (open: boolean) => void;
}>) {
  const [isDeleteDialogOpen,  setIsDeleteDialogOpen]  = useState(false);
  const [isScopeDeleteOpen,   setIsScopeDeleteOpen]   = useState(false);
  const [isScopeEditOpen,     setIsScopeEditOpen]     = useState(false);
  const [editScope,           setEditScope]           = useState<RecurrenceScope | null>(null);
  const [isEditing,           setIsEditing]           = useState(false);
  const [isOriginalTextOpen,  setIsOriginalTextOpen]  = useState(false);

  const allEntries = useBrainDumpStore(s => s.entries);

  const isRecurring = entry._isVirtualOccurrence === true || entry.recurrence != null;

  const actions = useEntryDetailActions(entry, onOpenChange);
  const { triggerToggle, dialogs } = useTaskCompletionFlow();

  const s     = PANEL_STYLES[entry.category];
  const title = entry.title?.trim() || 'Untitled';
  const tags  = entry.payload?.tags ?? [];
  const date  = entry.payload?.date;

  const labelCls   = `text-xs font-medium uppercase tracking-wide ${s.labelText}`;
  const sectionCls = `space-y-1 rounded-lg border ${s.sectionBorder} ${s.sectionBg} p-3`;
  const bulletCls  = `mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${s.bulletColor}`;

  const handleSave = async (patch: EntryPatch) => {
    const saved = await actions.save(patch, editScope);
    if (saved) {
      setIsEditing(false);
      setEditScope(null);
    }
  };

  const handleScopeEditConfirm = (scope: RecurrenceScope) => {
    setEditScope(scope);
    setIsEditing(true);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => { if (!v) setIsEditing(false); onOpenChange(v); }}>
      <DialogContent className="w-full sm:max-w-xl">

        {!isEditing && (
          <div className="absolute top-4 right-10 z-10">
            <DetailPanelMenu
              onDeleteClick={() => isRecurring ? setIsScopeDeleteOpen(true) : setIsDeleteDialogOpen(true)}
              onEditClick={() => entry._isVirtualOccurrence ? setIsScopeEditOpen(true) : setIsEditing(true)}
            />
          </div>
        )}

        {/* Colored header band — full-bleed via negative margins */}
        <DialogHeader className={[
          '-mx-6 -mt-6 rounded-t-4xl px-6 pt-6 pb-4',
          isEditing ? 'sr-only' : s.headerBg,
          isEditing ? '' : 'pr-14',
        ].join(' ')}>
          <DialogTitle>{title}</DialogTitle>
          {!isEditing && (
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={entry.category} />
            </div>
          )}
        </DialogHeader>

        {isEditing ? (
          <>
            <EntryEditForm
              entry={entry}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
              isSaving={actions.isSaving}
            />
            <time dateTime={entry.created_at} className="px-6 pb-4 text-[10px] text-muted-foreground">
              erstellt am {formatCreatedDateTime(entry.created_at)} um {formatCreatedTime(entry.created_at)} Uhr
            </time>
          </>
        ) : (
          <div className="space-y-6 pb-4">

            {/* Summary */}
            {entry.summary && entry.summary.length > 0 && (
              <section className="space-y-2" aria-label="Zusammenfassung">
                <p className={labelCls}>Zusammenfassung</p>
                <ul className={sectionCls}>
                  {entry.summary.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                      <span className={bulletCls} aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Recurrence info — shown for masters and virtual occurrences */}
            {isRecurring && (
              <section className="space-y-2" aria-label="Wiederholung">
                <p className={labelCls}>Wiederholung</p>
                <div className={`flex items-center gap-2 rounded-xl border ${s.timingBorder} ${s.timingBg} px-3 py-2`}>
                  <RefreshCw className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
                  <span className="text-sm">
                    {entry.recurrence ? formatRecurrenceRule(entry.recurrence) : 'Serientermin'}
                  </span>
                </div>
              </section>
            )}

            {/* Timing (TASK / EVENT) */}
            {(date || entry.payload?.startTime || entry.payload?.timeOfDay || entry.payload?.deadline) && (
              <section className="space-y-2" aria-label="Eintragszeiten">
                <p className={labelCls}>Termin / Fällig</p>
                {(date || entry.payload?.startTime || entry.payload?.timeOfDay) && (
                  <TimingCard
                    date={date}
                    endDate={entry.payload?.endDate}
                    startTime={entry.payload?.startTime}
                    endTime={entry.payload?.endTime}
                    timeOfDay={entry.payload?.timeOfDay ? TIME_OF_DAY_LABEL[entry.payload.timeOfDay] : undefined}
                    accentBg={CATEGORY_STYLES[entry.category].accentBg}
                    borderClass={s.timingBorder}
                    bgClass={s.timingBg}
                    onNavigate={(entry.category === 'TASK' || entry.category === 'EVENT')
                      ? () => navigateTimeline(date, entry.id)
                      : undefined}
                  />
                )}
                {entry.category === 'TASK' && entry.payload?.deadline && (
                  <DeadlineCountdown date={date} deadline={entry.payload.deadline} completed={entry.completed} />
                )}
              </section>
            )}

            {/* Shopping items */}
            {entry.category === 'SHOPPING' && entry.captureId && (
              <ShoppingItemsSection
                captureId={entry.captureId}
                labelCls={labelCls}
                sectionCls={sectionCls}
              />
            )}

            {/* Originaltext (collapsible) */}
            <section className="space-y-2" aria-label="Originaltext">
              <button
                type="button"
                onClick={() => setIsOriginalTextOpen(prev => !prev)}
                className="flex items-center gap-1 text-left"
                aria-expanded={isOriginalTextOpen ? 'true' : 'false'}
              >
                {isOriginalTextOpen
                  ? <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  : <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />}
                <span className={labelCls}>Originaltext</span>
              </button>
              {isOriginalTextOpen && (
                <OriginalText
                  text={entry.original_text}
                  excerpt={entry.sourceExcerpt}
                  category={entry.category}
                  borderClass={s.sectionBorder}
                  bgClass={s.sectionBg}
                />
              )}
            </section>

            {/* Tags */}
            {tags.length > 0 && (
              <section className="space-y-2" aria-label="Tags">
                <p className={labelCls}>Tags</p>
                <TagBadgeList tags={tags} />
              </section>
            )}

            {/* Abhängigkeiten (nur TASK) */}
            {entry.category === 'TASK' && (() => {
              const liveEntry = allEntries.find(e => e.id === entry.id);
              const predecessorIds = liveEntry?.dependsOn ?? entry.dependsOn ?? [];
              const successors = getSuccessors(entry.id, allEntries);
              if (predecessorIds.length === 0 && successors.length === 0) return null;
              return (
                <section className="space-y-2" aria-label="Abhängigkeiten">
                  <div className={`flex items-center gap-1.5`}>
                    <GitFork className={`h-3 w-3 ${s.labelText}`} aria-hidden="true" />
                    <p className={labelCls}>Abhängigkeiten</p>
                  </div>
                  <div className={`rounded-xl border ${s.sectionBorder} ${s.sectionBg} p-3 space-y-3`}>
                    {predecessorIds.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Vorgänger</p>
                        <div className="flex flex-wrap gap-1.5">
                          {predecessorIds.map(predId => {
                            const pred = allEntries.find(e => e.id === predId);
                            if (!pred) return null;
                            return (
                              <span key={predId} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
                                {pred.title ?? 'Unbenannt'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {successors.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Nachfolger</p>
                        <div className="flex flex-wrap gap-1.5">
                          {successors.map(succ => (
                            <span key={succ.id} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
                              {succ.title ?? 'Unbenannt'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              );
            })()}

            {/* Action row */}
            {entry.category === 'TASK' && (
              <div className="flex items-center justify-end pt-1">
                <Button
                  type="button" variant="outline" size="icon"
                  onClick={() => triggerToggle(entry.id, !entry.completed)}
                  aria-label={entry.completed ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
                  className={entry.completed ? 'text-emerald-500 border-emerald-500/40' : ''}
                >
                  {entry.completed
                    ? <CircleCheck className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                    : <Circle className="h-5 w-5" aria-hidden="true" />}
                </Button>
              </div>
            )}

            {entry.category === 'SHOPPING' && (
              <div className="flex items-center justify-end pt-1">
                <Button
                  type="button" variant="outline" size="sm"
                  className={`gap-1.5 ${s.navBtn}`}
                  onClick={() => {
                    window.history.pushState(null, '', '/shopping');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                >
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  Zur Einkaufsliste
                </Button>
              </div>
            )}

            <time dateTime={entry.created_at} className="block text-[10px] text-muted-foreground">
              erstellt am {formatCreatedDateTime(entry.created_at)} um {formatCreatedTime(entry.created_at)} Uhr
            </time>
          </div>
        )}
      </DialogContent>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>Diese Aktion kann nicht rückgängig gemacht werden.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actions.isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={actions.isDeleting}
              onClick={async () => {
                await actions.deleteEntry();
                setIsDeleteDialogOpen(false);
              }}
            >
              {actions.isDeleting ? 'Lösche...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RecurrenceScopeDialog
        open={isScopeDeleteOpen}
        onOpenChange={setIsScopeDeleteOpen}
        mode="delete"
        onConfirm={actions.deleteScopedEntry}
      />

      <RecurrenceScopeDialog
        open={isScopeEditOpen}
        onOpenChange={setIsScopeEditOpen}
        mode="edit"
        onConfirm={handleScopeEditConfirm}
      />
    </Dialog>

    {dialogs}

    {actions.shiftQueue.length > 0 && (() => {
      const current = actions.shiftQueue[0];
      const target  = allEntries.find(e => e.id === current.entryId);
      if (!target) return null;
      const absDelta  = Math.abs(current.delta);
      const direction = current.delta > 0 ? 'nach hinten' : 'nach vorne';
      return (
        <AlertDialog open={true} onOpenChange={() => {}}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Abhängigen Task verschieben?</AlertDialogTitle>
              <AlertDialogDescription>
                Soll „{target.title ?? 'Unbenannt'}" auch um {absDelta} Tag{absDelta !== 1 ? 'e' : ''} {direction} verschoben werden?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={actions.shiftReject}>Nein</AlertDialogCancel>
              <AlertDialogAction onClick={() => void actions.shiftConfirm()}>Ja</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    })()}
    </>
  );
}
