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
import { CategoryBadge, TagBadgeList } from '../../braindump/views/EntryDetailPanel';

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

const CHECKBOX_BTN = [
  'absolute left-0 top-1/2 -translate-y-1/2',
  'flex items-center justify-center h-9 w-9',
  'text-muted-foreground hover:text-foreground transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
].join(' ');

interface EntryCardProps {
  entry: BrainDumpEntry;
  onSelect: (e: BrainDumpEntry) => void;
  onToggle: (id: string, completed: boolean) => void;
}

function EntryCard({ entry, onSelect, onToggle }: Readonly<EntryCardProps>) {
  const tags = entry.payload.tags ?? [];
  const isTask = entry.category === 'TASK';

  return (
    // Outer div: contains two sibling buttons — valid HTML, no nesting
    <div className="relative">
      {/* Checkbox — only for TASKs, separate tap target on the left */}
      {isTask && (
        <button
          type="button"
          className={CHECKBOX_BTN}
          onClick={() => onToggle(entry.id, !entry.completed)}
          aria-label={entry.completed ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
          aria-pressed={entry.completed}
        >
          {entry.completed
            ? <CircleCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            : <Circle className="h-4 w-4" aria-hidden="true" />}
        </button>
      )}

      {/* Card body — opens detail panel */}
      <button
        type="button"
        className={[ENTRY_BTN, isTask ? 'pl-9' : ''].join(' ')}
        onClick={() => onSelect(entry)}
        aria-label={`Eintrag öffnen: ${entry.title ?? entry.original_text}`}
      >
        <Card size="sm" className={[ENTRY_CARD, entry.completed ? 'opacity-60' : ''].join(' ')}>
          <CardContent className="px-3">
            <p className={[ENTRY_TITLE, entry.completed ? 'line-through text-muted-foreground' : ''].join(' ')}>
              {entry.title ?? entry.original_text}
            </p>
            <div className={ENTRY_BADGES}>
              <CategoryBadge category={entry.category} />
              {tags.length > 0 && <TagBadgeList tags={tags} />}
            </div>
          </CardContent>
        </Card>
      </button>
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
  /** Dated entries for the selected day that have no startTime (off-grid). */
  datedTimeless: readonly BrainDumpEntry[];
  /** Tasks with no date at all — visible across all days. */
  undated: readonly BrainDumpEntry[];
  /** Opens the detail panel in the parent; keeps the panel outside the Sheet. */
  onSelect: (entry: BrainDumpEntry) => void;
  /** Toggles the completed flag; kept outside the Sheet for the same reason as onSelect. */
  onToggle: (id: string, completed: boolean) => void;
}

export function UntimedSection({ datedTimeless, undated, onSelect, onToggle }: Readonly<Props>) {
  const total = datedTimeless.length + undated.length;
  if (total === 0) return null;

  return (
    <Sheet>
      <SheetTrigger
        className={TRIGGER}
        aria-label={`Aufgaben ohne Uhrzeit (${total})`}
      >
        <ListTodo className="h-4 w-4" aria-hidden="true" />
        <span className={COUNT_BADGE} aria-hidden="true">{total}</span>
      </SheetTrigger>

      <SheetContent side="right">
        <div className={SHEET_BODY}>
          <SheetHeader>
            <SheetTitle>Aufgaben</SheetTitle>
          </SheetHeader>

          <div className={SCROLL_AREA}>
            <EntrySection
              label="Heute, ohne Uhrzeit"
              entries={datedTimeless}
              onSelect={onSelect}
              onToggle={onToggle}
            />
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
