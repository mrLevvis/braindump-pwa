import { useState } from 'react';
import { Circle, CircleCheck } from 'lucide-react';
import { useDeleteEntry, useErrorToast, useSuccessToast, useToggleTaskCompleted } from '@/hooks';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { BrainDumpEntry, DeleteResult } from '../types';
import { CategoryBadge, TagBadgeList } from '../categoryStyles';
import { DetailPanelMenu } from './DetailPanelMenu';

const DELETE_FEEDBACK: Record<DeleteResult['status'], string> = {
  deleted: 'Eintrag gelöscht.',
  not_found: 'Kein passender Eintrag gefunden.',
  error: 'Löschen fehlgeschlagen.',
};

const ENTRY_DATE_FORMATTER = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const CREATED_AT_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const PANEL_CONTENT_CLASS_NAME = ['w-full', 'sm:max-w-xl'].join(' ');
const PANEL_BODY_CLASS_NAME = ['space-y-6', 'px-6', 'pb-6'].join(' ');
const META_ROW_CLASS_NAME = ['flex', 'flex-wrap', 'items-center', 'gap-2'].join(' ');
const ORIGINAL_TEXT_SECTION_CLASS_NAME = ['space-y-2'].join(' ');
const ORIGINAL_TEXT_CLASS_NAME = ['rounded-lg', 'border', 'bg-muted/30', 'p-3', 'text-sm', 'leading-relaxed', 'whitespace-pre-wrap', 'break-words'].join(' ');
const TIME_BLOCK_CLASS_NAME = ['space-y-3', 'rounded-lg', 'border', 'bg-muted/20', 'p-3'].join(' ');
const TIME_ROW_CLASS_NAME = ['grid', 'gap-1'].join(' ');
const TIME_LABEL_CLASS_NAME = ['text-xs', 'font-medium', 'uppercase', 'tracking-wide', 'text-muted-foreground'].join(' ');
const TIME_VALUE_CLASS_NAME = ['text-sm', 'font-medium', 'text-foreground'].join(' ');
const APPOINTMENT_LABEL_CLASS_NAME = ['inline-flex', 'w-fit', 'rounded-md', 'bg-primary/10', 'px-2', 'py-1', 'text-xs', 'font-medium', 'text-primary'].join(' ');
const SUMMARY_SECTION_CLASS_NAME = ['space-y-2'].join(' ');
const SUMMARY_LIST_CLASS_NAME = ['space-y-1', 'rounded-lg', 'border', 'bg-muted/30', 'p-3'].join(' ');
const SUMMARY_ITEM_CLASS_NAME = ['flex', 'items-start', 'gap-2', 'text-sm', 'leading-relaxed'].join(' ');
const SUMMARY_BULLET_CLASS_NAME = ['mt-1.5', 'h-1.5', 'w-1.5', 'shrink-0', 'rounded-full', 'bg-muted-foreground/60'].join(' ');
const ACTION_ROW_CLASS_NAME = ['flex', 'items-center', 'pt-2'].join(' ');

const formatCreatedDateTime = (createdAtIso: string): string => {
  const createdAt = new Date(createdAtIso);

  if (Number.isNaN(createdAt.getTime())) return '--';

  return CREATED_AT_FORMATTER.format(createdAt);
};

