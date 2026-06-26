import { useState } from 'react';
import { Pencil, Plus, Square, SquareCheck, Trash2 } from 'lucide-react';
import { useBrainDumpStore } from '../store';
import type { ShoppingItem } from '../../shopping/types/ShoppingItem';

function formatItemPrice(price: number): string {
  return `~${price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export function ShoppingItemsSection({ captureId, labelCls, sectionCls }: Readonly<{
  captureId: string; labelCls: string; sectionCls: string;
}>) {
  const allItems            = useBrainDumpStore(s => s.items);
  const toggleItem          = useBrainDumpStore(s => s.toggleItem);
  const updateItemPrice     = useBrainDumpStore(s => s.updateItemPrice);
  const addItemToEntry      = useBrainDumpStore(s => s.addItemToEntry);
  const updateItemLabel     = useBrainDumpStore(s => s.updateItemLabel);
  const removeItemFromEntry = useBrainDumpStore(s => s.removeItemFromEntry);

  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft]         = useState('');
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft]         = useState('');
  const [newLabel, setNewLabel]             = useState('');
  const [isAddingItem, setIsAddingItem]     = useState(false);

  const items = allItems.filter(i => i.source_dump === captureId);

  const startPriceEdit = (item: ShoppingItem) => {
    setPriceDraft(
      item.estimated_price != null
        ? item.estimated_price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : ''
    );
    setEditingPriceId(item.id);
  };

  const commitPrice = (id: string) => {
    const trimmed = priceDraft.trim();
    if (!trimmed) {
      void updateItemPrice(id, null);
    } else {
      const parsed = parseFloat(trimmed.replace(',', '.'));
      if (!Number.isNaN(parsed) && parsed >= 0) {
        void updateItemPrice(id, Math.round(parsed * 100) / 100);
      }
    }
    setEditingPriceId(null);
  };

  const startLabelEdit = (item: ShoppingItem) => {
    setLabelDraft(item.label);
    setEditingLabelId(item.id);
  };

  const commitLabel = (id: string, originalLabel: string) => {
    const trimmed = labelDraft.trim();
    if (trimmed && trimmed !== originalLabel) {
      void updateItemLabel(id, captureId, trimmed);
    }
    setEditingLabelId(null);
  };

  const handleAddItem = () => {
    const trimmed = newLabel.trim();
    setNewLabel('');
    setIsAddingItem(false);
    if (trimmed) void addItemToEntry(captureId, trimmed);
  };

  return (
    <section className="space-y-2" aria-label="Einkaufsartikel">
      <p className={labelCls}>Artikel</p>
      <ul className={sectionCls}>
        {items.map(item => (
          <li key={item.id} className="flex items-center gap-2 rounded-md px-0.5 group">
            {/* Toggle */}
            <button
              type="button"
              role="checkbox"
              aria-checked={item.is_done}
              onClick={() => void toggleItem(item.id, !item.is_done)}
              className="shrink-0 py-0.5 rounded transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              aria-label={item.is_done ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
            >
              {item.is_done
                ? <SquareCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                : <Square className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />}
            </button>

            {/* Label */}
            {editingLabelId === item.id ? (
              <input
                type="text"
                autoFocus
                value={labelDraft}
                onChange={e => setLabelDraft(e.target.value)}
                onBlur={() => commitLabel(item.id, item.label)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); commitLabel(item.id, item.label); }
                  else if (e.key === 'Escape') setEditingLabelId(null);
                }}
                className="flex-1 min-w-0 text-sm bg-transparent border-b border-emerald-400 focus:outline-none"
                aria-label="Artikelname bearbeiten"
              />
            ) : (
              <button
                type="button"
                onClick={() => startLabelEdit(item)}
                className={`flex-1 min-w-0 text-left text-sm py-0.5 rounded transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                  item.is_done ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {item.label}
              </button>
            )}

            {/* Price */}
            {editingPriceId === item.id ? (
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                value={priceDraft}
                onChange={e => setPriceDraft(e.target.value)}
                onBlur={() => commitPrice(item.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); commitPrice(item.id); }
                  else if (e.key === 'Escape') setEditingPriceId(null);
                }}
                className="w-14 shrink-0 text-xs text-right tabular-nums bg-transparent border-b border-emerald-400 focus:outline-none"
                aria-label="Preis in Euro"
              />
            ) : item.estimated_price != null ? (
              <button
                type="button"
                onClick={() => startPriceEdit(item)}
                className="shrink-0 flex items-center gap-0.5 group/price text-xs text-muted-foreground/70 tabular-nums hover:text-foreground transition-colors rounded px-0.5"
                aria-label="Preis bearbeiten"
              >
                {formatItemPrice(item.estimated_price)}
                <Pencil className="h-2.5 w-2.5 opacity-0 group-hover/price:opacity-60 transition-opacity" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startPriceEdit(item)}
                className="shrink-0 p-0.5 rounded text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                aria-label="Preis hinzufügen"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
              </button>
            )}

            {/* Delete */}
            <button
              type="button"
              onClick={() => void removeItemFromEntry(item.id, captureId)}
              className="shrink-0 p-0.5 rounded text-muted-foreground/25 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Artikel löschen"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}

        {/* Add new item */}
        {isAddingItem ? (
          <li className="flex items-center gap-2 rounded-md px-0.5 pt-1">
            <Plus className="h-4 w-4 shrink-0 text-muted-foreground/30" aria-hidden="true" />
            <input
              type="text"
              autoFocus
              placeholder="Neuer Artikel..."
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onBlur={handleAddItem}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); }
                else if (e.key === 'Escape') { setIsAddingItem(false); setNewLabel(''); }
              }}
              className="flex-1 text-sm bg-transparent border-b border-emerald-400 focus:outline-none placeholder:text-muted-foreground/40"
              aria-label="Neuer Artikel"
            />
          </li>
        ) : (
          <li className="pt-1">
            <button
              type="button"
              onClick={() => setIsAddingItem(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors rounded px-0.5 py-0.5"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              Artikel hinzufügen
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}
