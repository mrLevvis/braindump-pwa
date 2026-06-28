import { CalendarClock, Trash2 } from 'lucide-react';
import type { ShoppingItem, ShoppingUnit } from '../types/ShoppingItem';
import { isDeadlineOverdue } from '../utils/shoppingUtils';

const UNIT_DISPLAY: Record<ShoppingUnit, string> = {
  STUECK: '×',
  G: 'g',
  KG: 'kg',
  ML: 'ml',
  L: 'l',
  CM: 'cm',
  M: 'm',
};

function formatMenge(count: number, amount: number | null, unit: ShoppingUnit): string | null {
  if (unit === 'STUECK' && count === 1) return null;
  if (unit === 'STUECK') return `${count}×`;
  const amountStr = `${amount}${UNIT_DISPLAY[unit]}`;
  if (count === 1) return amountStr;
  return `${count}× ${amountStr}`;
}

const ROW_CLS = ['flex', 'items-center', 'gap-3', 'py-2.5', 'px-1'].join(' ');

const CHECKBOX_CLS = [
  'h-4', 'w-4', 'shrink-0', 'rounded',
  'border-emerald-400', 'accent-emerald-500', 'cursor-pointer',
].join(' ');

const LABEL_BTN_CLS = [
  'flex-1', 'text-sm', 'leading-snug', 'text-left',
  'cursor-pointer', 'select-none',
  'hover:text-emerald-700', 'dark:hover:text-emerald-400', 'transition-colors',
].join(' ');

const LABEL_BTN_DONE_CLS = [LABEL_BTN_CLS, 'line-through text-muted-foreground opacity-60'].join(' ');

const PRICE_CLS = [
  'shrink-0', 'text-xs', 'text-muted-foreground', 'tabular-nums',
].join(' ');

const DELETE_BTN_CLS = [
  'shrink-0', 'rounded', 'p-1',
  'text-muted-foreground/40', 'hover:text-destructive',
  'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');

function formatDeadline(deadline: string): string {
  return new Date(deadline + 'T00:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

function formatPrice(price: number): string {
  return `~${price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

interface Props {
  item: ShoppingItem;
  onToggle: (id: string, isDone: boolean) => void;
  onDelete: (id: string) => void;
  onOpenDetail: (item: ShoppingItem) => void;
}

export function ShoppingItemRow({ item, onToggle, onDelete, onOpenDetail }: Readonly<Props>) {
  const inputId = `shopping-item-${item.id}`;
  const overdue = isDeadlineOverdue(item);

  return (
    <li className={ROW_CLS}>
      <input
        type="checkbox"
        id={inputId}
        checked={item.is_done}
        onChange={(e) => onToggle(item.id, e.target.checked)}
        className={CHECKBOX_CLS}
        aria-label={item.label}
      />
      <button
        type="button"
        onClick={() => onOpenDetail(item)}
        className={item.is_done ? LABEL_BTN_DONE_CLS : LABEL_BTN_CLS}
        aria-label={`Details: ${item.label}`}
      >
        {item.label}
      </button>
      {(() => {
        const mengeStr = formatMenge(item.count, item.amount, item.unit);
        if (!mengeStr) return null;
        return (
          <span
            className={[
              'shrink-0', 'text-xs', 'tabular-nums', 'text-muted-foreground',
              item.is_done ? 'opacity-40' : '',
            ].join(' ')}
            aria-label={`Menge: ${mengeStr}`}
          >
            {mengeStr}
          </span>
        );
      })()}
      {item.deadline && (
        <span
          className={[
            'shrink-0', 'flex', 'items-center', 'gap-0.5',
            'text-xs', 'tabular-nums', 'rounded', 'px-1', 'py-0.5',
            overdue
              ? 'text-destructive bg-destructive/10'
              : 'text-muted-foreground',
            item.is_done ? 'opacity-40' : '',
          ].join(' ')}
          aria-label={overdue ? `Überfällig: ${formatDeadline(item.deadline)}` : `Fällig: ${formatDeadline(item.deadline)}`}
        >
          <CalendarClock className="h-3 w-3 shrink-0" aria-hidden="true" />
          {formatDeadline(item.deadline)}
        </span>
      )}
      {item.estimated_price != null && (
        <span
          className={[PRICE_CLS, item.is_done ? 'opacity-40' : ''].join(' ')}
          aria-label={`Preis: ${formatPrice(item.estimated_price)}`}
        >
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
