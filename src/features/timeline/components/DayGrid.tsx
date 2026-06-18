import { useMemo, useState, type RefObject } from 'react';
import { AlarmClock, Sun } from 'lucide-react';
import { TIME_OF_DAY_LABEL } from '../../braindump/types/BrainDump';
import { Card, CardContent } from '../../../components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../components/ui/sheet';
import { TaskToggle } from '../../../components/TaskToggle';
import type { BrainDumpEntry } from '../../braindump/types';
import { CATEGORY_STYLES } from '../../braindump/categoryStyles';
import { getBlockGeometry } from '../getBlockGeometry';
import { getTemporalStatus } from '../getTemporalStatus';
import { GridBlock } from './GridBlock';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// ─── Class name constants ─────────────────────────────────────────────────────

const HOUR_ROW = 'absolute left-0 right-0 flex items-start';
const HOUR_LABEL = [
  'w-12', 'shrink-0', 'text-right', 'pr-2',
  'text-[10px]', 'font-mono', 'tabular-nums',
  'text-muted-foreground/50', 'select-none', 'leading-none', '-mt-px',
].join(' ');
const GRID_LINE = 'flex-1 border-t border-border/25';

const BLOCK_AREA = 'absolute left-12 right-0 top-0 bottom-0';

const NOW_LINE_ROW = 'absolute left-0 right-0 flex items-center z-10 pointer-events-none';
const NOW_DOT = 'h-2 w-2 rounded-full bg-sky-500 ring-2 ring-sky-500/25 shrink-0';
const NOW_LINE = 'flex-1 h-px bg-sky-500/60';

const ALL_DAY_LABEL = [
  'text-[10px]', 'font-medium', 'uppercase', 'tracking-wider',
  'text-muted-foreground/50', 'px-1', 'pb-1', 'select-none',
].join(' ');

