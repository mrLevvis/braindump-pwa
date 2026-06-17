import { useEffect, useState } from 'react';
import { authService } from '../../../services/auth/authService';
import { Button } from '../../../components/ui/button';

export function AuthCallbackPage() {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        authService.exchangeCodeForSession().then((result) => {
            if (result.status === 'error') {
                setError(result.message);
                return;
            }
            window.location.replace('/');
        });
    }, []);

    return (
        <div className="flex min-h-svh items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm space-y-4 text-center">
                {error ? (
                    <>
                        <p className="text-sm text-destructive">{error}</p>
                        <Button variant="outline" onClick={() => window.location.replace('/login')}>
                            Zurück zum Login
                        </Button>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">Anmeldung wird verarbeitet…</p>
                )}
            </div>
        </div>
    );
}
