import { useState } from 'react';
import { authService } from '../../../services/auth/authService';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

type LoginStep = 'email' | 'code';

export function LoginPage() {
    const [step, setStep] = useState<LoginStep>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const result = await authService.requestOtp(email);
        setLoading(false);
        if (result.status === 'error') {
            setError(result.message);
        } else {
            setStep('code');
        }
    };

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const result = await authService.verifyOtp(email, code);
        setLoading(false);
        if (result.status === 'error') {
            setError(result.message);
        }
        // On success the auth state change fires automatically — no redirect needed.
    };

    const handleRequestNewCode = async () => {
        setStep('email');
        setCode('');
        setError(null);
    };

    return (
        <div className="flex min-h-svh items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="space-y-1 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">Braindump</h1>
                    <p className="text-sm text-muted-foreground">
                        {step === 'email'
                            ? 'Gib deine E-Mail ein, um einen Code zu erhalten.'
                            : 'Gib den 6-stelligen Code aus deiner E-Mail ein.'}
                    </p>
                </div>

                {step === 'email' ? (
                    <form onSubmit={handleEmailSubmit} className="space-y-3">
                        <Input
                            type="email"
                            placeholder="deine@email.de"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Wird gesendet…' : 'Code anfordern'}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleCodeSubmit} className="space-y-3">
                        <Input
                            type="text"
                            inputMode="numeric"
                            pattern="\d{6}"
                            placeholder="123456"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                            autoFocus
                            maxLength={6}
                        />
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Wird geprüft…' : 'Anmelden'}
                        </Button>
                        <button
                            type="button"
                            onClick={handleRequestNewCode}
                            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                        >
                            Neuen Code anfordern
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
