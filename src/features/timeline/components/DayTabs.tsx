import { useEffect, useRef } from 'react';
import { shiftDate, todayLocal } from '../../../lib/dateUtils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DayTabsProps {
  selectedDate: string;
  windowRadiusDays: number;
  onSelectDay: (date: string) => void;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const WEEKDAY_FMT = new Intl.DateTimeFormat('de-DE', { weekday: 'short' });
const DAY_FMT = new Intl.DateTimeFormat('de-DE', { day: 'numeric' });

function formatTab(iso: string): { weekday: string; day: string } {
  const d = new Date(`${iso}T00:00:00`);
  return {
    weekday: WEEKDAY_FMT.format(d).replace('.', ''),
    day: DAY_FMT.format(d),
  };
}

// ─── Class constants ──────────────────────────────────────────────────────────

const SCROLL = [
  'overflow-x-auto',
  '[scrollbar-width:none]',
  '[&::-webkit-scrollbar]:hidden',
].join(' ');

const TRACK = ['flex', 'items-stretch', 'gap-0.5', 'px-1', 'py-1'].join(' ');

const TAB_BASE = [
  'flex', 'flex-col', 'items-center', 'justify-center', 'gap-0.5',
  'min-w-[2.75rem]', 'h-13', 'rounded-xl', 'shrink-0',
  'select-none', 'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');

const TAB_ACTIVE = [TAB_BASE, 'bg-primary text-primary-foreground'].join(' ');
const TAB_INACTIVE = [TAB_BASE, 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'].join(' ');

// ─── Component ────────────────────────────────────────────────────────────────

export function DayTabs({ selectedDate, windowRadiusDays, onSelectDay }: Readonly<DayTabsProps>) {
  const today = todayLocal();
  const activeRef = useRef<HTMLButtonElement>(null);

  const days = Array.from(
    { length: 2 * windowRadiusDays + 1 },
    (_, i) => shiftDate(selectedDate, i - windowRadiusDays),
  );

  // Keep the active tab centered in the scroll container whenever the selection changes.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
  }, [selectedDate]);

  return (
    <div className={SCROLL}>
      <div className={TRACK}>
        {days.map((date) => {
          const isActive = date === selectedDate;
          const isToday = date === today;
          const { weekday, day } = formatTab(date);

          return (
            <button
              key={date}
              ref={isActive ? activeRef : undefined}
              type="button"
              className={isActive ? TAB_ACTIVE : TAB_INACTIVE}
              onClick={() => onSelectDay(date)}
              aria-label={`${date}${isToday ? ' (heute)' : ''}`}
              aria-pressed={isActive}
            >
              <span className="text-[10px] font-medium uppercase tracking-wide leading-none">
                {weekday}
              </span>
              <span className={['text-sm leading-none', isActive ? 'font-bold' : 'font-semibold'].join(' ')}>
                {day}
              </span>
              {isToday && (
                <span
                  className={['h-1 w-1 rounded-full', isActive ? 'bg-primary-foreground' : 'bg-primary'].join(' ')}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
