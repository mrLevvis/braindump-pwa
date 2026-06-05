import type { BrainDumpEntry } from '../braindump/types';

export interface TimelineDayGroup {
  readonly date: string;
  readonly entries: readonly BrainDumpEntry[];
}

export interface TimelineData {
  readonly byDate: ReadonlyMap<string, readonly BrainDumpEntry[]>;
  /** Tasks with no date at all — always visible regardless of selected day. */
  readonly undated: readonly BrainDumpEntry[];
}
