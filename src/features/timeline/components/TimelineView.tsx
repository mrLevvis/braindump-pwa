import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { EntryDetailPanel } from '../../braindump/views/EntryDetailPanel';
import {
  useDatedTimelessEntries,
  useDayMarkers,
  useGoToToday,
  useSelectedDate,
  useSelectedDayTimedEntries,
  useSetSelectedDate,
  useTimelineBuckets,
} from '../../../hooks/timelineSelectors';
import { useEntries, useToggleTaskCompleted } from '../../../hooks/braindumpSelectors';
import { useNow } from '../../../hooks/useNow';
import { todayLocal } from '../../../lib/dateUtils';
import { DayGrid } from './DayGrid';
import { DayTabs } from './DayTabs';
import { UntimedSection } from './UntimedSection';

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

const VIEW = ['flex', 'h-dvh', 'flex-col', 'bg-background'].join(' ');
const HEADER = ['shrink-0', 'border-b', 'bg-background', 'sticky', 'top-0', 'z-10'].join(' ');
// Row 1: back + current date label + actions
const HEADER_TOP = [
  'mx-auto', 'flex', 'w-full', 'max-w-3xl',
  'items-center', 'justify-between', 'px-4', 'py-3',
].join(' ');
// Row 2: scrollable day-tab strip
const TABS_ROW = ['mx-auto', 'w-full', 'max-w-3xl', 'px-2', 'pb-2'].join(' ');
const ICON_BTN = [
  'flex', 'items-center', 'justify-center',
  'h-8', 'w-8', 'rounded-lg', 'shrink-0',
  'text-muted-foreground', 'hover:text-foreground', 'hover:bg-muted/50',
  'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');
const CURRENT_DATE = [
  'text-sm', 'font-semibold', 'text-center', 'select-none',
].join(' ');
const MAIN = ['flex-1', 'overflow-y-auto'].join(' ');
const MAIN_INNER = ['mx-auto', 'w-full', 'max-w-3xl', 'px-4', 'py-4', 'pb-36'].join(' ');
const HEADER_ACTIONS = ['flex', 'items-center', 'gap-1'].join(' ');
const JETZT_BTN = [
  'flex', 'items-center', 'gap-1', 'px-2', 'h-8', 'rounded-lg', 'shrink-0',
  'text-xs', 'font-medium',
  'text-muted-foreground', 'hover:text-foreground', 'hover:bg-muted/50',
  'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');

// ─── TimelineView (Container) ─────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

export function TimelineView({ onBack }: Readonly<Props>) {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const allEntries = useEntries();
  const selectedEntry = selectedEntryId != null
    ? (allEntries.find(e => e.id === selectedEntryId) ?? null)
    : null;

  const { undated } = useTimelineBuckets();
  const toggleTaskCompleted = useToggleTaskCompleted();
  const selectedDate = useSelectedDate();
  const goToToday = useGoToToday();
  const setSelectedDate = useSetSelectedDate();
  const timedEntries = useSelectedDayTimedEntries();
  const datedTimeless = useDatedTimelessEntries();
  const dayMarkers = useDayMarkers();

  const now = useNow();
  const todayStr = todayLocal();
  const isToday = selectedDate === todayStr;

  const nowLineRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef(false);

  const handleNowClick = () => {
    if (!isToday) {
      goToToday();
      pendingScrollRef.current = true;
    } else {
      nowLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // On mount: jump to current time without animation so the view opens at the right position.
  // isTodayOnMount captures the value at render time; the empty-deps effect runs exactly once.
  const isTodayOnMount = useRef(isToday);
  useEffect(() => {
    if (isTodayOnMount.current) nowLineRef.current?.scrollIntoView({ behavior: 'instant', block: 'center' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // After navigating to today via handleNowClick, scroll to the now-line once it mounts.
  useEffect(() => {
    if (isToday && pendingScrollRef.current) {
      pendingScrollRef.current = false;
      nowLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isToday]);

  return (
    <div className={VIEW}>
      <header className={HEADER}>
        {/* Row 1: back + current date label + actions */}
        <div className={HEADER_TOP}>
          <button
            type="button"
            className={ICON_BTN}
            onClick={onBack}
            aria-label="Zurück zur Übersicht"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <time dateTime={selectedDate} className={CURRENT_DATE}>
            {formatNavLabel(selectedDate, todayStr)}
          </time>

          <div className={HEADER_ACTIONS}>
            <button
              type="button"
              className={JETZT_BTN}
              onClick={handleNowClick}
              aria-label="Zur aktuellen Uhrzeit springen"
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Jetzt</span>
            </button>
            <UntimedSection
              undated={undated}
              onSelect={(e) => setSelectedEntryId(e.id)}
              onToggle={toggleTaskCompleted}
            />
          </div>
        </div>

        {/* Row 2: scrollable day-tab strip (primary day navigation) */}
        <div className={TABS_ROW}>
          <DayTabs
            selectedDate={selectedDate}
            windowRadiusDays={30}
            onSelectDay={setSelectedDate}
            markers={dayMarkers}
          />
        </div>
      </header>

      <main className={MAIN}>
        <div className={MAIN_INNER}>
          <DayGrid
            date={selectedDate}
            entries={timedEntries}
            allDay={datedTimeless}
            isToday={isToday}
            now={now}
            nowLineRef={nowLineRef}
            onSelect={(e) => setSelectedEntryId(e.id)}
            onToggle={toggleTaskCompleted}
          />
        </div>
      </main>

      {selectedEntry !== null && (
        <EntryDetailPanel
          entry={selectedEntry}
          open
          onOpenChange={(open) => { if (!open) setSelectedEntryId(null); }}
        />
      )}
    </div>
  );
}
