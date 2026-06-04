import { ListTodo } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../../components/ui/sheet';
import type { BrainDumpEntry } from '../../braindump/types';

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
const LIST = ['flex-1', 'overflow-y-auto', 'px-6', 'pb-6', 'space-y-0.5'].join(' ');
const LIST_ITEM = [
  'flex', 'items-start', 'gap-3',
  'rounded-lg', 'px-3', 'py-3',
  'text-sm', 'text-foreground',
  'hover:bg-muted/40', 'transition-colors',
].join(' ');
const BULLET = ['mt-1.5', 'h-1.5', 'w-1.5', 'rounded-full', 'bg-primary/60', 'shrink-0'].join(' ');

interface Props {
  entries: readonly BrainDumpEntry[];
}

export function UntimedSection({ entries }: Readonly<Props>) {
  if (entries.length === 0) return null;

  return (
    <Sheet>
      <SheetTrigger className={TRIGGER} aria-label={`Offene Aufgaben (${entries.length})`}>
        <ListTodo className="h-4 w-4" aria-hidden="true" />
        <span className={COUNT_BADGE} aria-hidden="true">{entries.length}</span>
      </SheetTrigger>

      <SheetContent side="right">
        <div className={SHEET_BODY}>
          <SheetHeader>
            <SheetTitle>Offene Aufgaben</SheetTitle>
          </SheetHeader>
          <ul className={LIST}>
            {entries.map(entry => (
              <li key={entry.id} className={LIST_ITEM}>
                <span className={BULLET} aria-hidden="true" />
                <span className="min-w-0 break-words">{entry.title ?? entry.original_text}</span>
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
