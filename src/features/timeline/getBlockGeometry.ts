export const MIN_PX_PER_HOUR     = 30;
export const MAX_PX_PER_HOUR     = 160;
export const DEFAULT_PX_PER_HOUR = 60;

const GRID_TOTAL_MINUTES  = 24 * 60; // 1440
const DEFAULT_DURATION_MIN = 60;
const MIN_BLOCK_HEIGHT_MIN = 24;

function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export interface BlockGeometry {
  readonly top: number;
  readonly height: number;
}

/**
 * Pure geometry: converts a time range into pixel coordinates for a given zoom level.
 *
 * Height is clamped to [MIN_BLOCK_HEIGHT_MIN, remaining grid space]:
 *   - floor  = min(MIN_BLOCK_HEIGHT_MIN, remaining) so late-day entries never overflow
 *   - ceiling = remaining minutes (entry stays inside the 24 h grid)
 */
export function getBlockGeometry(
  startTime: string,
  endTime: string | undefined,
  pxPerHour: number,
): BlockGeometry {
  const pxPerMin    = pxPerHour / 60;
  const topMin      = parseHHMM(startTime);
  const maxHeightMin = GRID_TOTAL_MINUTES - topMin;
  const rawHeightMin = endTime != null ? parseHHMM(endTime) - topMin : DEFAULT_DURATION_MIN;

  const floor      = Math.min(MIN_BLOCK_HEIGHT_MIN, maxHeightMin);
  const heightMin  = Math.max(Math.min(rawHeightMin, maxHeightMin), floor);

  return {
    top:    topMin     * pxPerMin,
    height: heightMin  * pxPerMin,
  };
}
