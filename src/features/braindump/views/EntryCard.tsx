import type { BrainDumpEntry } from '../types/BrainDump';
import { EntryTags } from '../../../components/ui/EntryTags';
import { formatCreatedTime } from '../utils/formatTime';

/* -------------------------------------------------------------------------- */
/*                                   Props                                    */
/* -------------------------------------------------------------------------- */

interface EntryCardProps {
  entry: BrainDumpEntry;
}

/* -------------------------------------------------------------------------- */
/*                              Styling Tokens                                */
/* -------------------------------------------------------------------------- */

const ENTRY_CARD_CLASS = [
  'glass-content',
  'glass-content-hover',
  'mb-3',
  'rounded-[24px]',
  'p-4',
].join(' ');

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export const EntryCard = ({ entry }: Readonly<EntryCardProps>) => {
  const { created_at, original_text, payload } = entry;
  const tags = payload.tags ?? [];

  return (
    <article className={ENTRY_CARD_CLASS}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <p
          className="text-[15px] font-medium leading-snug text-white"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.45)' }}
        >
          {original_text}
        </p>
        <time
          className="ml-2 whitespace-nowrap text-xs text-white/60"
          dateTime={created_at}
        >
          {formatCreatedTime(created_at)}
        </time>
      </div>

      <EntryTags tags={tags} />
    </article>
  );
};