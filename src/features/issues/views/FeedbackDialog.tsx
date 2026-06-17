import { useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { issuesService } from '../services/issuesService';
import type { IssueType } from '../types/Issue';

const TEXTAREA_CLASS = [
    'flex min-h-[80px] w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm',
    'placeholder:text-muted-foreground outline-none resize-none',
    'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30',
    'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ');

const TYPE_OPTIONS: { value: IssueType; label: string }[] = [
    { value: 'bug', label: 'Bug' },
    { value: 'suggestion', label: 'Vorschlag' },
];

interface FeedbackDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
    const [type, setType] = useState<IssueType>('bug');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const result = await issuesService.submitIssue(type, title, description || undefined);
        setLoading(false);
        if (result.status === 'error') {
            setError(result.message);
        } else {
            setSent(true);
        }
    };

    const handleClose = (isOpen: boolean) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            setTimeout(() => {
                setType('bug');
                setTitle('');
                setDescription('');
                setSent(false);
                setError(null);
            }, 200);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Feedback senden</DialogTitle>
                </DialogHeader>

                {sent ? (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Danke — dein Feedback wurde übermittelt.
                        </p>
                        <DialogFooter>
                            <Button onClick={() => handleClose(false)}>Schließen</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex gap-2">
                            {TYPE_OPTIONS.map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setType(value)}
                                    className={[
                                        'flex-1 rounded-2xl border px-3 py-1.5 text-sm font-medium transition-colors',
                                        type === value
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-border bg-background text-foreground hover:bg-muted',
                                    ].join(' ')}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <Input
                            placeholder="Titel"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            autoFocus
                        />

                        <textarea
                            className={TEXTAREA_CLASS}
                            placeholder="Beschreibung (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <DialogFooter>
                            <Button type="submit" disabled={loading || !title.trim()}>
                                {loading ? 'Wird gesendet…' : 'Senden'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
