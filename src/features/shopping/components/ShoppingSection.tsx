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

const FOOTER_CLS = [
  'flex', 'items-center', 'justify-between',
  'rounded-xl', 'border', 'bg-emerald-500/5',
  'px-4', 'py-2.5', 'text-sm',
].join(' ');

function formatTotal(amount: number): string {
  return `~${amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export function ShoppingSection() {
  const items           = useBrainDumpStore((s) => s.items);
  const loadItems       = useBrainDumpStore((s) => s.loadItems);
  const toggleItem      = useBrainDumpStore((s) => s.toggleItem);
  const removeItem      = useBrainDumpStore((s) => s.removeItem);
  const updateItemPrice = useBrainDumpStore((s) => s.updateItemPrice);

  useEffect(() => { loadItems(); }, [loadItems]);

  const pricedItems = items.filter((i) => i.estimated_price != null);
  const totalAll = pricedItems.reduce((sum, i) => sum + (i.estimated_price ?? 0), 0);
  const totalOpen = pricedItems.filter((i) => !i.is_done).reduce((sum, i) => sum + (i.estimated_price ?? 0), 0);
  const hasTotal = pricedItems.length > 0;
  const someChecked = items.some((i) => i.is_done);

  return (
    <section className={SECTION_CLS} aria-label="Einkaufsliste">
      {items.length === 0 ? (
        <p className={EMPTY_CLS}>
          Noch keine Artikel. Schreib einen Dump mit einer Einkaufsliste.
        </p>
      ) : (
        <>
          <ul className={LIST_CLS}>
            {items.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onToggle={toggleItem}
                onDelete={removeItem}
                onPriceUpdate={updateItemPrice}
              />
            ))}
          </ul>
          {hasTotal && (
            <div className={FOOTER_CLS}>
              <span className="text-muted-foreground">Geschätzte Summe</span>
              <span className="font-medium tabular-nums">
                {someChecked
                  ? <>{formatTotal(totalOpen)} <span className="text-muted-foreground font-normal">/ {formatTotal(totalAll)}</span></>
                  : formatTotal(totalAll)
                }
              </span>
            </div>
          )}
        </>
      )}
    </section>
  );
}
