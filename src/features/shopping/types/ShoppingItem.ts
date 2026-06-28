/**
 * src/features/shopping/types/ShoppingItem.ts
 * Domänen-Modell für abhakbare Einkaufs-Items aus der shopping_items-Tabelle.
 */

export const SHOPPING_CATEGORIES = [
  'LEBENSMITTEL',
  'HAUSHALT',
  'ELEKTRONIK',
  'KLEIDUNG',
  'HYGIENE',
  'SONSTIGES',
] as const;
export type ShoppingCategory = typeof SHOPPING_CATEGORIES[number];

export interface ShoppingItem {
  id: string;
  created_at: string;
  label: string;
  is_done: boolean;
  source_dump: string | null;
  estimated_price: number | null;
  deadline: string | null;
  notes: string | null;
  category: ShoppingCategory;
}

export type ToggleResult =
  | { status: 'toggled'; isDone: boolean }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

export type DeleteResult =
  | { status: 'deleted' }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

export type UpdatePriceResult =
  | { status: 'updated'; price: number | null }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

export type UpdateLabelResult =
  | { status: 'updated' }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

export type UpdateNotesResult =
  | { status: 'updated' }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

export type UpdateDeadlineResult =
  | { status: 'updated'; deadline: string | null }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

export type UpdateCategoryResult =
  | { status: 'updated'; category: ShoppingCategory }
  | { status: 'not_found' }
  | { status: 'error'; message: string };
