import { useState } from 'react';
import { authService } from '../../../services/auth/authService';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const result = await authService.requestMagicLink(email);
        setLoading(false);
        if (result.status === 'error') {
            setError(result.message);
        } else {
            setSent(true);
        }
    };

    return (
        <div className="flex min-h-svh items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="space-y-1 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">Braindump</h1>
                    <p className="text-sm text-muted-foreground">Gib deine E-Mail ein, um einen Login-Link zu erhalten.</p>
                </div>

                {sent ? (
                    <div className="rounded-2xl border border-border bg-muted/40 px-5 py-4 text-center text-sm text-muted-foreground">
                        Link wurde gesendet — bitte schau in dein Postfach.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <Input
                            type="email"
                            placeholder="deine@email.de"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Wird gesendet…' : 'Magic Link senden'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
