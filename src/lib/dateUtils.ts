/** Parses a YYYY-MM-DD string as a local-time Date (avoids UTC-midnight timezone shift). */
export function parseLocal(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/** Formats a Date as a YYYY-MM-DD string using local time. */
export function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns today's date as YYYY-MM-DD in local time. */
export function todayLocal(): string {
  return toIso(new Date());
}

/** Shifts a YYYY-MM-DD string by delta days (positive = forward, negative = backward). */
export function addDays(dateStr: string, delta: number): string {
  const d = parseLocal(dateStr);
  d.setDate(d.getDate() + delta);
  return toIso(d);
}

/** @deprecated Use addDays instead. */
export const shiftDate = addDays;
