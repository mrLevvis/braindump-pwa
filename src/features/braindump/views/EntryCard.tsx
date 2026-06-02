import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { BrainDumpEntry, EntryCategory } from '../types';
import { formatCreatedTime } from '../utils';

const CATEGORY_BADGE_CONFIG: Record<EntryCategory, Readonly<{ label: string; variant: 'default' | 'secondary' | 'outline'; className: string }>> = {
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

const CARD_CLASS_NAME = ['gap-3', 'rounded-2xl', 'py-4'].join(' ');
const CARD_HEADER_CLASS_NAME = ['flex', 'flex-row', 'items-start', 'justify-between', 'gap-2', 'px-4', 'pb-0'].join(' ');
const CARD_CONTENT_CLASS_NAME = ['space-y-3', 'px-4', 'pt-0'].join(' ');
const ENTRY_TEXT_CLASS_NAME = ['text-sm', 'leading-relaxed', 'text-foreground/90', 'whitespace-pre-wrap', 'break-words'].join(' ');
const TAG_LIST_CLASS_NAME = ['flex', 'flex-wrap', 'gap-1.5'].join(' ');
const TAG_BADGE_CLASS_NAME = ['text-[11px]', 'font-normal'].join(' ');
const CARD_FOOTER_CLASS_NAME = ['flex', 'items-center', 'justify-between', 'gap-3', 'px-4', 'pt-0', 'text-xs', 'text-muted-foreground'].join(' ');
const DATE_TIME_CLASS_NAME = ['inline-flex', 'items-center', 'gap-1.5'].join(' ');

const CategoryBadge = ({ category }: Readonly<{ category: EntryCategory }>) => {
  const badgeConfig = CATEGORY_BADGE_CONFIG[category];

  return (
    <Badge variant={badgeConfig.variant} className={badgeConfig.className}>
      {badgeConfig.label}
    </Badge>
  );
};

const TagBadgeList = ({ tags }: Readonly<{ tags: readonly string[] }>) => {
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

export default function EntryCard({ entry }: Readonly<{ entry: BrainDumpEntry }>) {
  const createdTime = formatCreatedTime(entry.created_at);
  const title = entry.title?.trim() || 'Untitled';
  const tags = entry.payload?.tags ?? [];
  const date = entry.payload?.date;
  const entryTime = entry.payload?.time;
  const hasDateOrTime = Boolean(date || entryTime);

  return (
    <Card className={CARD_CLASS_NAME} size="sm">
      <CardHeader className={CARD_HEADER_CLASS_NAME}>
        <CardTitle>{title}</CardTitle>
        <CategoryBadge category={entry.category} />
      </CardHeader>

      <CardContent className={CARD_CONTENT_CLASS_NAME}>
        <p className={ENTRY_TEXT_CLASS_NAME}>{entry.original_text}</p>
        <TagBadgeList tags={tags} />
      </CardContent>

      <CardFooter className={CARD_FOOTER_CLASS_NAME}>
        {hasDateOrTime ? (
          <div className={DATE_TIME_CLASS_NAME}>
            {date ? <time dateTime={date}>{date}</time> : null}
            {date && entryTime ? <span aria-hidden="true">·</span> : null}
            {entryTime ? <time dateTime={date ? `${date}T${entryTime}` : entryTime}>{entryTime}</time> : null}
          </div>
        ) : null}

        <time dateTime={entry.created_at}>{createdTime}</time>
      </CardFooter>
    </Card>
  );
}
