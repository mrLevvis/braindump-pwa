import type { BrainDumpEntry } from '../braindump/types';

export interface TimelineDayGroup {
  readonly date: string;
  readonly entries: readonly BrainDumpEntry[];
}

export interface TimelineData {
  readonly byDate: ReadonlyMap<string, readonly BrainDumpEntry[]>;
  readonly untimed: readonly BrainDumpEntry[];
}
