import type { ShoppingItem } from '../types/ShoppingItem';

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
