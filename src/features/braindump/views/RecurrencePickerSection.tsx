import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import type { RecurrenceFreq, RecurrenceRule, Weekday } from '../types';
import { WEEKDAYS, WEEKDAY_LABEL_DE } from '../types';
import { defaultRecurrenceRule } from '../../timeline/recurrenceUtils';

interface Props {
  value: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
}

const FREQ_LABELS: Record<RecurrenceFreq, string> = {
  DAILY: 'Täglich', WEEKLY: 'Wöchentlich', MONTHLY: 'Monatlich', YEARLY: 'Jährlich',
};

const INTERVAL_UNIT: Record<RecurrenceFreq, string> = {
  DAILY: 'Tage', WEEKLY: 'Wochen', MONTHLY: 'Monate', YEARLY: 'Jahre',
};

const PILL_BASE = 'rounded-lg border px-2 py-1 text-xs font-medium transition-colors';
const PILL_ACTIVE = 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40';
const PILL_INACTIVE = 'border-border text-muted-foreground hover:bg-muted/50';

export function RecurrencePickerSection({ value, onChange }: Readonly<Props>) {
  const enabled = value != null;

  const toggle = () => {
    onChange(enabled ? null : defaultRecurrenceRule());
  };

  const update = (patch: Partial<RecurrenceRule>) => {
    if (!value) return;
    const updated = { ...value, ...patch };
    if (patch.freq && patch.freq !== 'WEEKLY') delete updated.byDay;
    if (patch.freq && patch.freq !== 'MONTHLY') delete updated.byMonthPos;
    onChange(updated);
  };

  const toggleDay = (day: Weekday) => {
    if (!value) return;
    const current = value.byDay ?? [];
    const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
    onChange({ ...value, byDay: next.length > 0 ? next : undefined });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 text-sm"
        aria-pressed={enabled}
      >
        <span
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
            enabled ? 'border-sky-500 bg-sky-500' : 'border-border',
          )}
          aria-hidden="true"
        >
          {enabled && <span className="block h-2 w-2 rounded-sm bg-white" />}
        </span>
        <span className={enabled ? 'text-foreground' : 'text-muted-foreground'}>Wiederholt sich</span>
      </button>

      {enabled && value && (
        <div className="space-y-3 pl-6">
          {/* Frequency */}
          <div className="flex flex-wrap gap-1.5">
            {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as RecurrenceFreq[]).map(freq => (
              <button
                key={freq}
                type="button"
                onClick={() => update({ freq })}
                className={cn(PILL_BASE, value.freq === freq ? PILL_ACTIVE : PILL_INACTIVE)}
              >
                {FREQ_LABELS[freq]}
              </button>
            ))}
          </div>

          {/* Interval */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Alle</span>
            <Input
              type="number"
              min={1}
              value={value.interval}
              onChange={e => update({ interval: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className="h-7 w-16 text-sm"
            />
            <span className="text-muted-foreground">{INTERVAL_UNIT[value.freq]}</span>
          </div>

          {/* byDay for WEEKLY */}
          {value.freq === 'WEEKLY' && (
            <div className="flex flex-wrap gap-1">
              {WEEKDAYS.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    'rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
                    (value.byDay ?? []).includes(day) ? PILL_ACTIVE : PILL_INACTIVE,
                  )}
                >
                  {WEEKDAY_LABEL_DE[day]}
                </button>
              ))}
            </div>
          )}

          {/* End condition */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ende</p>
            <div className="flex flex-wrap gap-1.5">
              {(['forever', 'until', 'count'] as const).map(endType => (
                <button
                  key={endType}
                  type="button"
                  onClick={() => {
                    const end =
                      endType === 'forever'
                        ? { type: 'forever' as const }
                        : endType === 'until'
                          ? { type: 'until' as const, date: '' }
                          : { type: 'count' as const, count: 10 };
                    update({ end });
                  }}
                  className={cn(PILL_BASE, value.end.type === endType ? PILL_ACTIVE : PILL_INACTIVE)}
                >
                  {endType === 'forever' ? 'Immer' : endType === 'until' ? 'Bis Datum' : 'Anzahl'}
                </button>
              ))}
            </div>

            {value.end.type === 'until' && (
              <Input
                type="date"
                value={value.end.date}
                onChange={e => update({ end: { type: 'until', date: e.target.value } })}
                className="h-7 text-sm"
              />
            )}

            {value.end.type === 'count' && (
              <div className="flex items-center gap-2 text-sm">
                <Input
                  type="number"
                  min={1}
                  value={value.end.count}
                  onChange={e =>
                    update({ end: { type: 'count', count: Math.max(1, parseInt(e.target.value, 10) || 1) } })
                  }
                  className="h-7 w-20 text-sm"
                />
                <span className="text-muted-foreground">Mal</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
