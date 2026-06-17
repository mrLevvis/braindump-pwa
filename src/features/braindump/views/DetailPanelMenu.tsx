import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EllipsisVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const TRIGGER_CLASS = [
  'flex items-center justify-center',
  'h-8 w-8 rounded-lg shrink-0',
  'text-muted-foreground hover:text-foreground hover:bg-muted/50',
  'transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen(v => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) { if (e.key === 'Escape') setOpen(false); return; }
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !popupRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Aktionen"
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : 'false'}
        className={TRIGGER_CLASS}
        onClick={handleOpen}
      >
        <EllipsisVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && pos && createPortal(
        <div
          ref={popupRef}
          role="menu"
          // eslint-disable-next-line react/forbid-component-props
          style={{ top: pos.top, right: pos.right }}
          className="fixed z-[9999] min-w-[9rem] overflow-hidden rounded-xl border bg-popover p-1 shadow-md text-sm text-popover-foreground outline-none"
        >
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
        </div>,
        document.body,
      )}
    </>
  );
}
