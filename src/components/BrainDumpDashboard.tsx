import { useState } from 'react';
import { EntryList, InputSection } from '../features/braindump/views';
import { useEntries, useIsProcessing, useSetProcessing, useSubmitText } from '../hooks/braindumpSelectors';
import { useErrorToast, useSuccessToast } from '../hooks/useErrorToast';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { transcribeAudio } from '../features/braindump/services/processBrainDump';


export const BrainDumpDashboard = () => {

    /**
     * Der BrainDumpDashboard-Komponent ist die Hauptansicht unserer Anwendung, die die Eintragsliste und die Eingabesection enthält.
     * Er verwendet verschiedene Hooks, um den Zustand der Einträge, den Aufnahme- und Verarbeitungsstatus sowie Funktionen zum Aktualisieren dieser Zustände zu verwalten.
     * Die Eingabesection ermöglicht es dem Benutzer, Text einzugeben oder eine Sprachaufnahme zu starten, während die Eintragsliste die aktuellen Einträge anzeigt.
     */
    const [textValue, setTextValue] = useState('');
    const entries = useEntries();
    const { status, toggleRecording } = useVoiceRecording(
        (blob) => {
            handleTranscription(blob);
        }
    );
    const isProcessing = useIsProcessing();
    const buttonStatus = isProcessing ? 'processing' : status;
    const submitText = useSubmitText();
    const setProcessing = useSetProcessing();
    const showErrorToast = useErrorToast();
    const showSuccessToast = useSuccessToast();


    /**
     * Wird aufgerufen, wenn der Benutzer den Text über die Eingabesection einreicht.
     * Er überprüft, ob der Text nicht leer ist, schickt ihn dann zur Strukturierung an
     * die Edge Function und leert schließlich das Textfeld.
     * @returns void
     */
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


    /**
     * Wird aufgerufen, wenn eine Sprachaufnahme abgeschlossen ist.
     * Schickt den Blob zur Transkription und schreibt das Ergebnis editierbar ins Textfeld.
     * @param blob Die Audiodatei als Blob.
     * @returns void
     */
    const handleTranscription = async (blob: Blob) => {
        setProcessing(true);
        try {
            const transcript = await transcribeAudio(blob);
            setTextValue(transcript);
            showSuccessToast('Transkription erfolgreich erstellt.');
        } catch (e) {
            showErrorToast(e);
        } finally {
            setProcessing(false);
        }
    };


    /**
     * Der Rückgabewert des BrainDumpDashboard-Komponents, der die Hauptansicht unserer Anwendung darstellt.
     * Er enthält die Header-, Main- und InputSection-Komponenten, die die Eintragsliste und die Eingabefelder anzeigen.
     */
    return (
        <div>
            <header>
                <div>
                    <h1>BrainDump</h1>
                </div>
            </header>

            <main>
                <EntryList entries={entries} />
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

