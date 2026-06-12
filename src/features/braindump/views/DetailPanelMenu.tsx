import { useEffect, useRef, useState } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const TRIGGER_CLASS = [
  'flex items-center justify-center',
  'h-8 w-8 rounded-lg shrink-0',
  'text-muted-foreground hover:text-foreground hover:bg-muted/50',
  'transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
].join(' ');

const POPUP_CLASS = [
  'absolute top-full left-0 mt-1 z-10',
  'min-w-[9rem] overflow-hidden rounded-xl border bg-popover',
  'p-1 shadow-md text-sm text-popover-foreground outline-none',
].join(' ');

const ITEM_BASE = [
  'flex w-full cursor-pointer select-none items-center rounded-lg px-2 py-1.5',
  'text-sm outline-none transition-colors',
  'hover:bg-muted',
  'disabled:pointer-events-none disabled:opacity-40',
].join(' ');

interface Props {
  onDeleteClick: () => void;
  onEditClick: () => void;
}

export function DetailPanelMenu({ onDeleteClick, onEditClick }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) { if (e.key === 'Escape') setOpen(false); return; }
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Aktionen"
        aria-haspopup="menu"
        aria-expanded={open}
        className={TRIGGER_CLASS}
        onClick={() => setOpen(v => !v)}
      >
        <EllipsisVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div role="menu" className={POPUP_CLASS}>
          <button
            role="menuitem"
            type="button"
            className={ITEM_BASE}
            onClick={() => { setOpen(false); onEditClick(); }}
          >
            Bearbeiten
          </button>
          <button
            role="menuitem"
            type="button"
            className={cn(ITEM_BASE, 'text-destructive hover:bg-destructive/10 hover:text-destructive')}
            onClick={() => { setOpen(false); onDeleteClick(); }}
          >
            Löschen
          </button>
        </div>
      )}
    </div>
  );
}
