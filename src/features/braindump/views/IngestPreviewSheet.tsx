import { useState } from 'react';
import { Calendar, ChevronDown, ChevronRight, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useConfirmIngest, useDiscardIngest, usePendingPreview } from '@/hooks/braindumpSelectors';
import { useErrorToast, useSuccessToast } from '@/hooks/useErrorToast';
import { CategoryBadge, TagBadgeList, CATEGORY_STYLES } from '../categoryStyles';
import { EntryEditForm } from './EntryEditForm';
import type { BrainDumpEntry, EntryCategory, EntryDraft, EntryPatch, IngestPreview } from '../types';
import { formatRecurrenceShort } from '../../timeline/recurrenceUtils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_FMT = new Intl.DateTimeFormat('de-DE', { day: 'numeric' });
const MONTH_FMT = new Intl.DateTimeFormat('de-DE', { month: 'short' });

function parseDateBlock(iso: string): { day: string; month: string } | null {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return { day: DAY_FMT.format(d), month: MONTH_FMT.format(d).replace('.', '') };
}

function fmtTime(start?: string, end?: string): string | null {
  if (!start) return null;
  return end ? `${start}–${end} Uhr` : `${start} Uhr`;
}

// ─── Original-text helpers (mirrors EntryDetailPanel.tsx) ────────────────────

const ORIGINAL_TEXT_CLS = [
  'rounded-lg', 'border', 'bg-muted/30', 'p-3', 'text-sm',
  'leading-relaxed', 'whitespace-pre-wrap', 'break-words',
].join(' ');

const LABEL_CLS = 'text-xs font-medium uppercase tracking-wide text-muted-foreground';

const EXCERPT_HIGHLIGHT: Record<EntryCategory, string> = {
  TASK:     'bg-violet-500/25 dark:bg-violet-500/30 rounded-sm',
  EVENT:    'bg-sky-500/25 dark:bg-sky-500/30 rounded-sm',
  NOTE:     'bg-amber-500/25 dark:bg-amber-500/30 rounded-sm',
  SHOPPING: 'bg-emerald-500/25 dark:bg-emerald-500/30 rounded-sm',
};

function OriginalTextBlock({ text, excerpt, category }: Readonly<{ text: string; excerpt?: string; category: EntryCategory }>) {
  if (!excerpt) return <p className={ORIGINAL_TEXT_CLS}>{text}</p>;
  const idx = text.indexOf(excerpt);
  if (idx === -1) return <p className={ORIGINAL_TEXT_CLS}>{text}</p>;
  return (
    <p className={ORIGINAL_TEXT_CLS}>
      {text.slice(0, idx)}
      <mark className={`not-italic ${EXCERPT_HIGHLIGHT[category]}`}>{text.slice(idx, idx + excerpt.length)}</mark>
      {text.slice(idx + excerpt.length)}
    </p>
  );
}

function CollapsibleOriginalText({ draft }: Readonly<{ draft: EntryDraft }>) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-1 text-left"
        aria-expanded={open}
      >
        {open
          ? <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          : <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />}
        <span className={LABEL_CLS}>Originaltext</span>
      </button>
      {open && (
        <OriginalTextBlock
          text={draft.original_text}
          excerpt={draft.sourceExcerpt}
          category={draft.category}
        />
      )}
    </div>
  );
}

// ─── Shared card class constants (mirrors EntryCard.tsx) ──────────────────────

const CARD_BASE = 'gap-3 rounded-2xl py-4 transition hover:shadow-sm';
const CARD_BTN = [
  'w-full rounded-2xl text-left',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
].join(' ');
const FOOTER_CLS = 'px-4 pt-0 text-[10px] text-muted-foreground italic';

// ─── DraftPreviewCard ─────────────────────────────────────────────────────────

const DELETE_BTN_CLS = [
  'absolute top-3 right-3 z-10 rounded-md p-1',
  'text-muted-foreground hover:text-destructive hover:bg-background/80',
  'transition-colors',
].join(' ');

