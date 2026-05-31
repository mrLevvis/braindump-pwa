import { useState } from 'react';
import { EntryList, InputSection } from '../features/braindump/views';
import { useEntries, useIsProcessing, useAddDummyEntry, useUpdateEntryList } from '../hooks/braindumpSelectors';
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
    const addDummyEntry = useAddDummyEntry();
    const updateEntryList = useUpdateEntryList();

    /** 
     * handleTextSubmit ist die Funktion, die aufgerufen wird, wenn der Benutzer den Text eingibt und die Eingabetaste drückt.
     * Sie überprüft, ob der Text nicht leer ist, fügt einen Dummy-Eintrag hinzu, setzt den Textwert zurück und aktualisiert die Eintragsliste.
     */
    const handleTextSubmit = () => {
        if (!textValue.trim()) return;
        addDummyEntry(textValue);
        setTextValue('');
        updateEntryList();
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

