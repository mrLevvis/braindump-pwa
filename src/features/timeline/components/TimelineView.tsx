import { Fragment, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BrainDumpEntry } from '../../braindump/types';
import { EntryDetailPanel } from '../../braindump/views/EntryDetailPanel';
import {
  useGoToNextDay,
  useGoToPreviousDay,
  useGoToToday,
  useSelectedDate,
  useTimelineBuckets,
} from '../../../hooks/timelineSelectors';
import { getTemporalStatus } from '../getTemporalStatus';
import { TimelineItem } from './TimelineItem';
import { UntimedSection } from './UntimedSection';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const NAV_DATE_FORMAT = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const NOW_TIME_FORMAT = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatNavLabel(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return 'Heute';
  return NAV_DATE_FORMAT.format(new Date(`${dateStr}T00:00:00`));
}

// ─── Class name constants ─────────────────────────────────────────────────────

const VIEW = ['flex', 'min-h-dvh', 'flex-col', 'bg-background'].join(' ');
const HEADER = ['shrink-0', 'border-b', 'bg-background', 'sticky', 'top-0', 'z-10'].join(' ');
const HEADER_INNER = [
  'mx-auto', 'flex', 'w-full', 'max-w-3xl',
  'items-center', 'justify-between', 'px-4', 'py-3',
].join(' ');
const ICON_BTN = [
  'flex', 'items-center', 'justify-center',
  'h-8', 'w-8', 'rounded-lg', 'shrink-0',
  'text-muted-foreground', 'hover:text-foreground', 'hover:bg-muted/50',
  'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');
const DAY_NAV = ['flex', 'items-center', 'gap-0.5'].join(' ');
// Fixed width prevents layout shift when the label text changes between days
const DAY_LABEL_BASE = ['min-w-[9rem]', 'text-center', 'text-sm', 'font-semibold', 'select-none', 'px-1'].join(' ');
const DAY_LABEL_STATIC = DAY_LABEL_BASE;
const DAY_LABEL_LINK = [DAY_LABEL_BASE, 'cursor-pointer', 'hover:text-primary', 'transition-colors'].join(' ');
const MAIN = ['flex-1', 'overflow-y-auto'].join(' ');
const MAIN_INNER = ['mx-auto', 'w-full', 'max-w-3xl', 'px-4', 'py-4'].join(' ');
const EMPTY = [
  'flex', 'h-48', 'items-center', 'justify-center',
  'text-sm', 'text-muted-foreground',
].join(' ');

const DAY_EMPTY_TEXT = {
  today: 'Heute nichts geplant.',
  other: 'Für diesen Tag nichts geplant.',
} as const;

// ─── NowMarker ────────────────────────────────────────────────────────────────

const NOW_GRID = ['grid', 'grid-cols-[3rem_2rem_1fr]', 'gap-x-2', 'my-2'].join(' ');
const NOW_TIME = ['text-xs', 'font-mono', 'tabular-nums', 'text-right', 'text-sky-500', 'self-center', 'leading-none'].join(' ');
const NOW_SPINE = ['flex', 'justify-center', 'items-center'].join(' ');
const NOW_DOT = ['h-2', 'w-2', 'rounded-full', 'bg-sky-500', 'ring-2', 'ring-sky-500/25', 'shrink-0'].join(' ');
const NOW_LABEL_ROW = ['flex', 'items-center', 'gap-2', 'self-center'].join(' ');
const NOW_LINE = ['h-px', 'flex-1', 'bg-sky-500/40'].join(' ');
const NOW_TEXT = ['text-xs', 'text-sky-500', 'font-medium', 'shrink-0'].join(' ');

function NowMarker({ now }: { readonly now: Date }) {
  return (
    <div className={NOW_GRID} aria-hidden="true">
      <span className={NOW_TIME}>{NOW_TIME_FORMAT.format(now)}</span>
      <div className={NOW_SPINE}>
        <span className={NOW_DOT} />
      </div>
      <div className={NOW_LABEL_ROW}>
        <div className={NOW_LINE} />
        <span className={NOW_TEXT}>Jetzt</span>
      </div>
    </div>
  );
}

// ─── TimelineView (Container) ─────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

export function TimelineView({ onBack }: Readonly<Props>) {
  const [selectedEntry, setSelectedEntry] = useState<BrainDumpEntry | null>(null);

  const { byDate, untimed } = useTimelineBuckets();
  const selectedDate = useSelectedDate();
  const goToPreviousDay = useGoToPreviousDay();
  const goToNextDay = useGoToNextDay();
  const goToToday = useGoToToday();

  const now = new Date();
  const todayStr = todayLocal();
  const isToday = selectedDate === todayStr;

  const dayEntries = byDate.get(selectedDate) ?? [];

  // Index of the first non-past entry — where the "Jetzt" marker is inserted.
  // null  → not today (no marker)
  // -1    → all entries are past (marker goes at the end)
  // >= 0  → marker goes before that entry
  const nowBoundaryIndex: number | null = isToday
    ? dayEntries.findIndex(e => getTemporalStatus(e.payload.date!, e.payload.startTime, now) !== 'past')
    : null;

  return (
    <div className={VIEW}>
      <header className={HEADER}>
        <div className={HEADER_INNER}>
          <button
            type="button"
            className={ICON_BTN}
            onClick={onBack}
            aria-label="Zurück zur Übersicht"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className={DAY_NAV}>
            <button
              type="button"
              className={ICON_BTN}
              onClick={goToPreviousDay}
              aria-label="Vorheriger Tag"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Clicking the label jumps to today when on a different day */}
            <time
              dateTime={selectedDate}
              className={isToday ? DAY_LABEL_STATIC : DAY_LABEL_LINK}
              title={isToday ? undefined : 'Zu heute springen'}
              onClick={isToday ? undefined : goToToday}
            >
              {formatNavLabel(selectedDate, todayStr)}
            </time>

            <button
              type="button"
              className={ICON_BTN}
              onClick={goToNextDay}
              aria-label="Nächster Tag"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <UntimedSection entries={untimed} />
        </div>
      </header>

      <main className={MAIN}>
        <div className={MAIN_INNER}>
          {dayEntries.length === 0 ? (
            <p className={EMPTY}>{DAY_EMPTY_TEXT[isToday ? 'today' : 'other']}</p>
          ) : (
            <>
              {dayEntries.map((entry, i) => (
                <Fragment key={entry.id}>
                  {nowBoundaryIndex === i && <NowMarker now={now} />}
                  <TimelineItem
                    entry={entry}
                    status={getTemporalStatus(entry.payload.date!, entry.payload.startTime, now)}
                    isLast={i === dayEntries.length - 1}
                    onSelect={setSelectedEntry}
                  />
                </Fragment>
              ))}
              {nowBoundaryIndex === -1 && <NowMarker now={now} />}
            </>
          )}
        </div>
      </main>

      {selectedEntry !== null && (
        <EntryDetailPanel
          entry={selectedEntry}
          open
          onOpenChange={(open) => { if (!open) setSelectedEntry(null); }}
        />
      )}
    </div>
  );
}
