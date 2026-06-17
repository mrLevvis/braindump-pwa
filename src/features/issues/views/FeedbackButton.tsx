import { useState } from 'react';
import { MessageSquarePlusIcon } from 'lucide-react';
import { FeedbackDialog } from './FeedbackDialog';

export function FeedbackButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-20 left-4 z-40 flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Feedback senden"
            >
                <MessageSquarePlusIcon className="size-4" />
                Feedback
            </button>
            <FeedbackDialog open={open} onOpenChange={setOpen} />
        </>
    );
}
