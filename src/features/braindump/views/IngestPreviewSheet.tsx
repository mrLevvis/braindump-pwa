import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useConfirmIngest, useDiscardIngest, usePendingPreview } from '@/hooks/braindumpSelectors';
import { useErrorToast, useSuccessToast } from '@/hooks/useErrorToast';
import { CategoryBadge } from '../categoryStyles';
import type { EntryDraft, IngestPreview } from '../types';

const LABEL_CLASS = ['text-xs', 'font-medium', 'uppercase', 'tracking-wide', 'text-muted-foreground'].join(' ');
const FIELD_BLOCK_CLASS = ['space-y-1'].join(' ');
const CARD_CLASS = ['rounded-xl', 'border', 'bg-muted/20', 'p-4', 'space-y-3'].join(' ');
const EXCERPT_CLASS = ['text-xs', 'text-muted-foreground', 'italic', 'line-clamp-2'].join(' ');
const INPUT_CLASS = 'rounded-lg h-8 text-sm';
const TIME_ROW_CLASS = ['grid', 'grid-cols-2', 'gap-2'].join(' ');

function DraftCard({
    draft,
    onChange,
}: Readonly<{
    draft: EntryDraft;
    onChange: (updated: EntryDraft) => void;
}>) {
    const set = (patch: Partial<EntryDraft>) => onChange({ ...draft, ...patch });
    const setPayload = (patch: Partial<EntryDraft['payload']>) =>
        set({ payload: { ...draft.payload, ...patch } });

    const summaryText = (draft.summary ?? []).join('\n');

    const handleSummaryChange = (value: string) => {
        const lines = value.split('\n').filter((l) => l.trim() !== '');
        set({ summary: lines.length > 0 ? lines : undefined });
    };

    return (
        <div className={CARD_CLASS}>
            <div className="flex items-center gap-2">
                <CategoryBadge category={draft.category} />
            </div>

            <div className={FIELD_BLOCK_CLASS}>
                <p className={LABEL_CLASS}>Titel</p>
                <Input
                    className={INPUT_CLASS}
                    value={draft.title ?? ''}
                    onChange={(e) => set({ title: e.target.value })}
                    placeholder="Titel…"
                />
            </div>

            <div className={FIELD_BLOCK_CLASS}>
                <p className={LABEL_CLASS}>Zusammenfassung</p>
                <textarea
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 resize-none"
                    rows={Math.max(2, (draft.summary?.length ?? 0))}
                    value={summaryText}
                    onChange={(e) => handleSummaryChange(e.target.value)}
                    placeholder="Stichpunkte (eine Zeile pro Punkt)…"
                />
            </div>

            <div className={TIME_ROW_CLASS}>
                <div className={FIELD_BLOCK_CLASS}>
                    <p className={LABEL_CLASS}>Datum</p>
                    <Input
                        className={INPUT_CLASS}
                        type="date"
                        value={draft.payload.date ?? ''}
                        onChange={(e) => setPayload({ date: e.target.value || undefined })}
                    />
                </div>
                <div className={FIELD_BLOCK_CLASS}>
                    <p className={LABEL_CLASS}>Uhrzeit</p>
                    <Input
                        className={INPUT_CLASS}
                        type="time"
                        value={draft.payload.startTime ?? ''}
                        onChange={(e) => setPayload({ startTime: e.target.value || undefined })}
                    />
                </div>
            </div>

            {draft.sourceExcerpt ? (
                <p className={EXCERPT_CLASS}>„{draft.sourceExcerpt}"</p>
            ) : null}
        </div>
    );
}

export function IngestPreviewSheet() {
    const pendingPreview = usePendingPreview();
    const confirmIngest = useConfirmIngest();
    const discardIngest = useDiscardIngest();
    const showSuccessToast = useSuccessToast();
    const showErrorToast = useErrorToast();

    const [localDrafts, setLocalDrafts] = useState<EntryDraft[] | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    const isOpen = pendingPreview !== null;

    // Sync local state when a new preview arrives (but not on every render while open).
    const activeDrafts: EntryDraft[] =
        localDrafts !== null && isOpen ? localDrafts : (pendingPreview?.drafts ?? []);

    const handleOpenChange = (open: boolean) => {
        // Only allow programmatic close via buttons — outside click is disabled via dismissible={false}.
        if (!open) return;
    };

    const handleDraftChange = (index: number, updated: EntryDraft) => {
        const next = activeDrafts.map((d, i) => (i === index ? updated : d));
        setLocalDrafts(next);
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
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetContent side="bottom" showCloseButton={false} className="max-h-[85dvh] flex flex-col p-0">
                <SheetHeader className="px-4 pt-4 pb-2 border-b shrink-0">
                    <SheetTitle>
                        Einträge prüfen
                        {activeDrafts.length > 0 ? (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                ({activeDrafts.length})
                            </span>
                        ) : null}
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {activeDrafts.map((draft, i) => (
                        <DraftCard
                            key={`${pendingPreview?.captureId ?? 'draft'}-${i}`}
                            draft={draft}
                            onChange={(updated) => handleDraftChange(i, updated)}
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
    );
}
