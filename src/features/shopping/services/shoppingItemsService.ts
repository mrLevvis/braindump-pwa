/**
 * src/features/shopping/services/shoppingItemsService.ts
 * Isolierte DB-Schicht für shopping_items — kein State, keine UI-Abhängigkeiten.
 * Nutzt den bestehenden Supabase-Client aus braindump/services/ApiClient (kein zweiter Client).
 */

import { supabase } from '../../braindump/services/ApiClient';
import type { ShoppingItem, DeleteResult, ToggleResult, UpdatePriceResult } from '../types/ShoppingItem';

const TABLE = 'shopping_items';

export async function fetchShoppingItemsBySourceDump(captureId: string): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('source_dump', captureId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ShoppingItem[];
}

export async function fetchShoppingItems(): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ShoppingItem[];
}

export async function toggleShoppingItem(id: string, isDone: boolean): Promise<ToggleResult> {
  const { error, count } = await supabase
    .from(TABLE)
    .update({ is_done: isDone }, { count: 'exact' })
    .eq('id', id);

  if (error) return { status: 'error', message: error.message };
  if (count === 0) return { status: 'not_found' };
  return { status: 'toggled', isDone };
}

export async function deleteShoppingItem(id: string): Promise<DeleteResult> {
  const { error, count } = await supabase
    .from(TABLE)
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) return { status: 'error', message: error.message };
  if (count === 0) return { status: 'not_found' };
  return { status: 'deleted' };
}

export async function deleteShoppingItemsBySourceDump(captureId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('source_dump', captureId);

  if (error) throw new Error(error.message);
}

export async function updateShoppingItemPrice(id: string, price: number | null): Promise<UpdatePriceResult> {
  const { error, count } = await supabase
    .from(TABLE)
    .update({ estimated_price: price }, { count: 'exact' })
    .eq('id', id);

  if (error) return { status: 'error', message: error.message };
  if (count === 0) return { status: 'not_found' };
  return { status: 'updated', price };
}
