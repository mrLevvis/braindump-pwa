import { supabase } from '../../braindump/services/ApiClient';
import type { ActionResult, Issue, IssueStatus, IssueType } from '../types/Issue';

export const issuesService = {
    async submitIssue(type: IssueType, title: string, description?: string, screenshot?: File): Promise<ActionResult> {
        let screenshot_url: string | null = null;

        if (screenshot) {
            const ext = screenshot.name.split('.').pop() ?? 'png';
            const fileName = `${crypto.randomUUID()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('issue-screenshots')
                .upload(fileName, screenshot);
            if (uploadError) return { status: 'error', message: uploadError.message };
            const { data } = supabase.storage.from('issue-screenshots').getPublicUrl(fileName);
            screenshot_url = data.publicUrl;
        }

        const { error } = await supabase
            .from('issues')
            .insert({ type, title, description: description ?? null, screenshot_url });
        if (error) return { status: 'error', message: error.message };
        return { status: 'success' };
    },

    async fetchAllIssues(): Promise<Issue[]> {
        const { data, error } = await supabase
            .from('issues')
            .select('*')
            .order('created_at', { ascending: false });
        if (error || !data) return [];
        return data as Issue[];
    },

    async updateStatus(id: string, status: IssueStatus): Promise<ActionResult> {
        const { error } = await supabase
            .from('issues')
            .update({ status })
            .eq('id', id);
        if (error) return { status: 'error', message: error.message };
        return { status: 'success' };
    },
};