const ALL_DAY_ENTRY_BTN = [
  'w-full', 'text-left', 'rounded-lg',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');


// ─── AllDayEntry ──────────────────────────────────────────────────────────────

interface AllDayEntryProps {
  entry: BrainDumpEntry;
  onSelect: (entry: BrainDumpEntry) => void;
  onToggle: (id: string, completed: boolean) => void;
}

function AllDayEntry({ entry, onSelect, onToggle }: Readonly<AllDayEntryProps>) {
  const isTask = entry.category === 'TASK';
  const deadline = entry.payload.deadline;
  const timeOfDay = entry.payload.timeOfDay;
  const title = entry.title ?? entry.original_text;
  const { tintBackground, accent } = CATEGORY_STYLES[entry.category];

  return (
    <div data-entry-id={entry.id} className="relative">
      <button
        type="button"
        className={ALL_DAY_ENTRY_BTN}
        onClick={() => onSelect(entry)}
        aria-label={`Eintrag öffnen: ${title}`}
      >
        <Card size="sm" className={['rounded-lg py-2 transition hover:border-foreground/20', tintBackground, entry.completed ? 'opacity-60' : ''].join(' ')}>
          <CardContent className={['px-3 min-w-0', isTask ? 'pr-10' : ''].join(' ')}>
            <div className="flex items-center gap-1.5 min-w-0">
              {deadline && (
                <AlarmClock className="h-3 w-3 shrink-0 text-rose-500" aria-hidden="true" />
              )}
              <p className={['text-xs font-medium truncate flex-1 min-w-0', entry.completed ? 'line-through text-muted-foreground' : ''].join(' ')}>
                {title}
              </p>
            </div>
            {deadline && (
              <p className="text-[10px] font-medium text-rose-500/80 mt-0.5">
                bis {deadline} Uhr
              </p>
            )}
            {!deadline && timeOfDay && (
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground/70 mt-0.5">
                <Sun className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                {TIME_OF_DAY_LABEL[timeOfDay]}
              </p>
            )}
          </CardContent>
        </Card>
      </button>

      {isTask && (
        <TaskToggle
          completed={entry.completed}
          accent={accent}
          size="sm"
          onToggle={() => onToggle(entry.id, !entry.completed)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
        />
      )}
    </div>
  );
}

// ─── DeadlineLine ─────────────────────────────────────────────────────────────

interface DeadlineLineProps {
  time: string;
  entries: readonly BrainDumpEntry[];
  topPx: number;
  onSelectSingle: (entry: BrainDumpEntry) => void;
  onOpenSheet: (time: string) => void;
}

function DeadlineLine({ time, entries, topPx, onSelectSingle, onOpenSheet }: Readonly<DeadlineLineProps>) {
  const isSingle = entries.length === 1;
  const label = isSingle
    ? (entries[0].title ?? entries[0].original_text)
    : `${entries.length} Deadlines`;

  return (
    <button
      type="button"
      onClick={() => isSingle ? onSelectSingle(entries[0]) : onOpenSheet(time)}
      aria-label={isSingle ? `Deadline: ${label} bis ${time}` : `${entries.length} Tasks fällig bis ${time}`}
      className="absolute left-0 right-0 z-20 flex items-center -translate-y-1/2 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
      style={{ top: `${topPx}px` }}
    >
      <span className="h-2 w-2 rounded-full bg-rose-500 ring-2 ring-rose-500/25 shrink-0" />
      <div className="flex-1 h-px bg-rose-500/60" />
      <span className="text-[10px] font-medium text-rose-500 px-1.5 shrink-0 max-w-[65%] truncate group-hover:underline">
        {label}
      </span>
    </button>
  );
}

// ─── DeadlineSheet ────────────────────────────────────────────────────────────

interface DeadlineSheetProps {
  time: string | null;
  entries: readonly BrainDumpEntry[];
  onClose: () => void;
  onSelect: (entry: BrainDumpEntry) => void;
  onToggle: (id: string, completed: boolean) => void;
}

function DeadlineSheet({ time, entries, onClose, onSelect, onToggle }: Readonly<DeadlineSheetProps>) {
  return (
    <Sheet open={time !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="bottom">
        <SheetHeader className="pb-2">
          <SheetTitle>Fällig bis {time} Uhr</SheetTitle>
        </SheetHeader>
        <div className="px-6 pb-8 space-y-2">
          {entries.map(entry => {
            const isTask = entry.category === 'TASK';
            const title = entry.title ?? entry.original_text;
            const { tintBackground, accent } = CATEGORY_STYLES[entry.category];
            return (
              <div key={entry.id} data-entry-id={entry.id} className="relative">
                <button
                  type="button"
                  className={ALL_DAY_ENTRY_BTN}
                  onClick={() => { onClose(); onSelect(entry); }}
                  aria-label={`Eintrag öffnen: ${title}`}
                >
                  <Card size="sm" className={['rounded-lg py-2.5 transition hover:border-foreground/20', tintBackground, entry.completed ? 'opacity-60' : ''].join(' ')}>
                    <CardContent className={['px-3 min-w-0', isTask ? 'pr-10' : ''].join(' ')}>
                      <p className={['text-sm font-medium truncate min-w-0', entry.completed ? 'line-through text-muted-foreground' : ''].join(' ')}>
                        {title}
                      </p>
                      {entry.summary && entry.summary[0] && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {entry.summary[0]}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </button>
                {isTask && (
                  <TaskToggle
                    completed={entry.completed}
                    accent={accent}
                    size="sm"
                    onToggle={() => onToggle(entry.id, !entry.completed)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
                  />
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  date: string;
  entries: readonly BrainDumpEntry[];
  /** Dated entries without startTime — shown in all-day section above the grid. */
  allDay: readonly BrainDumpEntry[];
  isToday: boolean;
  now: Date;
  pxPerHour: number;
  nowLineRef?: RefObject<HTMLDivElement | null>;
  onSelect: (entry: BrainDumpEntry) => void;
  onToggle: (id: string, completed: boolean) => void;
}

export function DayGrid({ date, entries, allDay, isToday, now, pxPerHour, nowLineRef, onSelect, onToggle }: Readonly<Props>) {
  const [openDeadlineTime, setOpenDeadlineTime] = useState<string | null>(null);

  const gridHeight = 24 * pxPerHour;
  const nowTopPx = isToday
    ? (now.getHours() * 60 + now.getMinutes()) * (pxPerHour / 60)
    : null;

  const deadlineByTime = useMemo(() => {
    const map = new Map<string, BrainDumpEntry[]>();
    for (const e of allDay) {
      if (!e.payload.deadline || e.completed) continue;
      const t = e.payload.deadline;
      const group = map.get(t) ?? [];
      group.push(e);
      map.set(t, group);
    }
    return map;
  }, [allDay]);

  const openDeadlineEntries = openDeadlineTime != null
    ? (deadlineByTime.get(openDeadlineTime) ?? [])
    : [];

  return (
    <div className="flex flex-col gap-3">
      {/* ── All-day entries (dated, no startTime) ───────────────────────────── */}
      {allDay.length > 0 && (
        <div>
          <p className={ALL_DAY_LABEL}>Ganztags</p>
          <div className="space-y-1.5">
            {allDay.map(entry => (
              <AllDayEntry key={entry.id} entry={entry} onSelect={onSelect} onToggle={onToggle} />
            ))}
          </div>
        </div>
      )}

      {/* ── 24h grid ────────────────────────────────────────────────────────── */}
      <div className="relative" style={{ height: `${gridHeight}px` }}>
        {/* Hour backbone */}
        {HOURS.map(h => (
          <div
            key={h}
            className={HOUR_ROW}
            style={{ top: `${h * pxPerHour}px`, height: `${pxPerHour}px` }}
          >
            <span className={HOUR_LABEL}>{String(h).padStart(2, '0')}</span>
            <div className={GRID_LINE} />
          </div>
        ))}

        {/* Block area (right of label column) */}
        <div className={BLOCK_AREA}>
          {/* "Jetzt" line — only on today */}
          {nowTopPx !== null && (
            <div
              ref={nowLineRef}
              className={NOW_LINE_ROW}
              style={{ top: `${nowTopPx}px` }}
              aria-hidden="true"
            >
              <span className={NOW_DOT} />
              <div className={NOW_LINE} />
            </div>
          )}

          {/* Deadline lines — one per unique deadline time */}
          {Array.from(deadlineByTime.entries()).map(([time, group]) => {
            const [h, m] = time.split(':').map(Number);
            const topPx = (h * 60 + m) * (pxPerHour / 60);
            return (
              <DeadlineLine
                key={`deadline-${time}`}
                time={time}
                entries={group}
                topPx={topPx}
                onSelectSingle={onSelect}
                onOpenSheet={setOpenDeadlineTime}
              />
            );
          })}

          {/* Entry blocks */}
          {entries.map(entry => {
            const { top, height } = getBlockGeometry(
              entry.payload.startTime!,
              entry.payload.endTime,
              pxPerHour,
            );
            return (
              <GridBlock
                key={entry.id}
                entry={entry}
                status={getTemporalStatus(date, entry.payload.startTime, now)}
                topPx={top}
                heightPx={height}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            );
          })}
        </div>
      </div>

      {/* Deadline entries panel */}
      <DeadlineSheet
        time={openDeadlineTime}
        entries={openDeadlineEntries}
        onClose={() => setOpenDeadlineTime(null)}
        onSelect={onSelect}
        onToggle={onToggle}
      />
    </div>
  );
}
