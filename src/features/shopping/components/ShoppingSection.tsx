import { useEffect, useState } from 'react';
import { useBrainDumpStore } from '../../braindump/store';
import { ShoppingItemRow } from './ShoppingItemRow';
import { ShoppingItemDetailPanel } from './ShoppingItemDetailPanel';
import { groupByCategory } from '../utils/shoppingUtils';
import type { ShoppingItem, ShoppingCategory } from '../types/ShoppingItem';

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

const GROUP_HEADER_CLS = [
  'text-xs', 'font-semibold', 'uppercase', 'tracking-wide',
  'text-muted-foreground', 'px-1', 'pb-1',
].join(' ');

const CATEGORY_LABELS: Record<ShoppingCategory, string> = {
  LEBENSMITTEL: 'Lebensmittel',
  HAUSHALT: 'Haushalt',
  ELEKTRONIK: 'Elektronik',
  KLEIDUNG: 'Kleidung',
  HYGIENE: 'Hygiene',
  SONSTIGES: 'Sonstiges',
};

function formatTotal(amount: number): string {
  return `~${amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export function ShoppingSection() {
  const items           = useBrainDumpStore((s) => s.items);
  const loadItems       = useBrainDumpStore((s) => s.loadItems);
  const toggleItem      = useBrainDumpStore((s) => s.toggleItem);
  const removeItem      = useBrainDumpStore((s) => s.removeItem);

  const [detailItem, setDetailItem]   = useState<ShoppingItem | null>(null);
  const [detailOpen, setDetailOpen]   = useState(false);

  useEffect(() => { loadItems(); }, [loadItems]);

  const groups = groupByCategory(items);
  const pricedItems = items.filter((i) => i.estimated_price != null);
  const totalAll = pricedItems.reduce((sum, i) => sum + (i.estimated_price ?? 0), 0);
  const totalOpen = pricedItems.filter((i) => !i.is_done).reduce((sum, i) => sum + (i.estimated_price ?? 0), 0);
  const hasTotal = pricedItems.length > 0;
  const someChecked = items.some((i) => i.is_done);

  const openDetail = (item: ShoppingItem) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  // keep detailItem in sync with store so panel reflects optimistic updates
  const liveDetailItem = detailItem
    ? (items.find((i) => i.id === detailItem.id) ?? detailItem)
    : null;

  return (
    <section className={SECTION_CLS} aria-label="Einkaufsliste">
      {items.length === 0 ? (
        <p className={EMPTY_CLS}>
          Noch keine Artikel. Schreib einen Dump mit einer Einkaufsliste.
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {groups.map(({ category, items: groupItems }) => (
              <div key={category}>
                <p className={GROUP_HEADER_CLS}>{CATEGORY_LABELS[category]}</p>
                <ul className={LIST_CLS}>
                  {groupItems.map((item) => (
                    <ShoppingItemRow
                      key={item.id}
                      item={item}
                      onToggle={toggleItem}
                      onDelete={removeItem}
                      onOpenDetail={openDetail}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
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

      <ShoppingItemDetailPanel
        item={liveDetailItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </section>
  );
}
