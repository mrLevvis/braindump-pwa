import { useState } from 'react';
import { EntryList, InputSection } from '../features/braindump/views';
import { useEntries, useIsProcessing, useSubmitText } from '../hooks/braindumpSelectors';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { useSetAudioBlob } from '../hooks';


export const BrainDumpDashboard = () => {

    /**
     * Der BrainDumpDashboard-Komponent ist die Hauptansicht unserer Anwendung, die die Eintragsliste und die Eingabesection enthält.
     * Er verwendet verschiedene Hooks, um den Zustand der Einträge, den Aufnahme- und Verarbeitungsstatus sowie Funktionen zum Aktualisieren dieser Zustände zu verwalten.
     * Die Eingabesection ermöglicht es dem Benutzer, Text einzugeben oder eine Sprachaufnahme zu starten, während die Eintragsliste die aktuellen Einträge anzeigt.
     */
    const [textValue, setTextValue] = useState('');
    const entries = useEntries();
    const setAudioBlob = useSetAudioBlob();
    const { status, toggleRecording } = useVoiceRecording(
        (blob) => {
            setAudioBlob(blob);
        }
    );
    const isProcessing = useIsProcessing();
    const buttonStatus = isProcessing ? 'processing' : status;
    const submitText = useSubmitText();


    /** 
     * Die Funktion handleTextSubmit wird aufgerufen, wenn der Benutzer den Text eingibt und auf den Submit-Button klickt.
     * Sie überprüft, ob der eingegebene Text nicht leer ist, und ruft dann die submitText-Funktion aus dem BrainDump-Store auf, um den Text zu verarbeiten.
     * Nach dem Einreichen des Textes wird das Eingabefeld geleert, indem der textValue-Zustand zurückgesetzt wird.
     */
    const handleTextSubmit = () => {
    if (!textValue.trim()) return;
    submitText(textValue);
    setTextValue('');
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

