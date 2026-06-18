import { supabase } from '../../features/braindump/services/ApiClient';

export type AuthResult = { status: 'success' } | { status: 'error'; message: string };

export interface AuthService {
    requestOtp(email: string): Promise<AuthResult>;
    verifyOtp(email: string, code: string): Promise<AuthResult>;
    signOut(): Promise<void>;
}

export const authService: AuthService = {
    async requestOtp(email: string): Promise<AuthResult> {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) return { status: 'error', message: error.message };
        return { status: 'success' };
    },

    async verifyOtp(email: string, code: string): Promise<AuthResult> {
        const { error } = await supabase.auth.verifyOtp({
            email,
            token: code,
            type: 'email',
        });
        if (error) return { status: 'error', message: 'Der Code ist falsch oder abgelaufen.' };
        return { status: 'success' };
    },

    async signOut(): Promise<void> {
        await supabase.auth.signOut();
    },
};
