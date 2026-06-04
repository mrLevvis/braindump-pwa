import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { transcribeAudio } from '../features/braindump/services/processBrainDump';
import { EntryList, InputSection } from '../features/braindump/views';
import { useEntries, useIsProcessing, useSetProcessing, useSubmitText } from '../hooks/braindumpSelectors';
import { useErrorToast, useSuccessToast } from '../hooks/useErrorToast';
import { useVoiceRecording } from '../hooks/useVoiceRecording';

const DASHBOARD_ROOT_CLASS_NAME = ['flex', 'min-h-dvh', 'flex-col', 'bg-background'].join(' ');
const DASHBOARD_HEADER_CLASS_NAME = ['shrink-0', 'border-b', 'bg-background'].join(' ');
const DASHBOARD_HEADER_INNER_CLASS_NAME = [
  'mx-auto', 'flex', 'w-full', 'max-w-3xl',
  'items-center', 'justify-between', 'px-4', 'py-4',
].join(' ');
const DASHBOARD_TITLE_CLASS_NAME = ['text-2xl', 'font-semibold', 'tracking-tight'].join(' ');
const TIMELINE_BTN_CLASS_NAME = [
  'flex', 'items-center', 'justify-center',
  'h-8', 'w-8', 'rounded-lg',
  'text-muted-foreground', 'hover:text-foreground', 'hover:bg-muted/50',
  'transition-colors', 'shrink-0',
  'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring',
].join(' ');
const DASHBOARD_MAIN_CLASS_NAME = ['flex-1', 'overflow-y-auto'].join(' ');
const DASHBOARD_MAIN_INNER_CLASS_NAME = ['mx-auto', 'w-full', 'max-w-3xl', 'px-4', 'py-4', 'pb-36'].join(' ');

export const BrainDumpDashboard = ({ onOpenTimeline }: Readonly<{ onOpenTimeline: () => void }>) => {
    const [textValue, setTextValue] = useState('');
    const entries = useEntries();
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
        <div className={DASHBOARD_ROOT_CLASS_NAME}>
            <header className={DASHBOARD_HEADER_CLASS_NAME}>
                <div className={DASHBOARD_HEADER_INNER_CLASS_NAME}>
                    <h1 className={DASHBOARD_TITLE_CLASS_NAME}>BrainDump</h1>
                    <button
                        type="button"
                        className={TIMELINE_BTN_CLASS_NAME}
                        onClick={onOpenTimeline}
                        aria-label="Timeline öffnen"
                    >
                        <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            </header>

            <main className={DASHBOARD_MAIN_CLASS_NAME}>
                <div className={DASHBOARD_MAIN_INNER_CLASS_NAME}>
                    <EntryList entries={entries} />
                </div>
            </main>

            <InputSection
                textValue={textValue}
                onTextChange={setTextValue}
                onTextSubmit={handleTextSubmit}
                status={buttonStatus}
                onVoiceClick={toggleRecording}
                disabled={isProcessing}
            />
        </div>
    );
};

