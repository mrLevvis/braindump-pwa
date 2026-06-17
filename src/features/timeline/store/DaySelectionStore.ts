import { create } from 'zustand';
import { todayLocal } from '../../../lib/dateUtils';
import { parseAppRoute } from '../../../lib/routing';

export interface DaySelectionState {
  selectedDate: string;
  goToToday: () => void;
  setSelectedDate: (date: string) => void;
  pendingScrollEntryId: string | null;
  setPendingScrollEntryId: (id: string | null) => void;
}

// Primes the store from the URL before the first render (avoids a flash).
function parseInitialDate(): string {
  const { date } = parseAppRoute();
  return date ?? todayLocal();
}

export const useDaySelectionStore = create<DaySelectionState>()((set) => ({
  selectedDate: parseInitialDate(),
  goToToday:       () => set({ selectedDate: todayLocal() }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  pendingScrollEntryId: null,
  setPendingScrollEntryId: (id) => set({ pendingScrollEntryId: id }),
}));
