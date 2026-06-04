import type { BrainDumpEntry } from '../braindump/types';

export interface TimelineDayGroup {
  readonly date: string;
  readonly entries: readonly BrainDumpEntry[];
}

export interface GroupedTimeline {
  readonly days: readonly TimelineDayGroup[];
  readonly untimed: readonly BrainDumpEntry[];
}
