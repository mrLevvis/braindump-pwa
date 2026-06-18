import { Trash2 } from 'lucide-react';
import type { ShoppingItem } from '../types/ShoppingItem';

const ROW_CLS = ['flex', 'items-center', 'gap-3', 'py-2.5', 'px-1'].join(' ');

const CHECKBOX_CLS = [
  'h-4', 'w-4', 'shrink-0', 'rounded',
  'border-emerald-400', 'accent-emerald-500', 'cursor-pointer',
].join(' ');

const LABEL_BASE_CLS = ['flex-1', 'text-sm', 'leading-snug', 'cursor-pointer', 'select-none'].join(' ');
const LABEL_DONE_CLS = [LABEL_BASE_CLS, 'line-through', 'text-muted-foreground', 'opacity-60'].join(' ');

const PRICE_CLS = [
  'shrink-0', 'text-xs', 'text-muted-foreground', 'tabular-nums',
].join(' ');
const PRICE_DONE_CLS = [PRICE_CLS, 'opacity-40'].join(' ');

function formatPrice(price: number): string {
  return `~${price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

const DELETE_BTN_CLS = [
  'shrink-0', 'rounded', 'p-1',
  'text-muted-foreground/40', 'hover:text-destructive',
  'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');

interface Props {
  item: ShoppingItem;
  onToggle: (id: string, isDone: boolean) => void;
  onDelete: (id: string) => void;
}

export function ShoppingItemRow({ item, onToggle, onDelete }: Readonly<Props>) {
  const inputId = `shopping-item-${item.id}`;
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
      {item.estimated_price != null && (
        <span className={item.is_done ? PRICE_DONE_CLS : PRICE_CLS}>
          {formatPrice(item.estimated_price)}
        </span>
      )}
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
