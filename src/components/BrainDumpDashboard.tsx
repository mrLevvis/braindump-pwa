import { CalendarDays } from 'lucide-react';
import { EntryList } from '../features/braindump/views';
import { useEntries } from '../hooks/braindumpSelectors';

const DASHBOARD_ROOT_CLASS_NAME = ['flex', 'h-dvh', 'flex-col', 'bg-background'].join(' ');
const DASHBOARD_HEADER_CLASS_NAME = ['shrink-0', 'border-b', 'bg-background'].join(' ');
const DASHBOARD_HEADER_INNER_CLASS_NAME = [
  'mx-auto', 'flex', 'w-full', 'max-w-3xl',
  'items-center', 'justify-between', 'px-4', 'py-4',
].join(' ');
const DASHBOARD_TITLE_CLASS_NAME = ['text-2xl', 'font-semibold', 'tracking-tight'].join(' ');
const TIMELINE_BTN_CLASS_NAME = [
  'flex', 'items-center', 'justify-center',
  'h-8', 'w-8', 'rounded-lg',
  'text-muted-foreground', 'hover:text-foreground', 'hover:bg-muted/50',
  'transition-colors', 'shrink-0',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');
const DASHBOARD_MAIN_CLASS_NAME = ['flex-1', 'overflow-y-auto'].join(' ');
const DASHBOARD_MAIN_INNER_CLASS_NAME = ['mx-auto', 'w-full', 'max-w-3xl', 'px-4', 'py-4', 'pb-36'].join(' ');

export const BrainDumpDashboard = ({ onOpenTimeline }: Readonly<{ onOpenTimeline: () => void }>) => {
    const entries = useEntries();

    return (
        <div className={DASHBOARD_ROOT_CLASS_NAME}>
            <header className={DASHBOARD_HEADER_CLASS_NAME}>
                <div className={DASHBOARD_HEADER_INNER_CLASS_NAME}>
                    <h1 className={DASHBOARD_TITLE_CLASS_NAME}>BrainDump</h1>
                    <button
                        type="button"
                        className={TIMELINE_BTN_CLASS_NAME}
                        onClick={onOpenTimeline}
                        aria-label="Timeline öffnen"
                    >
                        <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            </header>

            <main className={DASHBOARD_MAIN_CLASS_NAME}>
                <div className={DASHBOARD_MAIN_INNER_CLASS_NAME}>
                    <EntryList entries={entries} />
                </div>
            </main>
        </div>
    );
};
