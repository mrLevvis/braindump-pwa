/**
 * src/features/timeline/expandRecurringSeries.ts
 * Generiert virtuelle Occurrence-Objekte für einen Serien-Master innerhalb eines Zeitfensters.
 * Reine Funktion ohne Seiteneffekte — leicht testbar.
 */

import type { BrainDumpEntry, RecurrenceRule, RecurrenceException, Weekday } from '../braindump/types';
import { parseLocal, toIso } from '../../lib/dateUtils';

// JS getDay() → Weekday-Kürzel
const JS_DOW_TO_WD: readonly Weekday[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const WD_TO_JS_DOW: Record<Weekday, number> = {
  SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
};

// Advances a Date object by n days (distinct from the ISO-string addDays in dateUtils)
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/**
 * Prüft, ob `d` eine gültige Occurrence der Regel (relativ zu `startDate`) ist.
 * Setzt voraus: d >= startDate.
 */
function matchesRule(d: Date, startDate: Date, rule: RecurrenceRule): boolean {
  const dow = d.getDay();

  switch (rule.freq) {
    case 'DAILY': {
      const diff = Math.round((d.getTime() - startDate.getTime()) / 86400000);
      return diff % rule.interval === 0;
    }
    case 'WEEKLY': {
      const diff = Math.round((d.getTime() - startDate.getTime()) / 86400000);
      const week = Math.floor(diff / 7);
      if (week % rule.interval !== 0) return false;
      if (rule.byDay && rule.byDay.length > 0) {
        return rule.byDay.some(wd => WD_TO_JS_DOW[wd] === dow);
      }
      // Kein byDay → gleicher Wochentag wie startDate
      return dow === startDate.getDay();
    }
    case 'MONTHLY': {
      const yd = d.getFullYear() - startDate.getFullYear();
      const md = yd * 12 + d.getMonth() - startDate.getMonth();
      if (md < 0 || md % rule.interval !== 0) return false;
      if (rule.byMonthPos) {
        const { ordinal, day } = rule.byMonthPos;
        if (WD_TO_JS_DOW[day] !== dow) return false;
        if (ordinal === -1) {
          // Letzter: nächste Woche = nächster Monat
          return addDays(d, 7).getMonth() !== d.getMonth();
        }
        return d.getDate() > (ordinal - 1) * 7 && d.getDate() <= ordinal * 7;
      }
      // Nach Tag des Monats
      return d.getDate() === startDate.getDate();
    }
    case 'YEARLY': {
      const yd = d.getFullYear() - startDate.getFullYear();
      if (yd < 0 || yd % rule.interval !== 0) return false;
      return d.getMonth() === startDate.getMonth() && d.getDate() === startDate.getDate();
    }
  }
}

/**
 * Expandiert einen Serien-Master in einzelne Occurrence-Objekte.
 *
 * Virtuelle Occurrences:
 * - id = `${master.id}__${date}` (nie eine echte UUID)
 * - _isVirtualOccurrence = true
 * - _occurrenceDate = YYYY-MM-DD
 * - _seriesMasterId = master.id
 *
 * Gelöschte Occurrences werden übersprungen.
 * Geänderte Occurrences werden durch den Override-Entry ersetzt.
 */
export function expandRecurringSeries(
  master: BrainDumpEntry,
  exceptions: readonly RecurrenceException[],
  overrideMap: ReadonlyMap<string, BrainDumpEntry>,
  windowStart: string,
  windowEnd: string,
): BrainDumpEntry[] {
  const rule = master.recurrence;
  if (!rule || !master.payload.date) return [];

  const startDate = parseLocal(master.payload.date);
  const ws = parseLocal(windowStart);
  const we = parseLocal(windowEnd);

  // Exception-Lookups für diesen Master
  const masterExceptions = exceptions.filter(e => e.series_entry_id === master.id);
  const deletedDates = new Set(masterExceptions.filter(e => e.type === 'deleted').map(e => e.original_date));
  const modifiedMap = new Map(
    masterExceptions
      .filter(e => e.type === 'modified')
      .map(e => [e.original_date, e])
  );

  // Iteration ab startDate (max 5 Jahre zurück, damit count korrekt gezählt wird)
  const fiveYearsAgo = addDays(ws, -1825);
  const iterFrom = startDate > fiveYearsAgo ? startDate : fiveYearsAgo;

  let current = new Date(iterFrom);
  let occurrenceCount = 0;
  const result: BrainDumpEntry[] = [];

  while (current <= we) {
    if (current >= startDate && matchesRule(current, startDate, rule)) {
      occurrenceCount++;

      const occDate = toIso(current);

      // Ende-Bedingungen
      if (rule.end.type === 'until' && occDate > rule.end.date) break;
      if (rule.end.type === 'count' && occurrenceCount > rule.end.count) break;

      // Nur innerhalb des Fensters ins Ergebnis
      if (current >= ws) {
        if (deletedDates.has(occDate)) {
          // übersprungen
        } else if (modifiedMap.has(occDate)) {
          const exc = modifiedMap.get(occDate)!;
          if (exc.override_entry_id) {
            const override = overrideMap.get(exc.override_entry_id);
            if (override) result.push(override);
          }
        } else {
          result.push({
            ...master,
            id: `${master.id}__${occDate}`,
            payload: { ...master.payload, date: occDate },
            _isVirtualOccurrence: true,
            _occurrenceDate: occDate,
            _seriesMasterId: master.id,
          });
        }
      }
    }

    current = addDays(current, 1);
  }

  return result;
}

/** Hilfsfunktion: gibt den Wochentag-Namen für einen JS-getDay()-Wert zurück. */
export function jsDownToWeekday(dow: number): Weekday {
  return JS_DOW_TO_WD[dow];
}
