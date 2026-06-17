import { useEffect, useState } from 'react';
import { ArrowLeftIcon } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { issuesService } from '../services/issuesService';
import type { Issue, IssueStatus } from '../types/Issue';

const STATUS_LABELS: Record<IssueStatus, string> = {
    open: 'Offen',
    in_progress: 'In Bearbeitung',
    done: 'Erledigt',
};

const TYPE_LABELS = {
    bug: 'Bug',
    suggestion: 'Vorschlag',
};

function StatusSelect({ issue, onChange }: { issue: Issue; onChange: (id: string, status: IssueStatus) => void }) {
    return (
        <select
            value={issue.status}
            onChange={(e) => onChange(issue.id, e.target.value as IssueStatus)}
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-ring"
        >
            {(Object.keys(STATUS_LABELS) as IssueStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
        </select>
    );
}

export function AdminView({ onBack }: { onBack: () => void }) {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        issuesService.fetchAllIssues().then((data) => {
            setIssues(data);
            setLoading(false);
        });
    }, []);

    const handleStatusChange = async (id: string, status: IssueStatus) => {
        setIssues((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
        await issuesService.updateStatus(id, status);
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-6">
            <div className="mb-6 flex items-center gap-3">
                <Button variant="ghost" size="icon-sm" onClick={onBack}>
                    <ArrowLeftIcon />
                </Button>
                <h1 className="text-lg font-semibold">Feedback & Issues</h1>
            </div>

            {loading ? (
                <p className="text-sm text-muted-foreground">Wird geladen…</p>
            ) : issues.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Einträge.</p>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Datum</th>
                                <th className="px-4 py-3 font-medium">User</th>
                                <th className="px-4 py-3 font-medium">Typ</th>
                                <th className="px-4 py-3 font-medium">Titel</th>
                                <th className="px-4 py-3 font-medium">Beschreibung</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {issues.map((issue, i) => (
                                <tr
                                    key={issue.id}
                                    className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                                >
                                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                        {new Date(issue.created_at).toLocaleDateString('de-DE', {
                                            day: '2-digit', month: '2-digit', year: '2-digit',
                                        })}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{issue.user_email}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={issue.type === 'bug' ? 'destructive' : 'secondary'}>
                                            {TYPE_LABELS[issue.type]}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 font-medium">{issue.title}</td>
                                    <td className="max-w-xs px-4 py-3 text-muted-foreground">
                                        {issue.description ?? <span className="opacity-40">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusSelect issue={issue} onChange={handleStatusChange} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
