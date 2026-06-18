/**
 * src/features/shopping/types/ShoppingItem.ts
 * Domänen-Modell für abhakbare Einkaufs-Items aus der shopping_items-Tabelle.
 */

export interface ShoppingItem {
  id: string;
  created_at: string;
  label: string;
  is_done: boolean;
  source_dump: string | null;
  estimated_price: number | null;
}

export type ToggleResult =
  | { status: 'toggled'; isDone: boolean }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

export type DeleteResult =
  | { status: 'deleted' }
  | { status: 'not_found' }
  | { status: 'error'; message: string };
