import { useEffect, useState } from 'react';
import { CalendarClock, ShoppingCart, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useBrainDumpStore } from '../../braindump/store';
import type { ShoppingItem } from '../types/ShoppingItem';

const FIELD_LABEL_CLS = 'text-xs font-medium text-muted-foreground w-24 shrink-0 pt-1.5';

const INPUT_CLS = [
  'flex-1 bg-transparent text-sm leading-snug',
  'border-b border-transparent',
  'focus:border-emerald-400 focus:outline-none',
  'transition-colors placeholder:text-muted-foreground/40',
].join(' ');

const TEXTAREA_CLS = [
  INPUT_CLS,
  'resize-none min-h-[60px]',
].join(' ');

function formatPriceForInput(price: number): string {
  return price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parsePrice(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = parseFloat(trimmed.replace(',', '.'));
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

interface Props {
  item: ShoppingItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShoppingItemDetailPanel({ item, open, onOpenChange }: Readonly<Props>) {
  const entries         = useBrainDumpStore((s) => s.entries);
  const toggleItem      = useBrainDumpStore((s) => s.toggleItem);
  const removeItem      = useBrainDumpStore((s) => s.removeItem);
  const updateItemPrice = useBrainDumpStore((s) => s.updateItemPrice);
  const updateItemNotes = useBrainDumpStore((s) => s.updateItemNotes);
  const updateItemDeadline = useBrainDumpStore((s) => s.updateItemDeadline);
  const updateItemLabel = useBrainDumpStore((s) => s.updateItemLabel);
  const removeItemFromEntry = useBrainDumpStore((s) => s.removeItemFromEntry);

  const [labelDraft, setLabelDraft]     = useState('');
  const [priceDraft, setPriceDraft]     = useState('');
  const [deadlineDraft, setDeadlineDraft] = useState('');
  const [notesDraft, setNotesDraft]     = useState('');

  useEffect(() => {
    if (open && item) {
      setLabelDraft(item.label);
      setPriceDraft(item.estimated_price != null ? formatPriceForInput(item.estimated_price) : '');
      setDeadlineDraft(item.deadline ?? '');
      setNotesDraft(item.notes ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id]);

  if (!item) return null;

  const sourceEntry = item.source_dump
    ? entries.find((e) => e.captureId === item.source_dump)
    : null;

  const commitLabel = () => {
    const trimmed = labelDraft.trim();
    if (!trimmed || trimmed === item.label) return;
    void updateItemLabel(item.id, item.source_dump ?? '', trimmed);
  };

  const commitPrice = () => {
    const parsed = parsePrice(priceDraft);
    if (parsed === item.estimated_price) return;
    void updateItemPrice(item.id, parsed);
  };

  const commitDeadline = () => {
    const value = deadlineDraft || null;
    if (value === item.deadline) return;
    void updateItemDeadline(item.id, value);
  };

  const commitNotes = () => {
    const value = notesDraft.trim() || null;
    if (value === (item.notes ?? null)) return;
    void updateItemNotes(item.id, value);
  };

  const handleDelete = () => {
    onOpenChange(false);
    if (item.source_dump) {
      void removeItemFromEntry(item.id, item.source_dump);
    } else {
      void removeItem(item.id);
    }
  };

  const handleKeyDown = (commit: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); (e.target as HTMLElement).blur(); }
    if (e.key === 'Escape') { (e.target as HTMLElement).blur(); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="p-0 gap-0 overflow-hidden sm:max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 bg-emerald-500/10 dark:bg-emerald-500/15 px-5 py-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium">Shopping-Item</span>
          </div>
          <DialogClose
            render={<Button variant="ghost" size="icon-sm" className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" />}
          >
            <span className="sr-only">Schließen</span>
            ✕
          </DialogClose>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {/* Erledigt */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={item.is_done}
              onChange={(e) => void toggleItem(item.id, e.target.checked)}
              className="h-4 w-4 rounded border-emerald-400 accent-emerald-500"
            />
            <span className={['text-sm', item.is_done ? 'line-through text-muted-foreground opacity-60' : ''].join(' ')}>
              Erledigt
            </span>
          </label>

          <div className="h-px bg-border" />

          {/* Bezeichnung */}
          <div className="flex items-start gap-3">
            <span className={FIELD_LABEL_CLS}>Bezeichnung</span>
            <input
              type="text"
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={handleKeyDown(commitLabel)}
              className={INPUT_CLS}
              placeholder="Artikel"
              aria-label="Bezeichnung"
            />
          </div>

          {/* Preis */}
          <div className="flex items-start gap-3">
            <span className={FIELD_LABEL_CLS}>Preis (€)</span>
            <input
              type="text"
              inputMode="decimal"
              value={priceDraft}
              onChange={(e) => setPriceDraft(e.target.value)}
              onBlur={commitPrice}
              onKeyDown={handleKeyDown(commitPrice)}
              className={INPUT_CLS}
              placeholder="0,00"
              aria-label="Geschätzter Preis in Euro"
            />
          </div>

          {/* Deadline */}
          <div className="flex items-start gap-3">
            <span className={FIELD_LABEL_CLS}>
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3" aria-hidden="true" />
                Deadline
              </span>
            </span>
            <input
              type="date"
              value={deadlineDraft}
              onChange={(e) => setDeadlineDraft(e.target.value)}
              onBlur={commitDeadline}
              className={[INPUT_CLS, 'cursor-pointer'].join(' ')}
              aria-label="Deadline"
            />
          </div>

          {/* Notizen */}
          <div className="flex items-start gap-3">
            <span className={FIELD_LABEL_CLS}>Notizen</span>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={commitNotes}
              onKeyDown={handleKeyDown(commitNotes)}
              className={TEXTAREA_CLS}
              placeholder="Zusätzliche Infos…"
              rows={2}
              aria-label="Notizen"
            />
          </div>

          {/* Quelle */}
          {sourceEntry && (
            <div className="flex items-start gap-3">
              <span className={FIELD_LABEL_CLS}>Quelle</span>
              <span className="flex-1 text-sm text-muted-foreground truncate" title={sourceEntry.title ?? undefined}>
                {sourceEntry.title ?? 'Einkaufsliste'}
              </span>
            </div>
          )}
        </div>

        {/* Footer / Delete */}
        <div className="px-5 pb-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Artikel entfernen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
