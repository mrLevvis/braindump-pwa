import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { useBrainDumpStore } from '../../braindump/store';
import { ShoppingItemRow } from './ShoppingItemRow';
import { ShoppingGroupRow } from './ShoppingGroupRow';
import { ShoppingItemDetailPanel } from './ShoppingItemDetailPanel';
import { groupByCategory, buildSubItemsMap } from '../utils/shoppingUtils';
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

const ADD_GROUP_ROW_CLS = ['flex', 'items-center', 'gap-2', 'mt-2'].join(' ');

const ADD_GROUP_INPUT_CLS = [
  'flex-1', 'rounded-xl', 'border', 'bg-emerald-500/5',
  'px-3', 'py-2', 'text-sm',
  'focus:outline-none', 'focus:ring-2', 'focus:ring-emerald-400',
  'placeholder:text-muted-foreground/40',
].join(' ');

const ADD_GROUP_BTN_CLS = [
  'shrink-0', 'flex', 'items-center', 'gap-1.5',
  'rounded-xl', 'border', 'px-3', 'py-2',
  'text-xs', 'text-muted-foreground',
  'hover:text-emerald-700', 'dark:hover:text-emerald-400',
  'hover:border-emerald-400',
  'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
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
  const addGroup        = useBrainDumpStore((s) => s.addGroup);
  const addSubItem      = useBrainDumpStore((s) => s.addSubItem);

  const [detailItem, setDetailItem]     = useState<ShoppingItem | null>(null);
  const [detailOpen, setDetailOpen]     = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [showGroupInput, setShowGroupInput] = useState(false);
  const groupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadItems(); }, [loadItems]);

  useEffect(() => {
    if (showGroupInput) groupInputRef.current?.focus();
  }, [showGroupInput]);

  const subItemsMap = buildSubItemsMap(items);
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

  const liveDetailItem = detailItem
    ? (items.find((i) => i.id === detailItem.id) ?? detailItem)
    : null;

  const submitGroup = () => {
    const label = newGroupLabel.trim();
    if (!label) { setShowGroupInput(false); return; }
    void addGroup(label);
    setNewGroupLabel('');
    setShowGroupInput(false);
  };

  const handleGroupKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); submitGroup(); }
    if (e.key === 'Escape') { setNewGroupLabel(''); setShowGroupInput(false); }
  };

  return (
    <section className={SECTION_CLS} aria-label="Einkaufsliste">
      {items.length === 0 && !showGroupInput ? (
        <p className={EMPTY_CLS}>
          Noch keine Artikel. Schreib einen Dump mit einer Einkaufsliste.
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {groups.map(({ category, items: groupItems }) => (
              <div key={category}>
                <p className={GROUP_HEADER_CLS}>{CATEGORY_LABELS[category]}</p>
                <div className="space-y-2">
                  {groupItems.map((item) => {
                    const subs = subItemsMap.get(item.id) ?? [];
                    if (subs.length > 0) {
                      return (
                        <ShoppingGroupRow
                          key={item.id}
                          parent={item}
                          subItems={subs}
                          onToggle={toggleItem}
                          onDelete={removeItem}
                          onOpenDetail={openDetail}
                          onAddSubItem={(label, parentId) => void addSubItem(label, parentId)}
                        />
                      );
                    }
                    return (
                      <ul key={item.id} className={LIST_CLS}>
                        <ShoppingItemRow
                          item={item}
                          onToggle={toggleItem}
                          onDelete={removeItem}
                          onOpenDetail={openDetail}
                        />
                      </ul>
                    );
                  })}
                </div>
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

      {/* Gruppe manuell anlegen */}
      <div className={ADD_GROUP_ROW_CLS}>
        {showGroupInput ? (
          <input
            ref={groupInputRef}
            type="text"
            value={newGroupLabel}
            onChange={e => setNewGroupLabel(e.target.value)}
            onBlur={submitGroup}
            onKeyDown={handleGroupKeyDown}
            className={ADD_GROUP_INPUT_CLS}
            placeholder="Gruppenname eingeben…"
            aria-label="Neue Gruppe"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowGroupInput(true)}
            className={ADD_GROUP_BTN_CLS}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Neue Gruppe
          </button>
        )}
      </div>

      <ShoppingItemDetailPanel
        item={liveDetailItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </section>
  );
}
