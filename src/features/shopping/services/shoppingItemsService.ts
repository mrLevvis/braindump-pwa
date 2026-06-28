/**
 * src/features/shopping/services/shoppingItemsService.ts
 * Isolierte DB-Schicht für shopping_items — kein State, keine UI-Abhängigkeiten.
 * Nutzt den bestehenden Supabase-Client aus braindump/services/ApiClient (kein zweiter Client).
 */

import { supabase } from '../../braindump/services/ApiClient';
import type { ShoppingItem, ShoppingCategory, ShoppingUnit, DeleteResult, ToggleResult, UpdatePriceResult, UpdateLabelResult, UpdateNotesResult, UpdateDeadlineResult, UpdateCategoryResult, UpdateCountResult, UpdateAmountResult, UpdateUnitResult, UpdateParentResult } from '../types/ShoppingItem';

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

export async function addShoppingItem(captureId: string, label: string): Promise<ShoppingItem> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ label, is_done: false, source_dump: captureId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ShoppingItem;
}

export async function addShoppingGroup(label: string): Promise<ShoppingItem> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ label, is_done: false, source_dump: null, category: 'SONSTIGES', count: 1, unit: 'STUECK', parent_id: null })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ShoppingItem;
}

export async function addSubShoppingItem(label: string, parentId: string): Promise<ShoppingItem> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ label, is_done: false, source_dump: null, category: 'SONSTIGES', count: 1, unit: 'STUECK', parent_id: parentId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ShoppingItem;
}

export async function updateShoppingItemParent(id: string, parentId: string | null): Promise<UpdateParentResult> {
  const { error, count } = await supabase
    .from(TABLE)
    .update({ parent_id: parentId }, { count: 'exact' })
    .eq('id', id);

  if (error) return { status: 'error', message: error.message };
  if (count === 0) return { status: 'not_found' };
  return { status: 'updated', parentId };
}

export async function updateShoppingItemLabel(id: string, label: string): Promise<UpdateLabelResult> {
  const { error, count } = await supabase
    .from(TABLE)
    .update({ label }, { count: 'exact' })
    .eq('id', id);

  if (error) return { status: 'error', message: error.message };
  if (count === 0) return { status: 'not_found' };
  return { status: 'updated' };
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

export async function updateShoppingItemNotes(id: string, notes: string | null): Promise<UpdateNotesResult> {
  const { error, count } = await supabase
    .from(TABLE)
    .update({ notes: notes || null }, { count: 'exact' })
    .eq('id', id);

  if (error) return { status: 'error', message: error.message };
  if (count === 0) return { status: 'not_found' };
  return { status: 'updated' };
}

export async function updateShoppingItemDeadline(id: string, deadline: string | null): Promise<UpdateDeadlineResult> {
  const { error, count } = await supabase
    .from(TABLE)
    .update({ deadline: deadline || null }, { count: 'exact' })
    .eq('id', id);

  if (error) return { status: 'error', message: error.message };
  if (count === 0) return { status: 'not_found' };
  return { status: 'updated', deadline };
}

export async function updateShoppingItemCategory(id: string, category: ShoppingCategory): Promise<UpdateCategoryResult> {
  const { error, count } = await supabase
    .from(TABLE)
    .update({ category }, { count: 'exact' })
    .eq('id', id);

  if (error) return { status: 'error', message: error.message };
  if (count === 0) return { status: 'not_found' };
  return { status: 'updated', category };
}

export async function updateShoppingItemCount(id: string, count: number): Promise<UpdateCountResult> {
  const { error, count: rowCount } = await supabase
    .from(TABLE)
    .update({ count }, { count: 'exact' })
    .eq('id', id);

  if (error) return { status: 'error', message: error.message };
  if (rowCount === 0) return { status: 'not_found' };
  return { status: 'updated', count };
}

export async function updateShoppingItemAmount(id: string, amount: number | null): Promise<UpdateAmountResult> {
  const { error, count } = await supabase
    .from(TABLE)
    .update({ amount }, { count: 'exact' })
    .eq('id', id);

  if (error) return { status: 'error', message: error.message };
  if (count === 0) return { status: 'not_found' };
  return { status: 'updated', amount };
}

export async function updateShoppingItemUnit(id: string, unit: ShoppingUnit): Promise<UpdateUnitResult> {
  // Beim Wechsel zu STUECK muss amount auf null gesetzt werden (Invariante).
  const update: { unit: ShoppingUnit; amount?: null } = { unit };
  if (unit === 'STUECK') update.amount = null;

  const { error, count } = await supabase
    .from(TABLE)
    .update(update, { count: 'exact' })
    .eq('id', id);

  if (error) return { status: 'error', message: error.message };
  if (count === 0) return { status: 'not_found' };
  return { status: 'updated', unit };
}
