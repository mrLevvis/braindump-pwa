import { useEffect } from 'react';
import { useBrainDumpStore } from '../../braindump/store';
import { ShoppingItemRow } from './ShoppingItemRow';

const SECTION_CLS = ['space-y-2'].join(' ');

const LIST_CLS = [
  'rounded-xl', 'border', 'bg-emerald-500/5',
  'divide-y', 'divide-border', 'px-3',
].join(' ');

const EMPTY_CLS = [
  'rounded-xl', 'border', 'border-dashed', 'bg-muted/20',
  'px-4', 'py-5', 'text-center', 'text-sm', 'text-muted-foreground',
].join(' ');

export function ShoppingSection() {
  const items      = useBrainDumpStore((s) => s.items);
  const loadItems  = useBrainDumpStore((s) => s.loadItems);
  const toggleItem = useBrainDumpStore((s) => s.toggleItem);
  const removeItem = useBrainDumpStore((s) => s.removeItem);

  useEffect(() => { loadItems(); }, [loadItems]);

  return (
    <section className={SECTION_CLS} aria-label="Einkaufsliste">
      {items.length === 0 ? (
        <p className={EMPTY_CLS}>
          Noch keine Artikel. Schreib einen Dump mit einer Einkaufsliste.
        </p>
      ) : (
        <ul className={LIST_CLS}>
          {items.map((item) => (
            <ShoppingItemRow
              key={item.id}
              item={item}
              onToggle={toggleItem}
              onDelete={removeItem}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
