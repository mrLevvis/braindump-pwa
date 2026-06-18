import type { ShoppingItem } from '../types/ShoppingItem';
import { fetchShoppingItems, toggleShoppingItem, deleteShoppingItem, updateShoppingItemPrice } from '../services/shoppingItemsService';
import { showErrorToast } from '../../../hooks/useErrorToast';

export interface ShoppingSlice {
  items: ShoppingItem[];
  loadItems: () => void;
  toggleItem: (id: string, isDone: boolean) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItemPrice: (id: string, price: number | null) => Promise<void>;
}

type SetSlice = (partial: Partial<ShoppingSlice>) => void;
type GetSlice = () => ShoppingSlice;

export const createShoppingSlice = (set: SetSlice, get: GetSlice): ShoppingSlice => ({
  items: [],

  loadItems: () => {
    fetchShoppingItems()
      .then((items) => set({ items }))
      .catch((e: unknown) => showErrorToast((e as Error).message));
  },

  toggleItem: async (id, isDone) => {
    set({ items: get().items.map(i => i.id === id ? { ...i, is_done: isDone } : i) });
    const result = await toggleShoppingItem(id, isDone);
    if (result.status === 'error') {
      showErrorToast(result.message);
      set({ items: get().items.map(i => i.id === id ? { ...i, is_done: !isDone } : i) });
    }
  },

  removeItem: async (id) => {
    const result = await deleteShoppingItem(id);
    if (result.status === 'error') { showErrorToast(result.message); return; }
    const items = await fetchShoppingItems().catch(() => null);
    if (items) set({ items });
  },

  updateItemPrice: async (id, price) => {
    set({ items: get().items.map(i => i.id === id ? { ...i, estimated_price: price } : i) });
    const result = await updateShoppingItemPrice(id, price);
    if (result.status === 'error') {
      showErrorToast(result.message);
      const items = await fetchShoppingItems().catch(() => null);
      if (items) set({ items });
    }
  },
});
