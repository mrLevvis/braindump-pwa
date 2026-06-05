import type { BrainDumpEntry } from '../../braindump/types';
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

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  date: string;
  entries: readonly BrainDumpEntry[];
  isToday: boolean;
  now: Date;
  onSelect: (entry: BrainDumpEntry) => void;
  onToggle: (id: string, completed: boolean) => void;
}

export function DayGrid({ date, entries, isToday, now, onSelect, onToggle }: Readonly<Props>) {
  // Off-grid: entries without startTime are excluded (see A12).
  const timedEntries = entries.filter(e => e.payload.startTime != null);

  // 1 min = 1 px (HOUR_HEIGHT_PX = 60)
  const nowTopPx = isToday ? now.getHours() * 60 + now.getMinutes() : null;

  return (
    <div className="relative" style={{ height: `${GRID_TOTAL_HEIGHT_PX}px` }}>
      {/* ── Hour backbone ────────────────────────────────────────────────────── */}
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

      {/* ── Block area (right of label column) ──────────────────────────────── */}
      <div className={BLOCK_AREA}>
        {/* "Jetzt" line — only on today */}
        {nowTopPx !== null && (
          <div
            className={NOW_LINE_ROW}
            style={{ top: `${nowTopPx}px` }}
            aria-hidden="true"
          >
            <span className={NOW_DOT} />
            <div className={NOW_LINE} />
          </div>
        )}

        {/* Entry blocks */}
        {timedEntries.map(entry => {
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
  );
}
