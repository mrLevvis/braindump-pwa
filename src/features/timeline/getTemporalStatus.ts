export type TemporalStatus = 'past' | 'today' | 'future';

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toLocalTimeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// `now` is injected so the function stays pure and testable without mocking Date
export function getTemporalStatus(
  date: string,
  startTime: string | undefined,
  now: Date,
): TemporalStatus {
  const todayStr = toLocalDateStr(now);
  if (date < todayStr) return 'past';
  if (date > todayStr) return 'future';
  if (startTime == null) return 'today';
  return startTime < toLocalTimeStr(now) ? 'past' : 'today';
}
