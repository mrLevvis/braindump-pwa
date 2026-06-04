import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useGoToNextDay, useGoToPreviousDay, useGoToToday,
  useSelectedDate, useSelectedDayEntries, useTimelineBuckets,
} from '../../../hooks/timelineSelectors';
import { TimelineItem } from './TimelineItem';
import { UntimedSection } from './UntimedSection';

const VIEW = ['flex', 'min-h-dvh', 'flex-col', 'bg-background'].join(' ');
const HEADER = ['shrink-0', 'border-b', 'bg-background', 'sticky', 'top-0', 'z-10'].join(' ');
const HEADER_INNER = [
  'mx-auto', 'flex', 'w-full', 'max-w-3xl',
  'items-center', 'justify-between', 'px-4', 'py-4',
].join(' ');
const ICON_BTN = [
  'flex', 'items-center', 'justify-center',
  'h-8', 'w-8', 'rounded-lg', 'shrink-0',
  'text-muted-foreground', 'hover:text-foreground', 'hover:bg-muted/50',
  'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');
const NAV = ['flex', 'items-center', 'gap-1'].join(' ');
const DATE_LABEL = [
  'text-sm', 'font-semibold', 'tracking-tight',
  'min-w-[8rem]', 'text-center', 'select-none',
].join(' ');
const TODAY_BTN = [
  'ml-1', 'rounded', 'px-2', 'py-0.5',
  'text-xs', 'font-medium',
  'bg-primary/10', 'text-primary',
  'hover:bg-primary/20', 'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');
const MAIN = ['flex-1', 'overflow-y-auto'].join(' ');
const MAIN_INNER = ['mx-auto', 'w-full', 'max-w-3xl', 'px-4', 'py-4'].join(' ');
const EMPTY = [
  'flex', 'h-48', 'items-center', 'justify-center',
  'text-sm', 'text-muted-foreground',
].join(' ');

const NAV_FORMAT = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
});

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatNavDate(dateStr: string): string {
  return NAV_FORMAT.format(new Date(`${dateStr}T00:00:00`));
}

interface Props {
  onBack: () => void;
}

export function TimelineView({ onBack }: Readonly<Props>) {
  const entries = useSelectedDayEntries();
  const { untimed } = useTimelineBuckets();
  const selectedDate = useSelectedDate();
  const goToPreviousDay = useGoToPreviousDay();
  const goToNextDay = useGoToNextDay();
  const goToToday = useGoToToday();

  const isToday = selectedDate === todayLocal();

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

          <nav className={NAV} aria-label="Tagesnavigation">
            <button
              type="button"
              className={ICON_BTN}
              onClick={goToPreviousDay}
              aria-label="Vorheriger Tag"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className={DATE_LABEL}>
              {isToday ? 'Heute' : formatNavDate(selectedDate)}
            </span>
            {!isToday && (
              <button type="button" className={TODAY_BTN} onClick={goToToday}>
                Heute
              </button>
            )}
            <button
              type="button"
              className={ICON_BTN}
              onClick={goToNextDay}
              aria-label="Nächster Tag"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>

          <UntimedSection entries={untimed} />
        </div>
      </header>

      <main className={MAIN}>
        <div className={MAIN_INNER}>
          {entries.length === 0 ? (
            <p className={EMPTY}>Keine Einträge für diesen Tag.</p>
          ) : (
            entries.map((entry, i) => (
              <TimelineItem key={entry.id} entry={entry} isLast={i === entries.length - 1} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
