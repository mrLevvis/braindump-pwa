import { useCallback, useState } from 'react';
import { BrainDumpDashboard } from './components/BrainDumpDashboard';
import { TimelineView } from './features/timeline';
import { Toaster } from './components/ui/sonner';
import { useEntriesBootstrap } from './hooks/useEntriesBootstrap';
import { parseAppRoute, type AppView } from './lib/routing';
import { useRouteSync } from './hooks/useRouteSync';
import { useSelectedDate } from './hooks/timelineSelectors';
import { useDaySelectionStore } from './features/timeline/store';
import { transcribeAudio } from './features/braindump/services/processBrainDump';
import { InputSection } from './features/braindump/views';
import { useIsProcessing, useSetProcessing, useSubmitText } from './hooks/braindumpSelectors';
import { useErrorToast, useSuccessToast } from './hooks/useErrorToast';
import { useVoiceRecording } from './hooks/useVoiceRecording';

function App() {
  useEntriesBootstrap();

  const selectedDate = useSelectedDate();
  const setSelectedDate = useDaySelectionStore(s => s.setSelectedDate);

  const [view, setView] = useState<AppView>(() => parseAppRoute().view);

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
      showSuccessToast('Eintrag erfolgreich strukturiert und gespeichert.');
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

  return (
    <div>
      {view === 'dashboard' ? (
        <BrainDumpDashboard onOpenTimeline={() => setView('timeline')} />
      ) : (
        <TimelineView onBack={() => setView('dashboard')} />
      )}
      <InputSection
        textValue={textValue}
        onTextChange={setTextValue}
        onTextSubmit={handleTextSubmit}
        status={buttonStatus}
        onVoiceClick={toggleRecording}
        disabled={isProcessing}
      />
      <Toaster />
    </div>
  );
}

export default App;
