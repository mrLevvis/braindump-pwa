import { Menu } from '@base-ui/react/menu';
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
  'z-[60] min-w-[9rem] overflow-hidden rounded-xl border bg-popover',
  'p-1 shadow-md text-sm text-popover-foreground outline-none',
  'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
  'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
].join(' ');

const ITEM_BASE = [
  'flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5',
  'text-sm outline-none transition-colors',
  'data-highlighted:bg-muted',
  'disabled:pointer-events-none disabled:opacity-40',
].join(' ');

interface Props {
  onDeleteClick: () => void;
}

export function DetailPanelMenu({ onDeleteClick }: Readonly<Props>) {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label="Aktionen" className={TRIGGER_CLASS}>
        <EllipsisVertical className="h-4 w-4" aria-hidden="true" />
      </Menu.Trigger>

      <Menu.Positioner side="bottom" align="start" sideOffset={4}>
        <Menu.Popup className={POPUP_CLASS}>
          <Menu.Item className={cn(ITEM_BASE, 'text-muted-foreground')} disabled>
            Bearbeiten
          </Menu.Item>
          <Menu.Item
            className={cn(
              ITEM_BASE,
              'text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive',
            )}
            onClick={onDeleteClick}
          >
            Löschen
          </Menu.Item>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Root>
  );
}
