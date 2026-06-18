import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { ShoppingItem } from '../types/ShoppingItem';

const ROW_CLS = ['flex', 'items-center', 'gap-3', 'py-2.5', 'px-1'].join(' ');

const CHECKBOX_CLS = [
  'h-4', 'w-4', 'shrink-0', 'rounded',
  'border-emerald-400', 'accent-emerald-500', 'cursor-pointer',
].join(' ');

const LABEL_BASE_CLS = ['flex-1', 'text-sm', 'leading-snug', 'cursor-pointer', 'select-none'].join(' ');
const LABEL_DONE_CLS = [LABEL_BASE_CLS, 'line-through', 'text-muted-foreground', 'opacity-60'].join(' ');

const PRICE_BTN_CLS = [
  'shrink-0', 'text-xs', 'text-muted-foreground', 'tabular-nums',
  'flex', 'items-center', 'gap-0.5', 'group',
  'rounded', 'px-0.5', '-mx-0.5',
  'hover:text-foreground', 'transition-colors',
].join(' ');
const PRICE_BTN_DONE_CLS = [PRICE_BTN_CLS, 'opacity-40'].join(' ');

const ADD_PRICE_CLS = [
  'shrink-0', 'p-0.5', 'rounded',
  'text-muted-foreground/30', 'hover:text-muted-foreground',
  'transition-colors',
].join(' ');

const PRICE_INPUT_CLS = [
  'w-16', 'shrink-0', 'text-xs', 'text-right', 'tabular-nums',
  'bg-transparent', 'border-b', 'border-emerald-400',
  'focus:outline-none',
].join(' ');

const DELETE_BTN_CLS = [
  'shrink-0', 'rounded', 'p-1',
  'text-muted-foreground/40', 'hover:text-destructive',
  'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');

function formatPrice(price: number): string {
  return `~${price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

interface Props {
  item: ShoppingItem;
  onToggle: (id: string, isDone: boolean) => void;
  onDelete: (id: string) => void;
  onPriceUpdate: (id: string, price: number | null) => void;
}

export function ShoppingItemRow({ item, onToggle, onDelete, onPriceUpdate }: Readonly<Props>) {
  const inputId = `shopping-item-${item.id}`;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const startEditing = () => {
    setDraft(
      item.estimated_price != null
        ? item.estimated_price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : ''
    );
    setEditing(true);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      onPriceUpdate(item.id, null);
    } else {
      const parsed = parseFloat(trimmed.replace(',', '.'));
      if (!Number.isNaN(parsed) && parsed >= 0) {
        onPriceUpdate(item.id, Math.round(parsed * 100) / 100);
      }
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    else if (e.key === 'Escape') { setEditing(false); }
  };

  const priceEl = editing ? (
    <input
      type="text"
      inputMode="decimal"
      autoFocus
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className={PRICE_INPUT_CLS}
      placeholder="0,00"
      aria-label="Preis in Euro"
    />
  ) : item.estimated_price != null ? (
    <button
      type="button"
      onClick={startEditing}
      className={item.is_done ? PRICE_BTN_DONE_CLS : PRICE_BTN_CLS}
      aria-label="Preis bearbeiten"
    >
      {formatPrice(item.estimated_price)}
      <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" aria-hidden="true" />
    </button>
  ) : (
    <button
      type="button"
      onClick={startEditing}
      className={ADD_PRICE_CLS}
      aria-label="Preis hinzufügen"
    >
      <Plus className="h-3 w-3" aria-hidden="true" />
    </button>
  );

  return (
    <li className={ROW_CLS}>
      <input
        type="checkbox"
        id={inputId}
        checked={item.is_done}
        onChange={(e) => onToggle(item.id, e.target.checked)}
        className={CHECKBOX_CLS}
      />
      <label htmlFor={inputId} className={item.is_done ? LABEL_DONE_CLS : LABEL_BASE_CLS}>
        {item.label}
      </label>
      {priceEl}
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        aria-label={`${item.label} entfernen`}
        className={DELETE_BTN_CLS}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </li>
  );
}
