import { useState, useRef } from 'react';
import { ChevronRight, Trash2, Plus } from 'lucide-react';
import type { ShoppingItem } from '../types/ShoppingItem';
import { ShoppingItemRow } from './ShoppingItemRow';

const GROUP_WRAPPER_CLS = ['rounded-xl', 'border', 'bg-emerald-500/5', 'divide-y', 'divide-border', 'overflow-hidden'].join(' ');

const HEADER_CLS = ['flex', 'items-center', 'gap-2', 'px-3', 'py-2.5'].join(' ');

const CHEVRON_BTN_CLS = [
  'shrink-0', 'rounded', 'p-0.5',
  'text-muted-foreground', 'hover:text-foreground',
  'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');

const LABEL_BTN_CLS = [
  'flex-1', 'text-sm', 'font-medium', 'leading-snug', 'text-left',
  'cursor-pointer', 'select-none',
  'hover:text-emerald-700', 'dark:hover:text-emerald-400', 'transition-colors',
].join(' ');

const LABEL_BTN_DONE_CLS = [LABEL_BTN_CLS, 'line-through text-muted-foreground opacity-60'].join(' ');

const PROGRESS_CLS = [
  'shrink-0', 'text-xs', 'tabular-nums',
  'rounded-full', 'px-1.5', 'py-0.5',
  'bg-emerald-500/15', 'text-emerald-700', 'dark:text-emerald-400',
].join(' ');

const DELETE_BTN_CLS = [
  'shrink-0', 'rounded', 'p-1',
  'text-muted-foreground/40', 'hover:text-destructive',
  'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');

const SUB_LIST_CLS = ['divide-y', 'divide-border'].join(' ');

const SUB_ROW_CLS = ['pl-6'].join(' ');

const ADD_ROW_CLS = ['flex', 'items-center', 'gap-2', 'px-3', 'py-2'].join(' ');

const ADD_INPUT_CLS = [
  'flex-1', 'bg-transparent', 'text-sm', 'leading-snug',
  'border-b', 'border-transparent',
  'focus:border-emerald-400', 'focus:outline-none',
  'transition-colors', 'placeholder:text-muted-foreground/40',
].join(' ');

const ADD_BTN_CLS = [
  'shrink-0', 'rounded', 'p-1',
  'text-muted-foreground/40', 'hover:text-emerald-600',
  'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');

interface Props {
  parent: ShoppingItem;
  subItems: ShoppingItem[];
  onToggle: (id: string, isDone: boolean) => void;
  onDelete: (id: string) => void;
  onOpenDetail: (item: ShoppingItem) => void;
  onAddSubItem: (label: string, parentId: string) => void;
}

export function ShoppingGroupRow({ parent, subItems, onToggle, onDelete, onOpenDetail, onAddSubItem }: Readonly<Props>) {
  const [collapsed, setCollapsed] = useState(false);
  const [newSubLabel, setNewSubLabel] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const doneCount = subItems.filter(i => i.is_done).length;
  const total = subItems.length;

  const submitSubItem = () => {
    const label = newSubLabel.trim();
    if (!label) return;
    onAddSubItem(label, parent.id);
    setNewSubLabel('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); submitSubItem(); }
    if (e.key === 'Escape') setNewSubLabel('');
  };

  return (
    <div className={GROUP_WRAPPER_CLS}>
      {/* Ober-Item-Header */}
      <div className={HEADER_CLS}>
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          className={CHEVRON_BTN_CLS}
          aria-label={collapsed ? 'Gruppe aufklappen' : 'Gruppe zuklappen'}
        >
          <ChevronRight
            className={['h-3.5', 'w-3.5', 'transition-transform', collapsed ? '' : 'rotate-90'].join(' ')}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          onClick={() => onOpenDetail(parent)}
          className={parent.is_done ? LABEL_BTN_DONE_CLS : LABEL_BTN_CLS}
          aria-label={`Details: ${parent.label}`}
        >
          {parent.label}
        </button>

        {total > 0 && (
          <span className={PROGRESS_CLS} aria-label={`${doneCount} von ${total} erledigt`}>
            {doneCount}/{total}
          </span>
        )}

        <button
          type="button"
          onClick={() => onDelete(parent.id)}
          aria-label={`Gruppe ${parent.label} entfernen`}
          className={DELETE_BTN_CLS}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Sub-Items + Add-Row */}
      {!collapsed && (
        <>
          {subItems.length > 0 && (
            <ul className={SUB_LIST_CLS}>
              {subItems.map(sub => (
                <li key={sub.id} className={SUB_ROW_CLS}>
                  <ShoppingItemRow
                    item={sub}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onOpenDetail={onOpenDetail}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className={ADD_ROW_CLS}>
            <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={newSubLabel}
              onChange={e => setNewSubLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              className={ADD_INPUT_CLS}
              placeholder="Sub-Item hinzufügen…"
              aria-label="Neues Sub-Item"
            />
            {newSubLabel.trim() && (
              <button
                type="button"
                onClick={submitSubItem}
                className={ADD_BTN_CLS}
                aria-label="Sub-Item anlegen"
              >
                <ChevronRight className="h-3.5 w-3.5 rotate-90" aria-hidden="true" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
