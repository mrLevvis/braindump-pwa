import { useState } from 'react';
import { CalendarDays, Circle, CircleCheck, ChevronDown, ChevronRight, Clock, ShoppingCart } from 'lucide-react';
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
import { CATEGORY_STYLES, CategoryBadge, TagBadgeList } from '../categoryStyles';
import { DetailPanelMenu } from './DetailPanelMenu';
import { EntryEditForm } from './EntryEditForm';

// ─── Per-category panel styles ────────────────────────────────────────────────

interface PanelStyle {
  headerBg:      string;
  labelText:     string;
  sectionBg:     string;
  sectionBorder: string;
  bulletColor:   string;
  timingBg:      string;
  timingBorder:  string;
  navBtn:        string;
}

const PANEL_STYLES: Record<EntryCategory, PanelStyle> = {
  TASK: {
    headerBg:      'bg-violet-500/10 dark:bg-violet-500/15',
    labelText:     'text-violet-600 dark:text-violet-400',
    sectionBg:     'bg-violet-500/5',
    sectionBorder: 'border-violet-200 dark:border-violet-800/60',
    bulletColor:   'bg-violet-400 dark:bg-violet-500',
    timingBg:      'bg-violet-500/5',
    timingBorder:  'border-violet-200 dark:border-violet-800/60',
    navBtn:        'text-violet-700 border-violet-400/50 hover:bg-violet-500/10 dark:text-violet-400',
  },
  EVENT: {
    headerBg:      'bg-sky-500/10 dark:bg-sky-500/15',
    labelText:     'text-sky-600 dark:text-sky-400',
    sectionBg:     'bg-sky-500/5',
    sectionBorder: 'border-sky-200 dark:border-sky-800/60',
    bulletColor:   'bg-sky-400 dark:bg-sky-500',
    timingBg:      'bg-sky-500/5',
    timingBorder:  'border-sky-200 dark:border-sky-800/60',
    navBtn:        'text-sky-700 border-sky-400/50 hover:bg-sky-500/10 dark:text-sky-400',
  },
  NOTE: {
    headerBg:      'bg-amber-500/10 dark:bg-amber-500/15',
    labelText:     'text-amber-600 dark:text-amber-500',
    sectionBg:     'bg-amber-500/5',
    sectionBorder: 'border-amber-200 dark:border-amber-800/60',
    bulletColor:   'bg-amber-400 dark:bg-amber-500',
    timingBg:      'bg-amber-500/5',
    timingBorder:  'border-amber-200 dark:border-amber-800/60',
    navBtn:        '',
  },
  SHOPPING: {
    headerBg:      'bg-emerald-500/10 dark:bg-emerald-500/15',
    labelText:     'text-emerald-600 dark:text-emerald-400',
    sectionBg:     'bg-emerald-500/5',
    sectionBorder: 'border-emerald-200 dark:border-emerald-800/60',
    bulletColor:   'bg-emerald-400 dark:bg-emerald-500',
    timingBg:      'bg-emerald-500/5',
    timingBorder:  'border-emerald-200 dark:border-emerald-800/60',
    navBtn:        'text-emerald-700 border-emerald-400/50 hover:bg-emerald-500/10 dark:text-emerald-400',
  },
};

// ─── Date/time formatters ─────────────────────────────────────────────────────

const FMT_DAY      = new Intl.DateTimeFormat('de-DE', { day: 'numeric' });
const FMT_MONTH_S  = new Intl.DateTimeFormat('de-DE', { month: 'short' });
const FMT_WEEKDAY  = new Intl.DateTimeFormat('de-DE', { weekday: 'long' });
const FMT_DATE_L   = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

