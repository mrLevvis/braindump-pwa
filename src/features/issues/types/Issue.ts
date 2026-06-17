export type IssueType = 'bug' | 'suggestion';
export type IssueStatus = 'open' | 'in_progress' | 'done';

export interface Issue {
    id: string;
    created_at: string;
    user_id: string;
    user_email: string;
    type: IssueType;
    title: string;
    description: string | null;
    status: IssueStatus;
}

export type ActionResult = { status: 'success' } | { status: 'error'; message: string };
