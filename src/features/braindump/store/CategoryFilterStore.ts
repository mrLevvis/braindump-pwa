import { create } from 'zustand';
import type { EntryCategory } from '../types';

interface CategoryFilterState {
  readonly activeCategories: readonly EntryCategory[];
  toggleCategory: (category: EntryCategory) => void;
  clearFilter: () => void;
}

export const useCategoryFilterStore = create<CategoryFilterState>()((set) => ({
  activeCategories: [],
  toggleCategory: (category) =>
    set(s => ({
      activeCategories: s.activeCategories.includes(category)
        ? s.activeCategories.filter(c => c !== category)
        : [...s.activeCategories, category],
    })),
  clearFilter: () => set({ activeCategories: [] }),
}));