function DraftPreviewCard({ draft, onClick, onDelete }: Readonly<{ draft: EntryDraft; onClick: () => void; onDelete: () => void }>) {
  const title = draft.title?.trim() || 'Untitled';
  const tags = draft.payload?.tags ?? [];
  const timeStr = fmtTime(draft.payload?.startTime, draft.payload?.endTime);

  const deleteBtn = (
    <button
      type="button"
      onClick={onDelete}
      aria-label="Entwurf entfernen"
      className={DELETE_BTN_CLS}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );

  if (draft.category === 'EVENT') {
    const { tintBackground, accentBg } = CATEGORY_STYLES.EVENT;
    const dateBlock = draft.payload?.date ? parseDateBlock(draft.payload.date) : null;
    const endDateBlock = draft.payload?.endDate ? parseDateBlock(draft.payload.endDate) : null;
    const dateTile = (block: { day: string; month: string } | null) => (
      <div className={['flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 min-w-[2.75rem]', accentBg].join(' ')}>
        {block ? (
          <>
            <span className="text-base font-bold text-white leading-none">{block.day}</span>
            <span className="text-[10px] font-medium text-white/80 uppercase tracking-wide">{block.month}</span>
          </>
        ) : (
          <Calendar className="h-5 w-5 text-white" />
        )}
      </div>
    );
    return (
      <div className="relative">
        <button type="button" className={CARD_BTN} onClick={onClick}>
          <Card className={[CARD_BASE, tintBackground].join(' ')} size="sm">
            <CardContent className="flex items-start gap-3 px-4 pr-10">
              {endDateBlock ? (
                <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                  {dateTile(dateBlock)}
                  <span className="text-sm font-semibold text-foreground/50">–</span>
                  {dateTile(endDateBlock)}
                </div>
              ) : (
                <div className="shrink-0" aria-hidden="true">{dateTile(dateBlock)}</div>
              )}
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-sm font-semibold leading-snug">{title}</p>
                {!endDateBlock && timeStr && <p className="text-xs text-muted-foreground">{timeStr}</p>}
                {draft.recurrence && (
                  <span className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400">
                    <RefreshCw className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {formatRecurrenceShort(draft.recurrence)}
                  </span>
                )}
                <TagBadgeList tags={tags} />
                {draft.sourceExcerpt && (
                  <p className="text-xs text-muted-foreground italic line-clamp-2">„{draft.sourceExcerpt}"</p>
                )}
              </div>
            </CardContent>
            <CardFooter className={FOOTER_CLS}>Tippen zum Bearbeiten</CardFooter>
          </Card>
        </button>
        {deleteBtn}
      </div>
    );
  }

  const { tintBackground } = CATEGORY_STYLES[draft.category];
  return (
    <div className="relative">
      <button type="button" className={CARD_BTN} onClick={onClick}>
        <Card className={[CARD_BASE, tintBackground].join(' ')} size="sm">
          <CardContent className="space-y-1.5 px-4 pr-10">
            <CategoryBadge category={draft.category} />
            <p className="text-sm font-semibold leading-snug">{title}</p>
            {timeStr && <p className="text-xs text-muted-foreground">{timeStr}</p>}
            <TagBadgeList tags={tags} />
            {draft.sourceExcerpt && (
              <p className="text-xs text-muted-foreground italic line-clamp-2">„{draft.sourceExcerpt}"</p>
            )}
          </CardContent>
          <CardFooter className={FOOTER_CLS}>Tippen zum Bearbeiten</CardFooter>
        </Card>
      </button>
      {deleteBtn}
    </div>
  );
}

// ─── DraftEditDialog ──────────────────────────────────────────────────────────

function DraftEditDialog({
  draft,
  open,
  onOpenChange,
  onSave,
}: Readonly<{
  draft: EntryDraft;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: EntryDraft) => void;
}>) {
  const title = draft.title?.trim() || 'Entwurf bearbeiten';

  const handleSave = (patch: EntryPatch) => {
    onSave({
      ...draft,
      ...patch,
      payload: { ...draft.payload, ...patch.payload },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-xl">
        <DialogHeader className="pr-10">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <EntryEditForm
          entry={draft as unknown as BrainDumpEntry}
          onSave={handleSave}
          onCancel={() => onOpenChange(false)}
          isSaving={false}
          bottomSlot={<CollapsibleOriginalText draft={draft} />}
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── IngestPreviewSheet ───────────────────────────────────────────────────────

export function IngestPreviewSheet() {
  const pendingPreview = usePendingPreview();
  const confirmIngest = useConfirmIngest();
  const discardIngest = useDiscardIngest();
  const showSuccessToast = useSuccessToast();
  const showErrorToast = useErrorToast();

  const [localDrafts, setLocalDrafts] = useState<EntryDraft[] | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const isOpen = pendingPreview !== null;
  const activeDrafts: EntryDraft[] =
    localDrafts !== null && isOpen ? localDrafts : (pendingPreview?.drafts ?? []);

  const handleOpenChange = (open: boolean) => {
    if (!open) return;
  };

  const handleDraftSave = (index: number, updated: EntryDraft) => {
    setLocalDrafts(activeDrafts.map((d, i) => (i === index ? updated : d)));
  };

  const handleDeleteDraft = () => {
    if (deletingIndex === null || !pendingPreview) return;
    const next = activeDrafts.filter((_, i) => i !== deletingIndex);
    setDeletingIndex(null);
    if (next.length === 0) {
      discardIngest(pendingPreview.captureId);
      setLocalDrafts(null);
    } else {
      setLocalDrafts(next);
    }
  };

  const handleConfirm = async () => {
    if (!pendingPreview || isConfirming) return;
    setIsConfirming(true);
    try {
      const preview: IngestPreview = { captureId: pendingPreview.captureId, drafts: activeDrafts };
      await confirmIngest(preview);
      setLocalDrafts(null);
      showSuccessToast('Einträge gespeichert.');
    } catch {
      showErrorToast('Speichern fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDiscard = () => {
    if (!pendingPreview) return;
    discardIngest(pendingPreview.captureId);
    setLocalDrafts(null);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" showCloseButton={false} className="max-h-[85dvh] flex flex-col p-0">
          <SheetHeader className="px-4 pt-4 pb-2 border-b shrink-0">
            <SheetTitle>
              Einträge prüfen
              {activeDrafts.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({activeDrafts.length})
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {activeDrafts.map((draft, i) => (
              <DraftPreviewCard
                key={`${pendingPreview?.captureId ?? 'draft'}-${i}`}
                draft={draft}
                onClick={() => setEditingIndex(i)}
                onDelete={() => setDeletingIndex(i)}
              />
            ))}
          </div>

          <SheetFooter className="px-4 py-4 border-t shrink-0 flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleDiscard}
              disabled={isConfirming}
            >
              Verwerfen
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? 'Speichere…' : 'Speichern'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {editingIndex !== null && (
        <DraftEditDialog
          draft={activeDrafts[editingIndex]}
          open
          onOpenChange={(v) => { if (!v) setEditingIndex(null); }}
          onSave={(updated) => handleDraftSave(editingIndex, updated)}
        />
      )}

      <AlertDialog open={deletingIndex !== null} onOpenChange={(v) => { if (!v) setDeletingIndex(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Entwurf entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Eintrag wird nicht gespeichert und kann nicht wiederhergestellt werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteDraft}>
              Entfernen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
