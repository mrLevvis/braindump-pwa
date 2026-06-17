import { supabase } from '../../features/braindump/services/ApiClient';

export type AuthResult = { status: 'success' } | { status: 'error'; message: string };

export interface AuthService {
    requestMagicLink(email: string): Promise<AuthResult>;
    exchangeCodeForSession(): Promise<AuthResult>;
    signOut(): Promise<void>;
}

export const authService: AuthService = {
    async requestMagicLink(email: string): Promise<AuthResult> {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) return { status: 'error', message: error.message };
        return { status: 'success' };
    },

    async exchangeCodeForSession(): Promise<AuthResult> {
        const code = new URLSearchParams(window.location.search).get('code');
        if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) return { status: 'error', message: 'Der Link ist abgelaufen oder ungültig.' };
            return { status: 'success' };
        }
        // Fallback: session may already exist (implicit flow / repeated visit)
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
            return { status: 'error', message: 'Ungültiger oder abgelaufener Link.' };
        }
        return { status: 'success' };
    },

    async signOut(): Promise<void> {
        await supabase.auth.signOut();
    },
};
