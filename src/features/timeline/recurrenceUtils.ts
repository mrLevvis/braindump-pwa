/**
 * src/features/timeline/recurrenceUtils.ts
 * Hilfsfunktionen für Wiederholungsregeln: Formatierung, Validierung, Defaults.
 */

import type { RecurrenceRule, RecurrenceEnd, RecurrenceFreq, Weekday } from '../braindump/types';
import { WEEKDAY_LABEL_DE } from '../braindump/types';

const FREQ_LABEL_DE: Record<RecurrenceFreq, { singular: string; plural: string }> = {
  DAILY:   { singular: 'Tag',   plural: 'Tage'   },
  WEEKLY:  { singular: 'Woche', plural: 'Wochen' },
  MONTHLY: { singular: 'Monat', plural: 'Monate' },
  YEARLY:  { singular: 'Jahr',  plural: 'Jahre'  },
};

const FREQ_ADV_DE: Record<RecurrenceFreq, string> = {
  DAILY:   'Täglich',
  WEEKLY:  'Wöchentlich',
  MONTHLY: 'Monatlich',
  YEARLY:  'Jährlich',
};

const ORDINAL_DE: Record<number, string> = {
  1: 'ersten', 2: 'zweiten', 3: 'dritten', 4: 'vierten', [-1]: 'letzten',
};

const WEEKDAY_LONG_DE: Record<Weekday, string> = {
  MO: 'Montag', TU: 'Dienstag', WE: 'Mittwoch',
  TH: 'Donnerstag', FR: 'Freitag', SA: 'Samstag', SU: 'Sonntag',
};

const DATE_FMT = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? iso : DATE_FMT.format(d);
}

function fmtEnd(end: RecurrenceEnd): string {
  if (end.type === 'forever') return '';
  if (end.type === 'until') return `, bis ${fmtDate(end.date)}`;
  return `, ${end.count} Mal`;
}

/** Gibt eine lesbare deutsche Beschreibung der Wiederholungsregel zurück. */
export function formatRecurrenceRule(rule: RecurrenceRule): string {
  const { freq, interval } = rule;
  const labels = FREQ_LABEL_DE[freq];

  let base: string;
  if (interval === 1) {
    base = FREQ_ADV_DE[freq];
  } else {
    base = `Alle ${interval} ${interval === 1 ? labels.singular : labels.plural}`;
  }

  if (freq === 'WEEKLY') {
    if (rule.byDay && rule.byDay.length > 0) {
      const days = rule.byDay.map(d => WEEKDAY_LABEL_DE[d]).join(', ');
      base += ` ${days}`;
    }
  } else if (freq === 'MONTHLY' && rule.byMonthPos) {
    const { ordinal, day } = rule.byMonthPos;
    base += `, jeden ${ORDINAL_DE[ordinal]} ${WEEKDAY_LONG_DE[day]}`;
  }

  return base + fmtEnd(rule.end);
}

/** Gibt eine Kurzform für den Info-Badge zurück (z.B. "Wöchentlich Mo"). */
export function formatRecurrenceShort(rule: RecurrenceRule): string {
  const { freq, interval } = rule;
  let s = interval === 1 ? FREQ_ADV_DE[freq] : `Alle ${interval} ${FREQ_LABEL_DE[freq].plural}`;
  if (freq === 'WEEKLY' && rule.byDay?.length) {
    s += ' ' + rule.byDay.map(d => WEEKDAY_LABEL_DE[d]).join('/');
  }
  return s;
}

/** Standardregel für neue Serien. */
export function defaultRecurrenceRule(): RecurrenceRule {
  return { freq: 'WEEKLY', interval: 1, end: { type: 'forever' } };
}
