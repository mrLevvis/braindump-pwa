import { create } from 'zustand';

export interface DaySelectionSlice {
  selectedDate: string;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  setSelectedDate: (date: string) => void;
}

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Uses T00:00:00 to avoid UTC-midnight timezone shift (same convention as formatDay)
function shiftDate(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const useDaySelectionStore = create<DaySelectionSlice>()((set) => ({
  selectedDate: todayLocal(),
  goToPreviousDay: () => set((s) => ({ selectedDate: shiftDate(s.selectedDate, -1) })),
  goToNextDay:     () => set((s) => ({ selectedDate: shiftDate(s.selectedDate, 1) })),
  goToToday:       () => set({ selectedDate: todayLocal() }),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
