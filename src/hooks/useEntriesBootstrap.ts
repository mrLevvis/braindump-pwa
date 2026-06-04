import { useEffect } from 'react';
import { useBrainDumpStore } from '../features/braindump/store';

export function useEntriesBootstrap(): void {
  const updateEntryList = useBrainDumpStore((s) => s.updateEntryList);
  useEffect(() => {
    updateEntryList();
  }, [updateEntryList]);
}
