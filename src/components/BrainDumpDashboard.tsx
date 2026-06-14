import { useState } from 'react';
import { CalendarDays, ListChecks, ShoppingCart, Trash2, X } from 'lucide-react';
import { useCategoryFilterStore } from '../features/braindump/store/CategoryFilterStore';
import { applyCategoryFilter } from '../features/braindump/utils/applyCategoryFilter';
import { CategoryFilterTabs } from '../features/braindump/views/CategoryFilterTabs';
import { EntryList } from '../features/braindump/views';
import { useDeleteEntries, useEntries, useErrorToast, useSuccessToast } from '../hooks';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

const DASHBOARD_ROOT_CLASS_NAME = ['flex', 'h-dvh', 'flex-col', 'bg-background'].join(' ');
const DASHBOARD_HEADER_CLASS_NAME = ['shrink-0', 'border-b', 'bg-background'].join(' ');
const DASHBOARD_HEADER_INNER_CLASS_NAME = [
  'mx-auto', 'flex', 'w-full', 'max-w-3xl',
  'items-center', 'justify-between', 'px-4', 'py-4',
].join(' ');
const DASHBOARD_TITLE_CLASS_NAME = ['text-2xl', 'font-semibold', 'tracking-tight'].join(' ');
const ICON_BTN_CLASS_NAME = [
  'flex', 'items-center', 'justify-center',
  'h-8', 'w-8', 'rounded-lg',
  'text-muted-foreground', 'hover:text-foreground', 'hover:bg-muted/50',
  'transition-colors', 'shrink-0',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');
const ICON_BTN_ACTIVE_CLASS_NAME = [
  'flex', 'items-center', 'justify-center',
  'h-8', 'w-8', 'rounded-lg',
  'text-foreground', 'bg-muted/50',
  'transition-colors', 'shrink-0',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');
const DASHBOARD_MAIN_CLASS_NAME = ['flex-1', 'overflow-y-auto'].join(' ');
const DASHBOARD_MAIN_INNER_CLASS_NAME = ['mx-auto', 'w-full', 'max-w-3xl', 'px-4', 'py-4', 'pb-36'].join(' ');
const BULK_DELETE_BAR_CLASS_NAME = [
  'fixed', 'inset-x-0', 'bottom-0', 'z-30', 'border-t', 'bg-background',
].join(' ');
const BULK_DELETE_BAR_INNER_CLASS_NAME = [
  'mx-auto', 'flex', 'w-full', 'max-w-3xl',
  'items-center', 'justify-between', 'px-4', 'py-3',
].join(' ');
const SELECTION_COUNT_CLASS_NAME = ['text-sm', 'text-muted-foreground'].join(' ');
const SELECTION_ACTIONS_CLASS_NAME = ['flex', 'items-center', 'gap-2'].join(' ');
const CANCEL_BTN_CLASS_NAME = [
  'flex', 'items-center', 'gap-1',
  'rounded-md', 'px-2.5', 'py-1', 'text-sm',
  'text-muted-foreground', 'hover:text-foreground', 'hover:bg-muted/50',
  'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');
const DELETE_BTN_CLASS_NAME = [
  'flex', 'items-center', 'gap-1',
  'rounded-md', 'px-2.5', 'py-1', 'text-sm', 'font-medium',
  'text-destructive', 'hover:bg-destructive/10',
  'disabled:opacity-40', 'disabled:pointer-events-none',
  'transition-colors',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');

export const BrainDumpDashboard = ({ onOpenTimeline, onOpenShopping, onSelectionModeChange }: Readonly<{ onOpenTimeline: () => void; onOpenShopping: () => void; onSelectionModeChange?: (active: boolean) => void }>) => {
    const allEntries = useEntries();
    const activeCategories = useCategoryFilterStore(s => s.activeCategories);
    const toggleCategory   = useCategoryFilterStore(s => s.toggleCategory);
    const clearFilter      = useCategoryFilterStore(s => s.clearFilter);
    const deleteEntries    = useDeleteEntries();
    const showSuccessToast = useSuccessToast();
    const showErrorToast   = useErrorToast();

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const entries = applyCategoryFilter(allEntries, activeCategories);

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const exitSelectionMode = () => {
        setIsSelectionMode(false);
        setSelectedIds(new Set());
        onSelectionModeChange?.(false);
    };

    const enterSelectionMode = () => {
        setIsSelectionMode(true);
        onSelectionModeChange?.(true);
    };

    const handleBulkDeleteConfirm = async () => {
        if (isDeleting) return;
        const count = selectedIds.size;
        setIsDeleting(true);
        try {
            await deleteEntries(Array.from(selectedIds));
            setIsDeleteDialogOpen(false);
            exitSelectionMode();
            showSuccessToast(`${count} ${count === 1 ? 'Eintrag' : 'Einträge'} gelöscht.`);
        } catch {
            showErrorToast('Löschen fehlgeschlagen.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={DASHBOARD_ROOT_CLASS_NAME}>
            <header className={DASHBOARD_HEADER_CLASS_NAME}>
                <div className={DASHBOARD_HEADER_INNER_CLASS_NAME}>
                    <h1 className={DASHBOARD_TITLE_CLASS_NAME}>BrainDump</h1>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            className={isSelectionMode ? ICON_BTN_ACTIVE_CLASS_NAME : ICON_BTN_CLASS_NAME}
                            onClick={isSelectionMode ? exitSelectionMode : enterSelectionMode}
                            aria-label={isSelectionMode ? 'Auswahlmodus verlassen' : 'Auswahlmodus aktivieren'}
                            aria-pressed={isSelectionMode}
                        >
                            <ListChecks className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            className={ICON_BTN_CLASS_NAME}
                            onClick={onOpenShopping}
                            aria-label="Einkaufsliste öffnen"
                        >
                            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            className={ICON_BTN_CLASS_NAME}
                            onClick={onOpenTimeline}
                            aria-label="Timeline öffnen"
                        >
                            <CalendarDays className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </header>

            <main className={DASHBOARD_MAIN_CLASS_NAME}>
                <div className={DASHBOARD_MAIN_INNER_CLASS_NAME}>
                    <CategoryFilterTabs
                        activeCategories={activeCategories}
                        onToggle={toggleCategory}
                        onClear={clearFilter}
                    />

                    <div className="mt-4">
                        <EntryList
                            entries={entries}
                            selectionMode={isSelectionMode
                                ? { selectedIds, onToggleSelect: handleToggleSelect }
                                : undefined}
                        />
                    </div>

                </div>
            </main>

            {isSelectionMode && (
                <div className={BULK_DELETE_BAR_CLASS_NAME}>
                    <div className={BULK_DELETE_BAR_INNER_CLASS_NAME}>
                        <span className={SELECTION_COUNT_CLASS_NAME}>
                            {selectedIds.size === 0
                                ? 'Kein Eintrag ausgewählt'
                                : `${selectedIds.size} ${selectedIds.size === 1 ? 'Eintrag' : 'Einträge'} ausgewählt`}
                        </span>
                        <div className={SELECTION_ACTIONS_CLASS_NAME}>
                            <button
                                type="button"
                                className={CANCEL_BTN_CLASS_NAME}
                                onClick={exitSelectionMode}
                            >
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                                Abbrechen
                            </button>
                            <button
                                type="button"
                                className={DELETE_BTN_CLASS_NAME}
                                disabled={selectedIds.size === 0}
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                Löschen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {selectedIds.size === 1
                                ? '1 Eintrag löschen?'
                                : `${selectedIds.size} Einträge löschen?`}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={handleBulkDeleteConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Lösche...' : 'Löschen'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