function parseLocalDate(iso: string): Date | null {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ─── TimingCard ───────────────────────────────────────────────────────────────

function TimingCard({ date, startTime, endTime, accentBg, borderClass, bgClass, onNavigate }: Readonly<{
  date?: string; startTime?: string; endTime?: string;
  accentBg: string; borderClass: string; bgClass: string;
  onNavigate?: () => void;
}>) {
  if (!date && !startTime) return null;

  const parsed   = date ? parseLocalDate(date) : null;
  const day      = parsed ? FMT_DAY.format(parsed) : null;
  const monthS   = parsed ? FMT_MONTH_S.format(parsed).replace('.', '') : null;
  const weekday  = parsed ? FMT_WEEKDAY.format(parsed) : null;
  const dateLong = parsed ? FMT_DATE_L.format(parsed) : null;
  const timeStr  = startTime
    ? endTime ? `${startTime} – ${endTime} Uhr` : `${startTime} Uhr`
    : null;

  return (
    <div className={`flex items-center gap-4 rounded-xl border ${borderClass} ${bgClass} p-3`}>
      {parsed && (
        <div className={[
          'shrink-0 flex flex-col items-center justify-center rounded-lg',
          'min-w-[3rem] py-2 px-1', accentBg,
        ].join(' ')}>
          <span className="text-xl font-bold text-white leading-none">{day}</span>
          <span className="text-[10px] font-semibold text-white/75 uppercase tracking-wider mt-0.5">{monthS}</span>
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        {weekday && <p className="text-sm font-semibold text-foreground">{weekday}</p>}
        {dateLong && <p className="text-xs text-muted-foreground">{dateLong}</p>}
        {timeStr && (
          <span className="inline-flex items-center gap-1 mt-1 rounded-full border bg-background/60 px-2 py-0.5 text-xs font-medium text-foreground">
            <Clock className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
            {timeStr}
          </span>
        )}
      </div>
      {onNavigate && (
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Zur Timeline"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DELETE_FEEDBACK: Record<DeleteResult['status'], string> = {
  deleted:   'Eintrag gelöscht.',
  not_found: 'Kein passender Eintrag gefunden.',
  error:     'Löschen fehlgeschlagen.',
};

const EXCERPT_HIGHLIGHT: Record<EntryCategory, string> = {
  TASK:     'bg-violet-500/25 dark:bg-violet-500/30 rounded-sm',
  EVENT:    'bg-sky-500/25 dark:bg-sky-500/30 rounded-sm',
  NOTE:     'bg-amber-500/25 dark:bg-amber-500/30 rounded-sm',
  SHOPPING: 'bg-emerald-500/25 dark:bg-emerald-500/30 rounded-sm',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function navigateTimeline(date?: string) {
  const path = date ? `/timeline/${date}` : '/timeline';
  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function OriginalText({ text, excerpt, category, borderClass, bgClass }: Readonly<{
  text: string; excerpt?: string; category: EntryCategory; borderClass: string; bgClass: string;
}>) {
  const cls = `rounded-lg border ${borderClass} ${bgClass} p-3 text-sm leading-relaxed whitespace-pre-wrap break-words`;

  if (!excerpt) return <p className={cls}>{text}</p>;
  const idx = text.indexOf(excerpt);
  if (idx === -1) return <p className={cls}>{text}</p>;

  return (
    <p className={cls}>
      {text.slice(0, idx)}
      <mark className={`not-italic ${EXCERPT_HIGHLIGHT[category]}`}>{text.slice(idx, idx + excerpt.length)}</mark>
      {text.slice(idx + excerpt.length)}
    </p>
  );
}

// ─── EntryDetailPanel ─────────────────────────────────────────────────────────

export function EntryDetailPanel({ entry, open, onOpenChange }: Readonly<{
  entry: BrainDumpEntry; open: boolean; onOpenChange: (open: boolean) => void;
}>) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isOriginalTextOpen, setIsOriginalTextOpen] = useState(false);

  const deleteEntry        = useDeleteEntry();
  const updateEntry        = useUpdateEntry();
  const toggleTaskCompleted = useToggleTaskCompleted();
  const showSuccessToast   = useSuccessToast();
  const showErrorToast     = useErrorToast();

  const s     = PANEL_STYLES[entry.category];
  const title = entry.title?.trim() || 'Untitled';
  const tags  = entry.payload?.tags ?? [];
  const date  = entry.payload?.date;

  const labelCls   = `text-xs font-medium uppercase tracking-wide ${s.labelText}`;
  const sectionCls = `space-y-1 rounded-lg border ${s.sectionBorder} ${s.sectionBg} p-3`;
  const bulletCls  = `mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${s.bulletColor}`;

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
      <DialogContent className="w-full sm:max-w-xl">

        {!isEditing && (
          <div className="absolute top-4 right-10 z-10">
            <DetailPanelMenu
              onDeleteClick={() => setIsDeleteDialogOpen(true)}
              onEditClick={() => setIsEditing(true)}
            />
          </div>
        )}

        {/* Colored header band — full-bleed via negative margins */}
        <DialogHeader className={[
          '-mx-6 -mt-6 rounded-t-4xl px-6 pt-6 pb-4',
          isEditing ? 'sr-only' : s.headerBg,
          isEditing ? '' : 'pr-14',
        ].join(' ')}>
          <DialogTitle>{title}</DialogTitle>
          {!isEditing && (
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={entry.category} />
            </div>
          )}
        </DialogHeader>

        {isEditing ? (
          <>
            <EntryEditForm
              entry={entry}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
              isSaving={isSaving}
            />
            <time dateTime={entry.created_at} className="px-6 pb-4 text-[10px] text-muted-foreground">
              erstellt am {formatCreatedDateTime(entry.created_at)} um {formatCreatedTime(entry.created_at)} Uhr
            </time>
          </>
        ) : (
          <div className="space-y-6 pb-4">

            {/* Summary */}
            {entry.summary && entry.summary.length > 0 && (
              <section className="space-y-2" aria-label="Zusammenfassung">
                <p className={labelCls}>Zusammenfassung</p>
                <ul className={sectionCls}>
                  {entry.summary.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                      <span className={bulletCls} aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Timing (TASK / EVENT) */}
            {(date || entry.payload?.startTime) && (
              <section className="space-y-2" aria-label="Eintragszeiten">
                <p className={labelCls}>Termin / Fällig</p>
                <TimingCard
                  date={date}
                  startTime={entry.payload?.startTime}
                  endTime={entry.payload?.endTime}
                  accentBg={CATEGORY_STYLES[entry.category].accentBg}
                  borderClass={s.timingBorder}
                  bgClass={s.timingBg}
                  onNavigate={(entry.category === 'TASK' || entry.category === 'EVENT')
                    ? () => navigateTimeline(date)
                    : undefined}
                />
              </section>
            )}

            {/* Shopping items */}
            {entry.category === 'SHOPPING' && (() => {
              const items = entry.payload?.items ?? [];
              if (items.length === 0) return null;
              return (
                <section className="space-y-2" aria-label="Einkaufsartikel">
                  <p className={labelCls}>Artikel</p>
                  <ul className={sectionCls}>
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                        <span className={bulletCls} aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })()}

            {/* Originaltext (collapsible) */}
            <section className="space-y-2" aria-label="Originaltext">
              <button
                type="button"
                onClick={() => setIsOriginalTextOpen(prev => !prev)}
                className="flex items-center gap-1 text-left"
                aria-expanded={isOriginalTextOpen ? 'true' : 'false'}
              >
                {isOriginalTextOpen
                  ? <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  : <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />}
                <span className={labelCls}>Originaltext</span>
              </button>
              {isOriginalTextOpen && (
                <OriginalText
                  text={entry.original_text}
                  excerpt={entry.sourceExcerpt}
                  category={entry.category}
                  borderClass={s.sectionBorder}
                  bgClass={s.sectionBg}
                />
              )}
            </section>

            {/* Tags */}
            {tags.length > 0 && (
              <section className="space-y-2" aria-label="Tags">
                <p className={labelCls}>Tags</p>
                <TagBadgeList tags={tags} />
              </section>
            )}

            {/* Action row */}
            {entry.category === 'TASK' && (
              <div className="flex items-center justify-end pt-1">
                <Button
                  type="button" variant="outline" size="icon"
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

            {entry.category === 'SHOPPING' && (
              <div className="flex items-center justify-end pt-1">
                <Button
                  type="button" variant="outline" size="sm"
                  className={`gap-1.5 ${s.navBtn}`}
                  onClick={() => {
                    window.history.pushState(null, '', '/shopping');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                >
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  Zur Einkaufsliste
                </Button>
              </div>
            )}

            <time dateTime={entry.created_at} className="block text-[10px] text-muted-foreground">
              erstellt am {formatCreatedDateTime(entry.created_at)} um {formatCreatedTime(entry.created_at)} Uhr
            </time>
          </div>
        )}
      </DialogContent>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>Diese Aktion kann nicht rückgängig gemacht werden.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? 'Lösche...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
