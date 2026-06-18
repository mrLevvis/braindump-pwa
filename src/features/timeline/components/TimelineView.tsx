import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { EntryDetailPanel } from '../../braindump/views/EntryDetailPanel';
import { useZoomStore } from '../store';
import {
  useDatedTimelessEntries,
  useDayMarkers,
  useGoToToday,
  useSelectedDate,
  useSelectedDayTimedEntries,
  useSetSelectedDate,
  useTimelineBuckets,
} from '../../../hooks/timelineSelectors';
import { useDaySelectionStore } from '../store/DaySelectionStore';
import { useEntries, useIsPrioritizing, usePrioritizeDayTasks, usePrioritizedDays } from '../../../hooks/braindumpSelectors';
import { useTaskCompletionFlow } from '../../braindump/views/TaskCompletionDialog';
import type { BrainDumpEntry } from '../../braindump/types';
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

const PRIO_BTN_ACTIVE = [ICON_BTN, 'text-primary'].join(' ');
const PRIO_BTN_SPINNING = 'animate-spin';

// ─── TimelineView (Container) ─────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

export function TimelineView({ onBack }: Readonly<Props>) {
  const [selectedEntry, setSelectedEntry] = useState<BrainDumpEntry | null>(null);

  // For real (non-virtual) entries, keep the selected entry fresh from the store.
  // Virtual occurrences are not in allEntries, so we keep the snapshot directly.
  const allEntries = useEntries();
  const resolvedEntry = useMemo(() => {
    if (!selectedEntry) return null;
    if (selectedEntry._isVirtualOccurrence) return selectedEntry;
    return allEntries.find(e => e.id === selectedEntry.id) ?? selectedEntry;
  }, [selectedEntry, allEntries]);

  const { undated } = useTimelineBuckets();
  const { triggerToggle, dialogs } = useTaskCompletionFlow();
  const selectedDate = useSelectedDate();
  const goToToday = useGoToToday();
  const setSelectedDate = useSetSelectedDate();
  const timedEntries = useSelectedDayTimedEntries();
  const datedTimeless = useDatedTimelessEntries();
  const dayMarkers = useDayMarkers();

  const isPrioritizing = useIsPrioritizing();
  const prioritizeDayTasks = usePrioritizeDayTasks();
  const prioritizedDays = usePrioritizedDays();
  const prioritizedIds = prioritizedDays[selectedDate];
  const hasPriority = prioritizedIds !== undefined;

  // Sort allDay entries: TASKs in LLM-determined order, then non-TASKs in original order.
  const sortedDatedTimeless = useMemo(() => {
    if (!prioritizedIds) return datedTimeless;
    const idOrder = new Map(prioritizedIds.map((id, i) => [id, i]));
    const tasks = datedTimeless.filter(e => e.category === 'TASK');
    const others = datedTimeless.filter(e => e.category !== 'TASK');
    const sortedTasks = [...tasks].sort(
      (a, b) => (idOrder.get(a.id) ?? Infinity) - (idOrder.get(b.id) ?? Infinity),
    );
    return [...sortedTasks, ...others];
  }, [datedTimeless, prioritizedIds]);

  const pxPerHour    = useZoomStore(s => s.pxPerHour);
  const setPxPerHour = useZoomStore(s => s.setPxPerHour);

  const mainRef = useRef<HTMLDivElement>(null);
  const pinchInitialDist = useRef(0);
  const pinchInitialPx   = useRef(0);
  const pxPerHourRef     = useRef(pxPerHour);
  useEffect(() => { pxPerHourRef.current = pxPerHour; }, [pxPerHour]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const verticalDist = (t: TouchList) => Math.abs(t[0].clientY - t[1].clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      pinchInitialDist.current = verticalDist(e.touches);
      pinchInitialPx.current   = pxPerHourRef.current;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      if (pinchInitialDist.current === 0) return;
      const scale = verticalDist(e.touches) / pinchInitialDist.current;
      setPxPerHour(Math.round(pinchInitialPx.current * scale));
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchInitialDist.current = 0;
    };

    el.addEventListener('touchstart',  onTouchStart, { passive: true });
    el.addEventListener('touchmove',   onTouchMove,  { passive: false });
    el.addEventListener('touchend',    onTouchEnd,   { passive: true });
    el.addEventListener('touchcancel', onTouchEnd,   { passive: true });

    return () => {
      el.removeEventListener('touchstart',  onTouchStart);
      el.removeEventListener('touchmove',   onTouchMove);
      el.removeEventListener('touchend',    onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [setPxPerHour]);

  const now = useNow();
  const todayStr = todayLocal();
  const isToday = selectedDate === todayStr;

  const pendingScrollEntryId    = useDaySelectionStore(s => s.pendingScrollEntryId);
  const setPendingScrollEntryId = useDaySelectionStore(s => s.setPendingScrollEntryId);

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

  // After "Zur Timeline" navigation: scroll to and open the target entry.
  useEffect(() => {
    if (!pendingScrollEntryId) return;
    const id = pendingScrollEntryId;
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector(`[data-entry-id="${id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setPendingScrollEntryId(null);
    });
    return () => cancelAnimationFrame(raf);
  }, [pendingScrollEntryId, timedEntries, datedTimeless, setPendingScrollEntryId]);

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
              className={hasPriority ? PRIO_BTN_ACTIVE : ICON_BTN}
              onClick={() => prioritizeDayTasks(selectedDate, datedTimeless)}
              disabled={isPrioritizing}
              aria-label="Tasks des Tages priorisieren"
              title="KI-Priorisierung"
            >
              <Sparkles className={['h-4 w-4', isPrioritizing ? PRIO_BTN_SPINNING : ''].join(' ')} aria-hidden="true" />
            </button>
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
              onSelect={setSelectedEntry}
              onToggle={triggerToggle}
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

      <main ref={mainRef} className={MAIN}>
        <div className={MAIN_INNER}>
          <DayGrid
            date={selectedDate}
            entries={timedEntries}
            allDay={sortedDatedTimeless}
            isToday={isToday}
            now={now}
            pxPerHour={pxPerHour}
            nowLineRef={nowLineRef}
            onSelect={setSelectedEntry}
            onToggle={triggerToggle}
          />
        </div>
      </main>

      {resolvedEntry !== null && (
        <EntryDetailPanel
          entry={resolvedEntry}
          open
          onOpenChange={(open) => { if (!open) setSelectedEntry(null); }}
        />
      )}

      {dialogs}
    </div>
  );
}
