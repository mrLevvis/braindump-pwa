import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { BrainDumpEntry, EntryCategory } from '../types';

const CREATED_AT_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export const CATEGORY_BADGE_CONFIG: Record<EntryCategory, Readonly<{ label: string; variant: 'default' | 'secondary' | 'outline'; className: string }>> = {
  TASK: {
    label: 'Task',
    variant: 'default',
    className: 'bg-emerald-500/90 text-white hover:bg-emerald-500/80',
  },
  EVENT: {
    label: 'Event',
    variant: 'secondary',
    className: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200',
  },
  NOTE: {
    label: 'Note',
    variant: 'outline',
    className: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
  },
};

const PANEL_CONTENT_CLASS_NAME = ['w-full', 'sm:max-w-xl'].join(' ');
const PANEL_BODY_CLASS_NAME = ['space-y-6', 'px-6', 'pb-6'].join(' ');
const META_ROW_CLASS_NAME = ['flex', 'flex-wrap', 'items-center', 'gap-2'].join(' ');
const TAG_LIST_CLASS_NAME = ['flex', 'flex-wrap', 'gap-1.5'].join(' ');
const TAG_BADGE_CLASS_NAME = ['text-[11px]', 'font-normal'].join(' ');
const ORIGINAL_TEXT_SECTION_CLASS_NAME = ['space-y-2'].join(' ');
const ORIGINAL_TEXT_CLASS_NAME = ['rounded-lg', 'border', 'bg-muted/30', 'p-3', 'text-sm', 'leading-relaxed', 'whitespace-pre-wrap', 'break-words'].join(' ');
const TIME_BLOCK_CLASS_NAME = ['space-y-3', 'rounded-lg', 'border', 'bg-muted/20', 'p-3'].join(' ');
const TIME_ROW_CLASS_NAME = ['grid', 'gap-1'].join(' ');
const TIME_LABEL_CLASS_NAME = ['text-xs', 'font-medium', 'uppercase', 'tracking-wide', 'text-muted-foreground'].join(' ');
const TIME_VALUE_CLASS_NAME = ['text-sm', 'font-medium', 'text-foreground'].join(' ');

const formatCreatedDateTime = (createdAtIso: string): string => {
  const createdAt = new Date(createdAtIso);

  if (Number.isNaN(createdAt.getTime())) return '--';

  return CREATED_AT_FORMATTER.format(createdAt);
};

export const CategoryBadge = ({ category }: Readonly<{ category: EntryCategory }>) => {
  const badgeConfig = CATEGORY_BADGE_CONFIG[category];

  return (
    <Badge variant={badgeConfig.variant} className={badgeConfig.className}>
      {badgeConfig.label}
    </Badge>
  );
};

export const TagBadgeList = ({ tags }: Readonly<{ tags: readonly string[] }>) => {
  if (tags.length === 0) return null;

  return (
    <div className={TAG_LIST_CLASS_NAME}>
      {tags.map((tag, index) => (
        <Badge key={`${tag}-${index}`} variant="outline" className={TAG_BADGE_CLASS_NAME}>
          {tag}
        </Badge>
      ))}
    </div>
  );
};

const EntryTimingDetails = ({ date, entryTime, createdAt }: Readonly<{ date?: string; entryTime?: string; createdAt: string }>) => {
  const hasEntryDateOrTime = Boolean(date || entryTime);

  return (
    <section className={TIME_BLOCK_CLASS_NAME} aria-label="Eintragszeiten">
      {hasEntryDateOrTime ? (
        <div className={TIME_ROW_CLASS_NAME}>
          <p className={TIME_LABEL_CLASS_NAME}>Termin/Faellig</p>
          <div className={TIME_VALUE_CLASS_NAME}>
            {date ? <time dateTime={date}>{date}</time> : null}
            {date && entryTime ? ' ' : null}
            {entryTime ? <time dateTime={date ? `${date}T${entryTime}` : entryTime}>{entryTime}</time> : null}
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
  const title = entry.title?.trim() || 'Untitled';
  const tags = entry.payload?.tags ?? [];
  const date = entry.payload?.date;
  const entryTime = entry.payload?.time;
  const hasTags = tags.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={PANEL_CONTENT_CLASS_NAME}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Vollstaendige Detailansicht des Eintrags</SheetDescription>
          <div className={META_ROW_CLASS_NAME}>
            <CategoryBadge category={entry.category} />
          </div>
        </SheetHeader>

        <div className={PANEL_BODY_CLASS_NAME}>
          <EntryTimingDetails date={date} entryTime={entryTime} createdAt={entry.created_at} />

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
        </div>
      </SheetContent>
    </Sheet>
  );
}
