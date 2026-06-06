import { create } from 'zustand';
import { todayLocal, shiftDate } from '../../../lib/dateUtils';
import { parseAppRoute } from '../../../lib/routing';

export interface DaySelectionSlice {
  selectedDate: string;
  /** Signals to useRouteSync whether to replaceState (step) or pushState (jump). */
  navMode: 'step' | 'jump';
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
  navMode: 'step',
  goToPreviousDay: () => set((s) => ({ selectedDate: shiftDate(s.selectedDate, -1), navMode: 'step' })),
  goToNextDay:     () => set((s) => ({ selectedDate: shiftDate(s.selectedDate, 1), navMode: 'step' })),
  goToToday:       () => set({ selectedDate: todayLocal(), navMode: 'jump' }),
  setSelectedDate: (date) => set({ selectedDate: date, navMode: 'jump' }),
}));
