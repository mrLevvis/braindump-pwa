import type { RefObject } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { TaskToggle } from '../../../components/TaskToggle';
import type { BrainDumpEntry } from '../../braindump/types';
import { CATEGORY_STYLES } from '../../braindump/categoryStyles';
import { getBlockGeometry, GRID_TOTAL_HEIGHT_PX, HOUR_HEIGHT_PX } from '../getBlockGeometry';
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
  const title = entry.title ?? entry.original_text;
  const { tintBackground, accent } = CATEGORY_STYLES[entry.category];

  return (
    <div className="relative">
      <button
        type="button"
        className={ALL_DAY_ENTRY_BTN}
        onClick={() => onSelect(entry)}
        aria-label={`Eintrag öffnen: ${title}`}
      >
        <Card size="sm" className={['rounded-lg py-2 transition hover:border-foreground/20', tintBackground, entry.completed ? 'opacity-60' : ''].join(' ')}>
          <CardContent className={['px-3 min-w-0', isTask ? 'pr-10' : ''].join(' ')}>
            <p className={['text-xs font-medium truncate min-w-0', entry.completed ? 'line-through text-muted-foreground' : ''].join(' ')}>
              {title}
            </p>
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

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  date: string;
  entries: readonly BrainDumpEntry[];
  /** Dated entries without startTime — shown in all-day section above the grid. */
  allDay: readonly BrainDumpEntry[];
  isToday: boolean;
  now: Date;
  nowLineRef?: RefObject<HTMLDivElement>;
  onSelect: (entry: BrainDumpEntry) => void;
  onToggle: (id: string, completed: boolean) => void;
}

export function DayGrid({ date, entries, allDay, isToday, now, nowLineRef, onSelect, onToggle }: Readonly<Props>) {
  // 1 min = 1 px (HOUR_HEIGHT_PX = 60)
  const nowTopPx = isToday ? now.getHours() * 60 + now.getMinutes() : null;

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
      <div className="relative" style={{ height: `${GRID_TOTAL_HEIGHT_PX}px` }}>
        {/* Hour backbone */}
        {HOURS.map(h => (
          <div
            key={h}
            className={HOUR_ROW}
            style={{ top: `${h * HOUR_HEIGHT_PX}px`, height: `${HOUR_HEIGHT_PX}px` }}
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

          {/* Entry blocks */}
          {entries.map(entry => {
            const { topMinutes, heightMinutes } = getBlockGeometry(
              entry.payload.startTime!,
              entry.payload.endTime,
            );
            return (
              <GridBlock
                key={entry.id}
                entry={entry}
                status={getTemporalStatus(date, entry.payload.startTime, now)}
                topPx={topMinutes}
                heightPx={heightMinutes}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
