import type { TimelineDayGroup } from '../types';
import { TimelineItem } from './TimelineItem';

const SECTION = ['mb-6'].join(' ');
const HEADER = ['flex', 'items-center', 'gap-3', 'mb-3'].join(' ');
const DATE_LABEL = ['text-sm', 'font-semibold', 'text-foreground', 'shrink-0'].join(' ');
const DATE_LINE = ['flex-1', 'h-px', 'bg-border'].join(' ');

const DAY_FORMAT = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatDay(dateStr: string): string {
  // Append T00:00:00 to prevent UTC-midnight timezone shift on date-only strings
  return DAY_FORMAT.format(new Date(`${dateStr}T00:00:00`));
}

interface Props {
  day: TimelineDayGroup;
}

export function TimelineDaySection({ day }: Readonly<Props>) {
  const label = formatDay(day.date);
  return (
    <section className={SECTION} aria-label={label}>
      <header className={HEADER}>
        <time dateTime={day.date} className={DATE_LABEL}>
          {label}
        </time>
        <div className={DATE_LINE} aria-hidden="true" />
      </header>
      {day.entries.map((entry, i) => (
        <TimelineItem
          key={entry.id}
          entry={entry}
          isLast={i === day.entries.length - 1}
        />
      ))}
    </section>
  );
}
