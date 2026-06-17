import { useCallback, useEffect, useState } from 'react';
import { BrainDumpDashboard } from './components/BrainDumpDashboard';
import { TimelineView } from './features/timeline';
import { Toaster } from './components/ui/sonner';
import { useEntriesBootstrap } from './hooks/useEntriesBootstrap';
import { currentAuthPage, parseAppRoute, type AppView } from './lib/routing';
import { useRouteSync } from './hooks/useRouteSync';
import { useSelectedDate } from './hooks/timelineSelectors';
import { useDaySelectionStore } from './features/timeline/store';
import { transcribeAudio } from './features/braindump/services/processBrainDump';
import { InputSection, IngestPreviewSheet } from './features/braindump/views';
import { ShoppingView } from './features/shopping/components/ShoppingView';
import { useIsProcessing, useSetProcessing, useSubmitText } from './hooks/braindumpSelectors';
import { useErrorToast, useSuccessToast } from './hooks/useErrorToast';
import { useVoiceRecording } from './hooks/useVoiceRecording';
import { LoginPage, AuthCallbackPage } from './features/auth';
import { FeedbackButton, AdminView } from './features/issues';
import { useAuthStore } from './store/authSlice';
import { supabase } from './features/braindump/services/ApiClient';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? '';

// ─── Authenticated shell ──────────────────────────────────────────────────────
// Only rendered when a valid session exists. Runs all data bootstrapping.

function AuthenticatedApp() {
  useEntriesBootstrap();

  const selectedDate = useSelectedDate();
  const setSelectedDate = useDaySelectionStore(s => s.setSelectedDate);

  const [view, setView] = useState<AppView>(() => parseAppRoute().view);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const handlePop = useCallback((newView: AppView, date: string | null) => {
    setView(newView);
    if (date) setSelectedDate(date);
  }, [setSelectedDate]);

  useRouteSync(view, selectedDate, handlePop);

  // ─── Global input state ───────────────────────────────────────────────────────
  const [textValue, setTextValue] = useState('');
  const { status, toggleRecording } = useVoiceRecording((blob) => {
    handleTranscription(blob);
  });
  const isProcessing = useIsProcessing();
  const buttonStatus = isProcessing ? 'processing' : status;
  const submitText = useSubmitText();
  const setProcessing = useSetProcessing();
  const showErrorToast = useErrorToast();
  const showSuccessToast = useSuccessToast();

  const handleTextSubmit = async () => {
    if (!textValue.trim()) return;
    try {
      await submitText(textValue);
      setTextValue('');
      showSuccessToast('Analyse abgeschlossen – bitte Einträge prüfen.');
    } catch {
      showErrorToast('Beim Strukturieren ist etwas schiefgelaufen. Bitte versuche es gleich erneut.');
    }
  };

  const handleTranscription = async (blob: Blob) => {
    setProcessing(true);
    try {
      const transcript = await transcribeAudio(blob);
      setTextValue(transcript);
      showSuccessToast('Transkription erfolgreich erstellt.');
    } catch (error) {
      showErrorToast(error);
    } finally {
      setProcessing(false);
    }
  };

  const user = useAuthStore(s => s.user);
  const isAdmin = ADMIN_EMAIL !== '' && user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (view === 'admin' && !isAdmin) setView('dashboard');
  }, [view, isAdmin, setView]);

  if (view === 'admin' && isAdmin) {
    return <AdminView onBack={() => setView('dashboard')} />;
  }

  return (
    <div>
      {view === 'shopping' ? (
        <ShoppingView onBack={() => setView('dashboard')} />
      ) : view === 'timeline' ? (
        <TimelineView onBack={() => setView('dashboard')} />
      ) : (
        <BrainDumpDashboard
          onOpenTimeline={() => setView('timeline')}
          onOpenShopping={() => setView('shopping')}
          onSelectionModeChange={setIsSelectionMode}
        />
      )}
      {!isSelectionMode && (
        <InputSection
          textValue={textValue}
          onTextChange={setTextValue}
          onTextSubmit={handleTextSubmit}
          status={buttonStatus}
          onVoiceClick={toggleRecording}
          disabled={isProcessing}
        />
      )}
      <FeedbackButton />
      <IngestPreviewSheet />
      <Toaster />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
// Determines which page to render based on auth state and current URL.

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

function App() {
  const setUser = useAuthStore(s => s.setUser);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const authPage = currentAuthPage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthState(session ? 'authenticated' : 'unauthenticated');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthState(session ? 'authenticated' : 'unauthenticated');
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  if (authPage === 'auth-callback') return <AuthCallbackPage />;
  if (authState === 'loading') return null;
  if (authState === 'unauthenticated') return <LoginPage />;
  return <AuthenticatedApp />;
}

export default App;
