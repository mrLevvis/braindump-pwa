import { create } from 'zustand';
import { todayLocal, shiftDate } from '../../../lib/dateUtils';
import { parseAppRoute } from '../../../hooks/useRouteSync';

export interface DaySelectionSlice {
  selectedDate: string;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  setSelectedDate: (date: string) => void;
}

// Primes the store from the URL before the first render (avoids a flash).
function parseInitialDate(): string {
  const { date } = parseAppRoute();
  return date ?? todayLocal();
}

export const useDaySelectionStore = create<DaySelectionSlice>()((set) => ({
  selectedDate: parseInitialDate(),
  goToPreviousDay: () => set((s) => ({ selectedDate: shiftDate(s.selectedDate, -1) })),
  goToNextDay:     () => set((s) => ({ selectedDate: shiftDate(s.selectedDate, 1) })),
  goToToday:       () => set({ selectedDate: todayLocal() }),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
