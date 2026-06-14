import type { ShoppingItem } from '../types/ShoppingItem';
import { fetchShoppingItems, toggleShoppingItem, deleteShoppingItem } from '../services/shoppingItemsService';
import { showErrorToast } from '../../../hooks/useErrorToast';

export interface ShoppingSlice {
  items: ShoppingItem[];
  loadItems: () => void;
  toggleItem: (id: string, isDone: boolean) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}

type SetSlice = (partial: Partial<ShoppingSlice>) => void;

export const createShoppingSlice = (set: SetSlice): ShoppingSlice => ({
  items: [],

  loadItems: () => {
    fetchShoppingItems()
      .then((items) => set({ items }))
      .catch((e: unknown) => showErrorToast((e as Error).message));
  },

  toggleItem: async (id, isDone) => {
    const result = await toggleShoppingItem(id, isDone);
    if (result.status === 'error') { showErrorToast(result.message); return; }
    const items = await fetchShoppingItems().catch(() => null);
    if (items) set({ items });
  },

  removeItem: async (id) => {
    const result = await deleteShoppingItem(id);
    if (result.status === 'error') { showErrorToast(result.message); return; }
    const items = await fetchShoppingItems().catch(() => null);
    if (items) set({ items });
  },
});
