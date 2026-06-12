import { useState } from 'react';
import { Circle, CircleCheck, ChevronDown, ChevronRight } from 'lucide-react';
import type { EntryCategory } from '../types';
import { useDeleteEntry, useErrorToast, useSuccessToast, useToggleTaskCompleted, useUpdateEntry } from '@/hooks';
import { formatCreatedDateTime, formatCreatedTime } from '../utils/formatTime';
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
import { EntryEditForm } from './EntryEditForm';

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

const PANEL_CONTENT_CLASS_NAME = ['w-full', 'sm:max-w-xl'].join(' ');
const PANEL_BODY_CLASS_NAME = ['space-y-6', 'px-6', 'pb-10'].join(' ');
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
const ACTION_ROW_CLASS_NAME = ['flex', 'items-center', 'justify-end', 'pt-2'].join(' ');

const EXCERPT_HIGHLIGHT: Record<EntryCategory, string> = {
  TASK:  'bg-violet-500/25 dark:bg-violet-500/30 rounded-sm',
  EVENT: 'bg-sky-500/25 dark:bg-sky-500/30 rounded-sm',
  NOTE:  'bg-amber-500/25 dark:bg-amber-500/30 rounded-sm',
};

function OriginalText({ text, excerpt, category }: Readonly<{ text: string; excerpt?: string; category: EntryCategory }>) {
  if (!excerpt) {
    return <p className={ORIGINAL_TEXT_CLASS_NAME}>{text}</p>;
  }

  const idx = text.indexOf(excerpt);

  if (idx === -1) {
    return <p className={ORIGINAL_TEXT_CLASS_NAME}>{text}</p>;
  }

  const before = text.slice(0, idx);
  const match  = text.slice(idx, idx + excerpt.length);
  const after  = text.slice(idx + excerpt.length);

  return (
    <p className={ORIGINAL_TEXT_CLASS_NAME}>
      {before}
      <mark className={`not-italic ${EXCERPT_HIGHLIGHT[category]}`}>{match}</mark>
      {after}
    </p>
  );
}

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

const EntryTimingDetails = ({ date, entryTime, entryEndTime }: Readonly<{ date?: string; entryTime?: string; entryEndTime?: string }>) => {
  const formattedDate = formatEntryDate(date);
  const formattedTime = formatEntryTime(entryTime, entryEndTime);

  if (!date && !entryTime) return null;

  return (
    <section className={TIME_BLOCK_CLASS_NAME} aria-label="Eintragszeiten">
      <div className={TIME_ROW_CLASS_NAME}>
        <p className={TIME_LABEL_CLASS_NAME}>Termin/Faellig</p>
        <div className={TIME_VALUE_CLASS_NAME}>
          <span className={APPOINTMENT_LABEL_CLASS_NAME}>Geplanter Termin</span>
          {formattedDate ? <time dateTime={date}>{formattedDate}</time> : null}
          {formattedDate && formattedTime ? ' um ' : null}
          {formattedTime ? <time dateTime={date ? `${date}T${entryTime}` : entryTime}>{formattedTime}</time> : null}
        </div>
      </div>
    </section>
  );
};

export function EntryDetailPanel({ entry, open, onOpenChange }: Readonly<{ entry: BrainDumpEntry; open: boolean; onOpenChange: (open: boolean) => void }>) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isOriginalTextOpen, setIsOriginalTextOpen] = useState(false);
  const deleteEntry = useDeleteEntry();
  const updateEntry = useUpdateEntry();
  const toggleTaskCompleted = useToggleTaskCompleted();
  const showSuccessToast = useSuccessToast();
  const showErrorToast = useErrorToast();
  const title = entry.title?.trim() || 'Untitled';
  const tags = entry.payload?.tags ?? [];
  const date = entry.payload?.date;
  const entryTime = entry.payload?.startTime;
  const entryEndTime = entry.payload?.endTime;
  const hasTags = tags.length > 0;

  const handleSave = async (patch: Parameters<typeof updateEntry>[1]) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const result = await updateEntry(entry.id, patch);
      if (result.status === 'updated') {
        setIsEditing(false);
        showSuccessToast('Eintrag gespeichert.');
      } else {
        showErrorToast(result.status === 'error' ? result.message : 'Eintrag nicht gefunden.');
      }
    } finally {
      setIsSaving(false);
    }
  };

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
    <Dialog open={open} onOpenChange={(v) => { if (!v) setIsEditing(false); onOpenChange(v); }}>
      <DialogContent className={PANEL_CONTENT_CLASS_NAME}>
        <div className="absolute top-4 right-10 z-10">
          <DetailPanelMenu
            onDeleteClick={() => setIsDeleteDialogOpen(true)}
            onEditClick={() => setIsEditing(true)}
          />
        </div>

        <DialogHeader className="pr-14">
          <DialogTitle>{title}</DialogTitle>
          {!isEditing && (
            <div className={META_ROW_CLASS_NAME}>
              <CategoryBadge category={entry.category} />
            </div>
          )}
        </DialogHeader>

        {isEditing ? (
          <EntryEditForm
            entry={entry}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            isSaving={isSaving}
          />
        ) : (
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

            <EntryTimingDetails date={date} entryTime={entryTime} entryEndTime={entryEndTime} />

            <section className={ORIGINAL_TEXT_SECTION_CLASS_NAME} aria-label="Originaltext">
              <button
                type="button"
                onClick={() => setIsOriginalTextOpen((prev) => !prev)}
                className="flex items-center gap-1 text-left"
                aria-expanded={isOriginalTextOpen}
              >
                {isOriginalTextOpen
                  ? <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  : <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />}
                <span className={TIME_LABEL_CLASS_NAME}>Originaltext</span>
              </button>
              {isOriginalTextOpen && (
                <OriginalText text={entry.original_text} excerpt={entry.sourceExcerpt} category={entry.category} />
              )}
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
                  size="icon"
                  onClick={() => toggleTaskCompleted(entry.id, !entry.completed)}
                  aria-label={entry.completed ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
                  className={entry.completed ? 'text-emerald-500 border-emerald-500/40' : ''}
                >
                  {entry.completed
                    ? <CircleCheck className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                    : <Circle className="h-5 w-5" aria-hidden="true" />}
                </Button>
              </div>
            )}
          </div>
        )}
        <time dateTime={entry.created_at} className="absolute bottom-3 left-6 text-[10px] text-muted-foreground">
          erstellt am {formatCreatedDateTime(entry.created_at)} um {formatCreatedTime(entry.created_at)} Uhr
        </time>
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
