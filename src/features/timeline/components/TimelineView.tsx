import { ArrowLeft } from 'lucide-react';
import { useTimelineBuckets } from '../../../hooks/timelineSelectors';
import { TimelineDaySection } from './TimelineDaySection';
import { UntimedSection } from './UntimedSection';

const VIEW = ['flex', 'min-h-dvh', 'flex-col', 'bg-background'].join(' ');
const HEADER = ['shrink-0', 'border-b', 'bg-background', 'sticky', 'top-0', 'z-10'].join(' ');
const HEADER_INNER = [
  'mx-auto', 'flex', 'w-full', 'max-w-3xl',
  'items-center', 'justify-between', 'px-4', 'py-4',
].join(' ');
const HEADER_LEFT = ['flex', 'items-center', 'gap-3'].join(' ');
const BACK_BTN = [
  'flex', 'items-center', 'justify-center',
  'h-8', 'w-8', 'rounded-lg', 'shrink-0',
  'text-muted-foreground', 'hover:text-foreground', 'hover:bg-muted/50',
  'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');
const TITLE = ['text-2xl', 'font-semibold', 'tracking-tight'].join(' ');
const MAIN = ['flex-1', 'overflow-y-auto'].join(' ');
const MAIN_INNER = ['mx-auto', 'w-full', 'max-w-3xl', 'px-4', 'py-4'].join(' ');
const EMPTY = [
  'flex', 'h-48', 'items-center', 'justify-center',
  'text-sm', 'text-muted-foreground',
].join(' ');

const EMPTY_TEXT = {
  timedEmpty: 'Keine geplanten Termine.',
  allEmpty:   'Keine geplanten Termine oder zu erledigenden Tasks.',
} as const;

interface Props {
  onBack: () => void;
}

export function TimelineView({ onBack }: Readonly<Props>) {
  const { days, untimed } = useTimelineBuckets();

  return (
    <div className={VIEW}>
      <header className={HEADER}>
        <div className={HEADER_INNER}>
          <div className={HEADER_LEFT}>
            <button
              type="button"
              className={BACK_BTN}
              onClick={onBack}
              aria-label="Zurück zur Übersicht"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <h1 className={TITLE}>Timeline</h1>
          </div>
          <UntimedSection entries={untimed} />
        </div>
      </header>

      <main className={MAIN}>
        <div className={MAIN_INNER}>
          {days.length === 0 ? (
            <p className={EMPTY}>
              {EMPTY_TEXT[untimed.length > 0 ? 'timedEmpty' : 'allEmpty']}
            </p>
          ) : (
            days.map(day => (
              <TimelineDaySection key={day.date} day={day} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
