import { Circle, CircleCheck, ListTodo } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../../components/ui/sheet';
import { Card, CardContent } from '../../../components/ui/card';
import type { BrainDumpEntry } from '../../braindump/types';
import { CATEGORY_STYLES, TagBadgeList } from '../../braindump/views/EntryDetailPanel';

// ─── Class name constants ─────────────────────────────────────────────────────

const TRIGGER = [
  'relative', 'flex', 'items-center', 'justify-center',
  'h-8', 'w-8', 'rounded-lg', 'shrink-0',
  'text-muted-foreground', 'hover:text-foreground', 'hover:bg-muted/50',
  'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');

const COUNT_BADGE = [
  'absolute', '-top-1', '-right-1',
  'flex', 'h-4', 'min-w-4', 'items-center', 'justify-center',
  'rounded-full', 'bg-primary', 'px-1',
  'text-[10px]', 'font-medium', 'leading-none', 'text-primary-foreground',
].join(' ');

const SHEET_BODY = ['flex', 'flex-col', 'h-full'].join(' ');
const SCROLL_AREA = ['flex-1', 'overflow-y-auto', 'px-4', 'pb-6', 'space-y-4'].join(' ');
const SECTION_LABEL = [
  'text-[11px]', 'font-medium', 'uppercase', 'tracking-wider',
  'text-muted-foreground', 'px-1', 'pt-1', 'pb-0.5',
].join(' ');
const SECTION_LIST = ['space-y-1.5'].join(' ');

const ENTRY_BTN = [
  'w-full', 'text-left', 'rounded-xl',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');

const ENTRY_CARD = [
  'rounded-xl', 'py-2.5', 'gap-1.5',
  'transition', 'hover:border-foreground/20', 'hover:shadow-sm',
].join(' ');

const ENTRY_TITLE = ['text-sm', 'font-medium', 'leading-snug', 'mb-1.5'].join(' ');
const ENTRY_BADGES = ['flex', 'flex-wrap', 'gap-1'].join(' ');

// ─── Inner card ───────────────────────────────────────────────────────────────

const TOGGLE_BTN = [
  'absolute bottom-2.5 right-3 z-10',
  'flex items-center justify-center h-7 w-7 rounded-full',
  'bg-white dark:bg-white/10 shadow-sm',
  'hover:opacity-80 transition-opacity',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
].join(' ');

interface EntryCardProps {
  entry: BrainDumpEntry;
  onSelect: (e: BrainDumpEntry) => void;
  onToggle: (id: string, completed: boolean) => void;
}

function EntryCard({ entry, onSelect, onToggle }: Readonly<EntryCardProps>) {
  const tags = entry.payload.tags ?? [];
  const isTask = entry.category === 'TASK';
  const { tintBackground, accent } = CATEGORY_STYLES[entry.category];

  return (
    // Outer div: contains two sibling buttons — valid HTML, no nesting
    <div className="relative">
      {/* Card body — opens detail panel */}
      <button
        type="button"
        className={ENTRY_BTN}
        onClick={() => onSelect(entry)}
        aria-label={`Eintrag öffnen: ${entry.title ?? entry.original_text}`}
      >
        <Card size="sm" className={[ENTRY_CARD, tintBackground, entry.completed ? 'opacity-60' : ''].join(' ')}>
          <CardContent className={isTask ? 'pl-3 pr-10' : 'px-3'}>
            <p className={[ENTRY_TITLE, entry.completed ? 'line-through text-muted-foreground' : ''].join(' ')}>
              {entry.title ?? entry.original_text}
            </p>
            {tags.length > 0 && (
              <div className={ENTRY_BADGES}>
                <TagBadgeList tags={tags} />
              </div>
            )}
          </CardContent>
        </Card>
      </button>

      {/* Toggle — only for TASKs, bottom-right corner */}
      {isTask && (
        <button
          type="button"
          className={TOGGLE_BTN}
          onClick={() => onToggle(entry.id, !entry.completed)}
          aria-label={entry.completed ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
          aria-pressed={entry.completed}
        >
          {entry.completed
            ? <CircleCheck className="h-5 w-5 text-emerald-500" aria-hidden="true" />
            : <Circle className={['h-5 w-5', accent].join(' ')} aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

interface EntrySectionProps {
  label: string;
  entries: readonly BrainDumpEntry[];
  onSelect: (e: BrainDumpEntry) => void;
  onToggle: (id: string, completed: boolean) => void;
}

function EntrySection({ label, entries, onSelect, onToggle }: Readonly<EntrySectionProps>) {
  if (entries.length === 0) return null;
  return (
    <section>
      <p className={SECTION_LABEL}>{label}</p>
      <div className={SECTION_LIST}>
        {entries.map(entry => (
          <EntryCard key={entry.id} entry={entry} onSelect={onSelect} onToggle={onToggle} />
        ))}
      </div>
    </section>
  );
}

// ─── UntimedSection ───────────────────────────────────────────────────────────

interface Props {
  /** Entries with no date at all — shown across all days. */
  undated: readonly BrainDumpEntry[];
  /** Opens the detail panel in the parent; keeps the panel outside the Sheet. */
  onSelect: (entry: BrainDumpEntry) => void;
  /** Toggles the completed flag; kept outside the Sheet for the same reason as onSelect. */
  onToggle: (id: string, completed: boolean) => void;
}

export function UntimedSection({ undated, onSelect, onToggle }: Readonly<Props>) {
  if (undated.length === 0) return null;

  return (
    <Sheet>
      <SheetTrigger
        className={TRIGGER}
        aria-label={`Einträge ohne Datum (${undated.length})`}
      >
        <ListTodo className="h-4 w-4" aria-hidden="true" />
        <span className={COUNT_BADGE} aria-hidden="true">{undated.length}</span>
      </SheetTrigger>

      <SheetContent side="right">
        <div className={SHEET_BODY}>
          <SheetHeader>
            <SheetTitle>Ohne Datum</SheetTitle>
          </SheetHeader>

          <div className={SCROLL_AREA}>
            <EntrySection
              label="Ohne Datum"
              entries={undated}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
