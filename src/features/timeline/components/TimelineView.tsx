import { useState } from 'react';
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
import { useToggleTaskCompleted } from '../../../hooks/braindumpSelectors';
import { useNow } from '../../../hooks/useNow';
import { DayGrid } from './DayGrid';
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
// Fixed width prevents layout shift when the label text changes between days.
const DAY_LABEL_BASE = ['min-w-[9rem]', 'text-center', 'text-sm', 'font-semibold', 'select-none', 'px-1'].join(' ');
const DAY_LABEL_STATIC = DAY_LABEL_BASE;
const DAY_LABEL_LINK = [DAY_LABEL_BASE, 'cursor-pointer', 'hover:text-primary', 'transition-colors'].join(' ');
const MAIN = ['flex-1', 'overflow-y-auto'].join(' ');
const MAIN_INNER = ['mx-auto', 'w-full', 'max-w-3xl', 'px-4', 'py-4'].join(' ');

// ─── TimelineView (Container) ─────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

export function TimelineView({ onBack }: Readonly<Props>) {
  const [selectedEntry, setSelectedEntry] = useState<BrainDumpEntry | null>(null);

  const { byDate, undated } = useTimelineBuckets();
  const toggleTaskCompleted = useToggleTaskCompleted();
  const selectedDate = useSelectedDate();
  const goToPreviousDay = useGoToPreviousDay();
  const goToNextDay = useGoToNextDay();
  const goToToday = useGoToToday();

  const now = useNow();
  const todayStr = todayLocal();
  const isToday = selectedDate === todayStr;
  const dayEntries = byDate.get(selectedDate) ?? [];

  // Dated entries for the selected day that have no startTime — off-grid, shown in sheet.
  const datedTimeless = dayEntries.filter(e => e.payload.startTime == null);

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

          <UntimedSection
            datedTimeless={datedTimeless}
            undated={undated}
            onSelect={setSelectedEntry}
            onToggle={toggleTaskCompleted}
          />
        </div>
      </header>

      <main className={MAIN}>
        <div className={MAIN_INNER}>
          <DayGrid
            date={selectedDate}
            entries={dayEntries}
            isToday={isToday}
            now={now}
            onSelect={setSelectedEntry}
            onToggle={toggleTaskCompleted}
          />
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
