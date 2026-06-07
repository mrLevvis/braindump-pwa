export const HOUR_HEIGHT_PX = 60; // 1 pixel per minute — keeps topMinutes === topPx
export const GRID_TOTAL_HEIGHT_PX = 24 * HOUR_HEIGHT_PX; // 1440

// Default block duration when no endTime is stored (legacy entries pre-A8 system-prompt update).
const DEFAULT_DURATION_MIN = 60;
const MIN_BLOCK_HEIGHT_MIN = 24;

function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Pure geometry: converts a time range into grid coordinates.
 * topMinutes === top offset in px (1 min = 1 px at HOUR_HEIGHT_PX = 60).
 * heightMinutes is clamped to MIN_BLOCK_HEIGHT_MIN for point appointments.
 */
export function getBlockGeometry(
  startTime: string,
  endTime?: string,
): { topMinutes: number; heightMinutes: number } {
  const topMinutes = parseHHMM(startTime);
  const maxHeight = GRID_TOTAL_HEIGHT_PX - topMinutes;
  const rawHeight = endTime != null ? parseHHMM(endTime) - topMinutes : DEFAULT_DURATION_MIN;
  // Floor applied only when the remaining window is large enough; otherwise the block
  // stays within the grid (e.g. a 23:59 start keeps height = 1, not 24).
  return {
    topMinutes,
    heightMinutes: Math.min(Math.max(Math.min(rawHeight, maxHeight), MIN_BLOCK_HEIGHT_MIN), maxHeight),
  };
}
