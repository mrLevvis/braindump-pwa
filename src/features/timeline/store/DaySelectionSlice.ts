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

// Reads the date segment from /timeline/YYYY-MM-DD on first page load so the
// store is primed from the URL before the first render (avoids a flash).
function parseInitialDate(): string {
  const m = /^\/timeline\/(\d{4}-\d{2}-\d{2})/.exec(window.location.pathname);
  return m ? m[1] : todayLocal();
}

export const useDaySelectionStore = create<DaySelectionSlice>()((set) => ({
  selectedDate: parseInitialDate(),
  goToPreviousDay: () => set((s) => ({ selectedDate: shiftDate(s.selectedDate, -1) })),
  goToNextDay:     () => set((s) => ({ selectedDate: shiftDate(s.selectedDate, 1) })),
  goToToday:       () => set({ selectedDate: todayLocal() }),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
