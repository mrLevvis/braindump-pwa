import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
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
import { shiftDate, todayLocal } from '../../../lib/dateUtils';
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
const HEADER_TOP = [
  'mx-auto', 'flex', 'w-full', 'max-w-3xl',
  'items-center', 'justify-between', 'px-4', 'py-3',
].join(' ');
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
// Scroll container: clips the track horizontally, each panel scrolls vertically.
const MAIN  = ['flex-1', 'overflow-hidden'].join(' ');
const TRACK = ['flex', 'h-full'].join(' ');
const PANEL = ['shrink-0', 'h-full', 'overflow-y-auto'].join(' ');
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

// Track resting at the middle (current) panel; 300%-wide track, each panel = 100% of viewport.
const TRACK_REST = 'translateX(-33.3333%)';
const TRACK_PREV = 'translateX(0%)';          // fully shows prev panel
const TRACK_NEXT = 'translateX(-66.6667%)';   // fully shows next panel

const NO_ENTRIES: readonly BrainDumpEntry[] = [];

// ─── TimelineView (Container) ─────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

export function TimelineView({ onBack }: Readonly<Props>) {
  const [selectedEntry, setSelectedEntry] = useState<BrainDumpEntry | null>(null);

  // For real (non-virtual) entries, keep the selected entry fresh from the store.
  // Recurrence virtual occurrences are kept as-is (scope dialogs need the occurrence snapshot).
  // Multi-day expansion virtuals resolve to the master so the panel always shows the real startDate.
  const allEntries = useEntries();
  const resolvedEntry = useMemo(() => {
    if (!selectedEntry) return null;
    if (selectedEntry._isVirtualOccurrence) return selectedEntry;
    if (selectedEntry._isMultiDayExpansion) {
      const masterId = selectedEntry.id.replace(/__mde__.*$/, '');
      return allEntries.find(e => e.id === masterId) ?? selectedEntry;
    }
    return allEntries.find(e => e.id === selectedEntry.id) ?? selectedEntry;
  }, [selectedEntry, allEntries]);

  const { undated, byDate } = useTimelineBuckets();
  const { triggerToggle, dialogs } = useTaskCompletionFlow();
  const selectedDate = useSelectedDate();
  const goToToday = useGoToToday();
  const setSelectedDate = useSetSelectedDate();
  const timedEntries = useSelectedDayTimedEntries();
  const datedTimeless = useDatedTimelessEntries();
  const dayMarkers = useDayMarkers();

  // Adjacent day entries (for the swipe preview panels).
  const prevDate = useMemo(() => shiftDate(selectedDate, -1), [selectedDate]);
  const nextDate = useMemo(() => shiftDate(selectedDate,  1), [selectedDate]);
  const prevEntries = byDate.get(prevDate) ?? NO_ENTRIES;
  const nextEntries = byDate.get(nextDate) ?? NO_ENTRIES;
  const prevTimed  = useMemo(() => prevEntries.filter(e => e.payload.startTime != null), [prevEntries]);
  const prevAllDay = useMemo(() => prevEntries.filter(e => e.payload.startTime == null), [prevEntries]);
  const nextTimed  = useMemo(() => nextEntries.filter(e => e.payload.startTime != null), [nextEntries]);
  const nextAllDay = useMemo(() => nextEntries.filter(e => e.payload.startTime == null), [nextEntries]);

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

  const mainRef         = useRef<HTMLDivElement>(null);
  const trackRef        = useRef<HTMLDivElement>(null);
  const prevPanelRef    = useRef<HTMLDivElement>(null);
  const currentPanelRef = useRef<HTMLDivElement>(null);
  const nextPanelRef    = useRef<HTMLDivElement>(null);
  const pinchInitialDist = useRef(0);
  const pinchInitialPx   = useRef(0);
  const pxPerHourRef     = useRef(pxPerHour);
  useEffect(() => { pxPerHourRef.current = pxPerHour; }, [pxPerHour]);

  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const gestureMode = useRef<'unknown' | 'swipe' | 'scroll'>('unknown');
  const selectedDateRef = useRef(selectedDate);
  useEffect(() => { selectedDateRef.current = selectedDate; }, [selectedDate]);

  // Set the track to show the middle (current) panel on mount.
  // We manage this imperatively so React re-renders never fight the animation.
  useLayoutEffect(() => {
    if (trackRef.current) trackRef.current.style.transform = TRACK_REST;
  }, []);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const verticalDist = (t: TouchList) => Math.abs(t[0].clientY - t[1].clientY);

    const snapBack = () => {
      const track = trackRef.current;
      if (!track) return;
      track.style.transition = 'transform 0.2s ease';
      track.style.transform = TRACK_REST;
      const cleanup = () => {
        track.removeEventListener('transitionend', cleanup);
        track.style.transition = '';
      };
      track.addEventListener('transitionend', cleanup);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchInitialDist.current = verticalDist(e.touches);
        pinchInitialPx.current   = pxPerHourRef.current;
        gestureMode.current = 'scroll';
      } else if (e.touches.length === 1) {
        swipeStartX.current = e.touches[0].clientX;
        swipeStartY.current = e.touches[0].clientY;
        gestureMode.current = 'unknown';
        // Mirror center scroll to side panels so the target is already at the
        // right position the moment the user's finger starts pulling it into view.
        const scrollTop = currentPanelRef.current?.scrollTop ?? 0;
        if (prevPanelRef.current)  prevPanelRef.current.scrollTop  = scrollTop;
        if (nextPanelRef.current)  nextPanelRef.current.scrollTop  = scrollTop;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        if (pinchInitialDist.current === 0) return;
        const scale = verticalDist(e.touches) / pinchInitialDist.current;
        setPxPerHour(Math.round(pinchInitialPx.current * scale));
        return;
      }
      if (e.touches.length !== 1 || gestureMode.current === 'scroll') return;

      const dx = e.touches[0].clientX - swipeStartX.current;
      const dy = e.touches[0].clientY - swipeStartY.current;

      if (gestureMode.current === 'unknown') {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        gestureMode.current = Math.abs(dx) > Math.abs(dy) ? 'swipe' : 'scroll';
      }

      if (gestureMode.current === 'swipe') {
        e.preventDefault();
        const track = trackRef.current;
        if (track) {
          track.style.transition = 'none';
          track.style.transform = `translateX(calc(-33.3333% + ${dx}px))`;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchInitialDist.current = 0;
      if (gestureMode.current !== 'swipe' || e.changedTouches.length !== 1 || e.touches.length !== 0) return;
      gestureMode.current = 'unknown';

      const dx = e.changedTouches[0].clientX - swipeStartX.current;
      const dy = e.changedTouches[0].clientY - swipeStartY.current;

      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        const track = trackRef.current;
        const toNext = dx < 0;
        const targetTransform = toNext ? TRACK_NEXT : TRACK_PREV;
        const dateToNavigate  = shiftDate(selectedDateRef.current, toNext ? 1 : -1);

        if (track) {
          track.style.transition = 'transform 0.2s ease-out';
          track.style.transform = targetTransform;
          const onDone = () => {
            track.removeEventListener('transitionend', onDone);
            track.style.transition = 'none';
            track.style.transform = TRACK_REST;
            // flushSync forces React to render synchronously inside the native
            // transitionend handler so the DayTabs indicator updates in the same
            // frame as the content — no one-frame lag between DayGrid and tab bar.
            flushSync(() => { setSelectedDate(dateToNavigate); });
          };
          track.addEventListener('transitionend', onDone);
        } else {
          setSelectedDate(dateToNavigate);
        }
      } else {
        snapBack();
      }
    };

    const onTouchCancel = () => {
      pinchInitialDist.current = 0;
      if (gestureMode.current === 'swipe') {
        gestureMode.current = 'unknown';
        snapBack();
      }
    };

    el.addEventListener('touchstart',  onTouchStart,  { passive: true });
    el.addEventListener('touchmove',   onTouchMove,   { passive: false });
    el.addEventListener('touchend',    onTouchEnd,    { passive: true });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      el.removeEventListener('touchstart',  onTouchStart);
      el.removeEventListener('touchmove',   onTouchMove);
      el.removeEventListener('touchend',    onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [setPxPerHour, setSelectedDate]);

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

      {/* overflow-hidden clips the track; touch events are captured here */}
      <main ref={mainRef} className={MAIN}>
        {/* 300%-wide flex track: [prev | current | next], each panel = 100% of main width */}
        <div ref={trackRef} className={TRACK} style={{ width: '300%' }}>
          <div ref={prevPanelRef} className={PANEL} style={{ width: '33.3333%' }}>
            <div className={MAIN_INNER}>
              <DayGrid
                date={prevDate}
                entries={prevTimed}
                allDay={prevAllDay}
                isToday={prevDate === todayStr}
                now={now}
                pxPerHour={pxPerHour}
                onSelect={setSelectedEntry}
                onToggle={triggerToggle}
              />
            </div>
          </div>

          <div ref={currentPanelRef} className={PANEL} style={{ width: '33.3333%' }}>
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
          </div>

          <div ref={nextPanelRef} className={PANEL} style={{ width: '33.3333%' }}>
            <div className={MAIN_INNER}>
              <DayGrid
                date={nextDate}
                entries={nextTimed}
                allDay={nextAllDay}
                isToday={nextDate === todayStr}
                now={now}
                pxPerHour={pxPerHour}
                onSelect={setSelectedEntry}
                onToggle={triggerToggle}
              />
            </div>
          </div>
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
