import { SHOPPING_CATEGORIES } from '../types/ShoppingItem';
import type { ShoppingItem, ShoppingCategory } from '../types/ShoppingItem';

export function isDeadlineOverdue(item: ShoppingItem): boolean {
  if (!item.deadline) return false;
  const today = new Date().toISOString().slice(0, 10);
  return item.deadline < today;
}

export function sortShoppingItemsByDeadline(items: ShoppingItem[]): ShoppingItem[] {
  return [...items].sort((a, b) => {
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });
}

export function groupByCategory(items: ShoppingItem[]): Array<{ category: ShoppingCategory; items: ShoppingItem[] }> {
  const result: Array<{ category: ShoppingCategory; items: ShoppingItem[] }> = [];
  for (const category of SHOPPING_CATEGORIES) {
    const catItems = sortShoppingItemsByDeadline(items.filter(i => i.category === category));
    if (catItems.length > 0) result.push({ category, items: catItems });
  }
  return result;
}
