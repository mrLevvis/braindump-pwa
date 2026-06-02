import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { BrainDumpEntry } from '../types';
import { formatCreatedTime } from '../utils';
import { CategoryBadge, EntryDetailPanel, TagBadgeList } from './EntryDetailPanel.tsx';

const CARD_BUTTON_CLASS_NAME = [
  'w-full',
  'rounded-2xl',
  'text-left',
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-ring',
  'focus-visible:ring-offset-2',
].join(' ');

const CARD_CLASS_NAME = ['gap-3', 'rounded-2xl', 'py-4', 'transition', 'hover:border-foreground/20', 'hover:shadow-sm'].join(' ');
const CARD_HEADER_CLASS_NAME = ['flex', 'flex-row', 'items-start', 'justify-between', 'gap-2', 'px-4', 'pb-0'].join(' ');
const CARD_CONTENT_CLASS_NAME = ['space-y-2.5', 'px-4', 'pt-0'].join(' ');
const CARD_FOOTER_CLASS_NAME = ['px-4', 'pt-0', 'text-xs', 'text-muted-foreground'].join(' ');
const PAYLOAD_TIME_BLOCK_CLASS_NAME = ['flex', 'flex-wrap', 'items-center', 'gap-x-3', 'gap-y-1', 'text-sm', 'font-semibold', 'text-foreground'].join(' ');

const EntryPayloadTime = ({ date, entryTime }: Readonly<{ date?: string; entryTime?: string }>) => {
  if (!date && !entryTime) return null;

  return (
    <div className={PAYLOAD_TIME_BLOCK_CLASS_NAME}>
      {date ? <time dateTime={date}>{date}</time> : null}
      {entryTime ? <time dateTime={date ? `${date}T${entryTime}` : entryTime}>{entryTime}</time> : null}
    </div>
  );
};

export function EntryCard({ entry }: Readonly<{ entry: BrainDumpEntry }>) {
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const createdTime = formatCreatedTime(entry.created_at);
  const title = entry.title?.trim() || 'Untitled';
  const tags = entry.payload?.tags ?? [];
  const date = entry.payload?.date;
  const entryTime = entry.payload?.time;

  return (
    <>
      <button type="button" className={CARD_BUTTON_CLASS_NAME} onClick={() => setIsDetailPanelOpen(true)}>
        <Card className={CARD_CLASS_NAME} size="sm">
          <CardHeader className={CARD_HEADER_CLASS_NAME}>
            <CardTitle>{title}</CardTitle>
            <CategoryBadge category={entry.category} />
          </CardHeader>

          <CardContent className={CARD_CONTENT_CLASS_NAME}>
            <EntryPayloadTime date={date} entryTime={entryTime} />
            <TagBadgeList tags={tags} />
          </CardContent>

          <CardFooter className={CARD_FOOTER_CLASS_NAME}>
            <time dateTime={entry.created_at}>{createdTime}</time>
          </CardFooter>
        </Card>
      </button>

      <EntryDetailPanel entry={entry} open={isDetailPanelOpen} onOpenChange={setIsDetailPanelOpen} />
    </>
  );
}