const formatEntryDate = (entryDateIso?: string): string | null => {
  if (!entryDateIso) return null;

  const parsedDate = new Date(`${entryDateIso}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return entryDateIso;

  return ENTRY_DATE_FORMATTER.format(parsedDate);
};

const formatEntryTime = (startTime?: string, endTime?: string): string | null => {
  if (!startTime) return null;
  return endTime ? `${startTime}–${endTime} Uhr` : `${startTime} Uhr`;
};

const EntryTimingDetails = ({ date, entryTime, entryEndTime, createdAt }: Readonly<{ date?: string; entryTime?: string; entryEndTime?: string; createdAt: string }>) => {
  const hasEntryDateOrTime = Boolean(date || entryTime);
  const formattedDate = formatEntryDate(date);
  const formattedTime = formatEntryTime(entryTime, entryEndTime);

  return (
    <section className={TIME_BLOCK_CLASS_NAME} aria-label="Eintragszeiten">
      {hasEntryDateOrTime ? (
        <div className={TIME_ROW_CLASS_NAME}>
          <p className={TIME_LABEL_CLASS_NAME}>Termin/Faellig</p>
          <div className={TIME_VALUE_CLASS_NAME}>
            <span className={APPOINTMENT_LABEL_CLASS_NAME}>Geplanter Termin</span>
            {formattedDate ? <time dateTime={date}>{formattedDate}</time> : null}
            {formattedDate && formattedTime ? ' um ' : null}
            {formattedTime ? <time dateTime={date ? `${date}T${entryTime}` : entryTime}>{formattedTime}</time> : null}
          </div>
        </div>
      ) : null}

      <div className={TIME_ROW_CLASS_NAME}>
        <p className={TIME_LABEL_CLASS_NAME}>Erstellt am</p>
        <time dateTime={createdAt} className={TIME_VALUE_CLASS_NAME}>
          {formatCreatedDateTime(createdAt)}
        </time>
      </div>
    </section>
  );
};

export function EntryDetailPanel({ entry, open, onOpenChange }: Readonly<{ entry: BrainDumpEntry; open: boolean; onOpenChange: (open: boolean) => void }>) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteEntry = useDeleteEntry();
  const toggleTaskCompleted = useToggleTaskCompleted();
  const showSuccessToast = useSuccessToast();
  const showErrorToast = useErrorToast();
  const title = entry.title?.trim() || 'Untitled';
  const tags = entry.payload?.tags ?? [];
  const date = entry.payload?.date;
  const entryTime = entry.payload?.startTime;
  const entryEndTime = entry.payload?.endTime;
  const hasTags = tags.length > 0;

  const handleDeleteConfirm = async () => {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      const result = await deleteEntry(entry.id);
      setIsDeleteDialogOpen(false);
      if (result.status === 'deleted') {
        onOpenChange(false);
        showSuccessToast(DELETE_FEEDBACK.deleted);
      } else {
        showErrorToast(result.status === 'error' ? result.message : DELETE_FEEDBACK.not_found);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={PANEL_CONTENT_CLASS_NAME}>
        <div className="absolute top-4 left-4 z-10">
          <DetailPanelMenu onDeleteClick={() => setIsDeleteDialogOpen(true)} />
        </div>

        <DialogHeader className="pl-8">
          <DialogTitle>{title}</DialogTitle>
          <div className={META_ROW_CLASS_NAME}>
            <CategoryBadge category={entry.category} />
          </div>
        </DialogHeader>

        <div className={PANEL_BODY_CLASS_NAME}>
          {entry.summary && entry.summary.length > 0 ? (
            <section className={SUMMARY_SECTION_CLASS_NAME} aria-label="Zusammenfassung">
              <p className={TIME_LABEL_CLASS_NAME}>Zusammenfassung</p>
              <ul className={SUMMARY_LIST_CLASS_NAME}>
                {entry.summary.map((point, i) => (
                  <li key={i} className={SUMMARY_ITEM_CLASS_NAME}>
                    <span className={SUMMARY_BULLET_CLASS_NAME} aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <EntryTimingDetails date={date} entryTime={entryTime} entryEndTime={entryEndTime} createdAt={entry.created_at} />

          <section className={ORIGINAL_TEXT_SECTION_CLASS_NAME} aria-label="Originaltext">
            <p className={TIME_LABEL_CLASS_NAME}>Originaltext</p>
            <p className={ORIGINAL_TEXT_CLASS_NAME}>{entry.original_text}</p>
          </section>

          {hasTags ? (
            <section className={ORIGINAL_TEXT_SECTION_CLASS_NAME} aria-label="Tags">
              <p className={TIME_LABEL_CLASS_NAME}>Tags</p>
              <TagBadgeList tags={tags} />
            </section>
          ) : null}

          {entry.category === 'TASK' && (
            <div className={ACTION_ROW_CLASS_NAME}>
              <Button
                type="button"
                variant="outline"
                onClick={() => toggleTaskCompleted(entry.id, !entry.completed)}
                className={entry.completed ? 'text-emerald-500 border-emerald-500/40' : ''}
              >
                {entry.completed
                  ? <><CircleCheck className="mr-2 h-4 w-4 text-emerald-500" aria-hidden="true" />Erledigt</>
                  : <><Circle className="mr-2 h-4 w-4" aria-hidden="true" />Abhaken</>}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag wirklich loeschen?</AlertDialogTitle>
            <AlertDialogDescription>Diese Aktion kann nicht rueckgaengig gemacht werden.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? 'Loesche...' : 'Loeschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
