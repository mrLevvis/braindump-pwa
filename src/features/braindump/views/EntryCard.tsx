import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { BrainDumpEntry } from '../types';
import { formatCreatedTime } from '../utils';
import { CategoryBadge, EntryDetailPanel, TagBadgeList } from './EntryDetailPanel.tsx';

const ENTRY_DATE_FORMATTER = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  month: '2-digit',
  day: '2-digit',
});

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
const PAYLOAD_TIME_LABEL_CLASS_NAME = ['inline-flex', 'w-fit', 'rounded-md', 'bg-primary/10', 'px-2', 'py-0.5', 'text-[11px]', 'font-medium', 'text-primary'].join(' ');

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

const EntryPayloadTime = ({ date, startTime, endTime }: Readonly<{ date?: string; startTime?: string; endTime?: string }>) => {
  if (!date && !startTime) return null;

  const formattedDate = formatEntryDate(date);
  const formattedTime = formatEntryTime(startTime, endTime);

  return (
    <div className={PAYLOAD_TIME_BLOCK_CLASS_NAME}>
      <span className={PAYLOAD_TIME_LABEL_CLASS_NAME}>Termin</span>
      {formattedDate ? <time dateTime={date}>{formattedDate}</time> : null}
      {formattedDate && formattedTime ? <span aria-hidden="true">um</span> : null}
      {formattedTime ? <time dateTime={date ? `${date}T${startTime}` : startTime}>{formattedTime}</time> : null}
    </div>
  );
};

export function EntryCard({ entry }: Readonly<{ entry: BrainDumpEntry }>) {
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const createdTime = formatCreatedTime(entry.created_at);
  const title = entry.title?.trim() || 'Untitled';
  const tags = entry.payload?.tags ?? [];
  const date = entry.payload?.date;
  const entryTime = entry.payload?.startTime;
  const entryEndTime = entry.payload?.endTime;

  return (
    <>
      <button type="button" className={CARD_BUTTON_CLASS_NAME} onClick={() => setIsDetailPanelOpen(true)}>
        <Card className={CARD_CLASS_NAME} size="sm">
          <CardHeader className={CARD_HEADER_CLASS_NAME}>
            <CardTitle>{title}</CardTitle>
            <CategoryBadge category={entry.category} />
          </CardHeader>

          <CardContent className={CARD_CONTENT_CLASS_NAME}>
            <EntryPayloadTime date={date} startTime={entryTime} endTime={entryEndTime} />
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
