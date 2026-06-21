import { useState } from 'react';
import { Circle, CircleCheck, ChevronDown, ChevronRight, Clock, GitFork, Pencil, Plus, RefreshCw, ShoppingCart, Square, SquareCheck, Timer, Sun, Trash2 } from 'lucide-react';
import { useNow } from '@/hooks';
import type { ShoppingItem } from '../../shopping/types/ShoppingItem';
import { useBrainDumpStore } from '../store';
import type { EntryCategory } from '../types';
import { useDeleteEntry, useDeleteOccurrence, useErrorToast, useReprocessEntry, useSuccessToast, useUpdateEntry, useUpdateOccurrence } from '@/hooks';
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
import type { BrainDumpEntry, DeleteResult, RecurrenceScope, UpdateResult } from '../types';
import { getSuccessors, calcDeltaDays, addDays } from '../utils/dependencies';
import { TIME_OF_DAY_LABEL } from '../types/BrainDump';
import { CATEGORY_STYLES, CategoryBadge, TagBadgeList } from '../categoryStyles';
import { RecurrenceScopeDialog } from './RecurrenceScopeDialog';
import { formatRecurrenceRule } from '../../timeline/recurrenceUtils';
import { useDaySelectionStore } from '../../timeline/store/DaySelectionStore';
import { DetailPanelMenu } from './DetailPanelMenu';
import { EntryEditForm } from './EntryEditForm';

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
const FMT_DATE_L   = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

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
  const dateLong     = parsed    ? FMT_DATE_L.format(parsed)     : null;
  const endWeekday   = parsedEnd ? FMT_WEEKDAY.format(parsedEnd) : null;
  const endDateLong  = parsedEnd ? FMT_DATE_L.format(parsedEnd)  : null;
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

  const inner = parsedEnd ? (
    // ── Mehrtägiger Zeitraum: zwei vollständige Blöcke mit Bindestrich ──────
    <div className="flex items-center gap-3 min-w-0 flex-1 flex-wrap">
      <div className="flex items-center gap-3 shrink-0">
        {day && monthS && dateTile(day, monthS)}
        <div className="space-y-0.5 text-left">
          {weekday   && <p className="text-sm font-semibold text-foreground">{weekday}</p>}
          {dateLong  && <p className="text-xs text-muted-foreground">{dateLong}</p>}
          {timeChip}
        </div>
      </div>
      <span className="text-base font-semibold text-muted-foreground/50 shrink-0 px-1" aria-hidden="true">–</span>
      <div className="flex items-center gap-3 shrink-0">
        {endDay && endMonthS && dateTile(endDay, endMonthS)}
        <div className="space-y-0.5 text-left">
          {endWeekday  && <p className="text-sm font-semibold text-foreground">{endWeekday}</p>}
          {endDateLong && <p className="text-xs text-muted-foreground">{endDateLong}</p>}
        </div>
      </div>
    </div>
  ) : (
    // ── Einzeltermin: bisherige Darstellung ───────────────────────────────
    <>
      {parsed && day && monthS && dateTile(day, monthS)}
      <div className="min-w-0 flex-1 space-y-0.5 text-left">
        {weekday  && <p className="text-sm font-semibold text-foreground">{weekday}</p>}
        {dateLong && <p className="text-xs text-muted-foreground">{dateLong}</p>}
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

const DELETE_FEEDBACK: Record<DeleteResult['status'], string> = {
  deleted:   'Eintrag gelöscht.',
  not_found: 'Kein passender Eintrag gefunden.',
  error:     'Löschen fehlgeschlagen.',
};

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

// ─── ShoppingItemsSection ────────────────────────────────────────────────────

function formatItemPrice(price: number): string {
  return `~${price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function ShoppingItemsSection({ captureId, labelCls, sectionCls }: Readonly<{
  captureId: string; labelCls: string; sectionCls: string;
}>) {
  const allItems            = useBrainDumpStore(s => s.items);
  const toggleItem          = useBrainDumpStore(s => s.toggleItem);
  const updateItemPrice     = useBrainDumpStore(s => s.updateItemPrice);
  const addItemToEntry      = useBrainDumpStore(s => s.addItemToEntry);
  const updateItemLabel     = useBrainDumpStore(s => s.updateItemLabel);
  const removeItemFromEntry = useBrainDumpStore(s => s.removeItemFromEntry);

  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft]         = useState('');
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft]         = useState('');
  const [newLabel, setNewLabel]             = useState('');
  const [isAddingItem, setIsAddingItem]     = useState(false);

  const items = allItems.filter(i => i.source_dump === captureId);

  const startPriceEdit = (item: ShoppingItem) => {
    setPriceDraft(
      item.estimated_price != null
        ? item.estimated_price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : ''
    );
    setEditingPriceId(item.id);
  };

  const commitPrice = (id: string) => {
    const trimmed = priceDraft.trim();
    if (!trimmed) {
      void updateItemPrice(id, null);
    } else {
      const parsed = parseFloat(trimmed.replace(',', '.'));
      if (!Number.isNaN(parsed) && parsed >= 0) {
        void updateItemPrice(id, Math.round(parsed * 100) / 100);
      }
    }
    setEditingPriceId(null);
  };

  const startLabelEdit = (item: ShoppingItem) => {
    setLabelDraft(item.label);
    setEditingLabelId(item.id);
  };

  const commitLabel = (id: string, originalLabel: string) => {
    const trimmed = labelDraft.trim();
    if (trimmed && trimmed !== originalLabel) {
      void updateItemLabel(id, captureId, trimmed);
    }
    setEditingLabelId(null);
  };

  const handleAddItem = () => {
    const trimmed = newLabel.trim();
    setNewLabel('');
    setIsAddingItem(false);
    if (trimmed) void addItemToEntry(captureId, trimmed);
  };

  return (
    <section className="space-y-2" aria-label="Einkaufsartikel">
      <p className={labelCls}>Artikel</p>
      <ul className={sectionCls}>
        {items.map(item => (
          <li key={item.id} className="flex items-center gap-2 rounded-md px-0.5 group">
            {/* Toggle */}
            <button
              type="button"
              role="checkbox"
              aria-checked={item.is_done}
              onClick={() => void toggleItem(item.id, !item.is_done)}
              className="shrink-0 py-0.5 rounded transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              aria-label={item.is_done ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
            >
              {item.is_done
                ? <SquareCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                : <Square className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />}
            </button>

            {/* Label */}
            {editingLabelId === item.id ? (
              <input
                type="text"
                autoFocus
                value={labelDraft}
                onChange={e => setLabelDraft(e.target.value)}
                onBlur={() => commitLabel(item.id, item.label)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); commitLabel(item.id, item.label); }
                  else if (e.key === 'Escape') setEditingLabelId(null);
                }}
                className="flex-1 min-w-0 text-sm bg-transparent border-b border-emerald-400 focus:outline-none"
                aria-label="Artikelname bearbeiten"
              />
            ) : (
              <button
                type="button"
                onClick={() => startLabelEdit(item)}
                className={`flex-1 min-w-0 text-left text-sm py-0.5 rounded transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                  item.is_done ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {item.label}
              </button>
            )}

            {/* Price */}
            {editingPriceId === item.id ? (
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                value={priceDraft}
                onChange={e => setPriceDraft(e.target.value)}
                onBlur={() => commitPrice(item.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); commitPrice(item.id); }
                  else if (e.key === 'Escape') setEditingPriceId(null);
                }}
                className="w-14 shrink-0 text-xs text-right tabular-nums bg-transparent border-b border-emerald-400 focus:outline-none"
                aria-label="Preis in Euro"
              />
            ) : item.estimated_price != null ? (
              <button
                type="button"
                onClick={() => startPriceEdit(item)}
                className="shrink-0 flex items-center gap-0.5 group/price text-xs text-muted-foreground/70 tabular-nums hover:text-foreground transition-colors rounded px-0.5"
                aria-label="Preis bearbeiten"
              >
                {formatItemPrice(item.estimated_price)}
                <Pencil className="h-2.5 w-2.5 opacity-0 group-hover/price:opacity-60 transition-opacity" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startPriceEdit(item)}
                className="shrink-0 p-0.5 rounded text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                aria-label="Preis hinzufügen"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
              </button>
            )}

            {/* Delete */}
            <button
              type="button"
              onClick={() => void removeItemFromEntry(item.id, captureId)}
              className="shrink-0 p-0.5 rounded text-muted-foreground/25 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Artikel löschen"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}

        {/* Add new item */}
        {isAddingItem ? (
          <li className="flex items-center gap-2 rounded-md px-0.5 pt-1">
            <Plus className="h-4 w-4 shrink-0 text-muted-foreground/30" aria-hidden="true" />
            <input
              type="text"
              autoFocus
              placeholder="Neuer Artikel..."
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onBlur={handleAddItem}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); }
                else if (e.key === 'Escape') { setIsAddingItem(false); setNewLabel(''); }
              }}
              className="flex-1 text-sm bg-transparent border-b border-emerald-400 focus:outline-none placeholder:text-muted-foreground/40"
              aria-label="Neuer Artikel"
            />
          </li>
        ) : (
          <li className="pt-1">
            <button
              type="button"
              onClick={() => setIsAddingItem(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors rounded px-0.5 py-0.5"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              Artikel hinzufügen
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}

// ─── EntryDetailPanel ─────────────────────────────────────────────────────────

export function EntryDetailPanel({ entry, open, onOpenChange }: Readonly<{
  entry: BrainDumpEntry; open: boolean; onOpenChange: (open: boolean) => void;
}>) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isScopeDeleteOpen, setIsScopeDeleteOpen] = useState(false);
  const [isScopeEditOpen, setIsScopeEditOpen] = useState(false);
  const [editScope, setEditScope] = useState<RecurrenceScope | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isOriginalTextOpen, setIsOriginalTextOpen] = useState(false);
  const [shiftQueue, setShiftQueue] = useState<Array<{ entryId: string; delta: number }>>([]);

  const allEntries = useBrainDumpStore(s => s.entries);

  const isRecurring = entry._isVirtualOccurrence === true || entry.recurrence != null;

  const deleteEntry                  = useDeleteEntry();
  const deleteOccurrence             = useDeleteOccurrence();
  const updateEntry                  = useUpdateEntry();
  const reprocessEntry               = useReprocessEntry();
  const updateOccurrence             = useUpdateOccurrence();
  const { triggerToggle, dialogs }   = useTaskCompletionFlow();
  const showSuccessToast             = useSuccessToast();
  const showErrorToast               = useErrorToast();

  const s     = PANEL_STYLES[entry.category];
  const title = entry.title?.trim() || 'Untitled';
  const tags  = entry.payload?.tags ?? [];
  const date  = entry.payload?.date;

  const labelCls   = `text-xs font-medium uppercase tracking-wide ${s.labelText}`;
  const sectionCls = `space-y-1 rounded-lg border ${s.sectionBorder} ${s.sectionBg} p-3`;
  const bulletCls  = `mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${s.bulletColor}`;

  const handleSave = async (patch: Parameters<typeof updateEntry>[1]) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      let result: UpdateResult;
      if (entry._isVirtualOccurrence) {
        const masterId = entry._seriesMasterId ?? entry.id;
        const occDate = entry._occurrenceDate ?? entry.payload.date ?? '';
        result = await updateOccurrence(masterId, occDate, patch, editScope ?? 'single');
      } else {
        result = await reprocessEntry(entry.id, patch);
      }
      if (result.status === 'updated') {
        setIsEditing(false);
        setEditScope(null);

        // Verschiebe-Dialog: prüfen ob Nachfolger durch Datumsänderung verletzt werden
        if (!entry._isVirtualOccurrence) {
          const newDate = patch.payload?.date;
          const oldDate = entry.payload.date;
          if (newDate && oldDate && newDate !== oldDate) {
            const delta = calcDeltaDays(oldDate, newDate);
            const freshEntries = useBrainDumpStore.getState().entries;
            const violating = getSuccessors(entry.id, freshEntries).filter(
              s => s.payload.date != null && s.payload.date < newDate
            );
            if (violating.length > 0) {
              setShiftQueue(violating.map(s => ({ entryId: s.id, delta })));
            }
          }
        }
      } else {
        showErrorToast(result.status === 'error' ? result.message : 'Eintrag nicht gefunden.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleShiftConfirm = async () => {
    const current = shiftQueue[0];
    if (!current) return;
    const freshEntries = useBrainDumpStore.getState().entries;
    const target = freshEntries.find(e => e.id === current.entryId);
    if (!target?.payload.date) { setShiftQueue(prev => prev.slice(1)); return; }

    const newDate = addDays(target.payload.date, current.delta);
    const result = await updateEntry(current.entryId, { payload: { ...target.payload, date: newDate } });

    const afterEntries = useBrainDumpStore.getState().entries;
    const nextViolating = result.status === 'updated'
      ? getSuccessors(current.entryId, afterEntries).filter(
          s => s.payload.date != null && s.payload.date < newDate
        )
      : [];

    setShiftQueue(prev => [
      ...prev.slice(1),
      ...nextViolating.map(s => ({ entryId: s.id, delta: current.delta })),
    ]);
  };

  const handleShiftReject = () => setShiftQueue(prev => prev.slice(1));

  const handleDeleteConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await deleteEntry(entry.id);
      setIsDeleteDialogOpen(false);
      if (result.status === 'deleted') {
        onOpenChange(false);
        showSuccessToast(DELETE_FEEDBACK.deleted);
      } else {
        showErrorToast(result.status === 'error' ? result.message : DELETE_FEEDBACK.not_found);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleScopeDelete = async (scope: RecurrenceScope) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const masterId = entry._isVirtualOccurrence ? (entry._seriesMasterId ?? entry.id) : entry.id;
      const date = entry._occurrenceDate ?? entry.payload.date ?? '';
      const result = await deleteOccurrence(masterId, date, scope);
      if (result.status === 'deleted') {
        onOpenChange(false);
        showSuccessToast(DELETE_FEEDBACK.deleted);
      } else {
        showErrorToast(result.status === 'error' ? result.message : DELETE_FEEDBACK.not_found);
      }
    } finally {
      setIsDeleting(false);
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
              isSaving={isSaving}
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
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? 'Lösche...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RecurrenceScopeDialog
        open={isScopeDeleteOpen}
        onOpenChange={setIsScopeDeleteOpen}
        mode="delete"
        onConfirm={handleScopeDelete}
      />

      <RecurrenceScopeDialog
        open={isScopeEditOpen}
        onOpenChange={setIsScopeEditOpen}
        mode="edit"
        onConfirm={handleScopeEditConfirm}
      />
    </Dialog>

    {dialogs}

    {shiftQueue.length > 0 && (() => {
      const current = shiftQueue[0];
      const target = allEntries.find(e => e.id === current.entryId);
      if (!target) return null;
      const absDelta = Math.abs(current.delta);
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
              <AlertDialogCancel onClick={handleShiftReject}>Nein</AlertDialogCancel>
              <AlertDialogAction onClick={() => void handleShiftConfirm()}>Ja</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    })()}
    </>
  );
}
