import { useState } from 'react';
import type { BrainDumpEntry } from '../types/BrainDump';
import { EntryList } from './EntryList';
import { InputSection } from './InputSection';

// Statische Dummy-Daten exakt nach unserem Interface-Vertrag
const MOCK_ENTRIES: BrainDumpEntry[] = [
  {
    id: '1',
    created_at: new Date().toISOString(),
    original_text: 'Morgen um 14 Uhr Meeting mit dem neuen KI-Team.',
    category: 'EVENT',
    payload: { date: '2026-05-24', time: '14:00' },
  },
  {
    id: '2',
    created_at: new Date(Date.now() - 3600000).toISOString(), // vor 1 Stunde
    original_text: 'Ich muss unbedingt noch die Architektur-Doku abschließen.',
    category: 'TASK',
    payload: { tags: ['Wichtig', 'Arbeit'] },
  },
  {
    id: '3',
    created_at: new Date(Date.now() - 7200000).toISOString(), // vor 2 Stunden
    original_text: 'Clean Code bedeutet, Dateien nach ihrer Verantwortung zu trennen.',
    category: 'NOTE',
    payload: { tags: ['Prinzipien'] },
  },
];

export const BrainDumpDashboard = () => {
  // Temporäre lokale States, nur damit das Textfeld und der Button bedienbar sind.
  // In Ticket 2 wandert das in den globalen Zustand-Store.
  const [textValue, setTextValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="min-h-screen relative text-[var(--text-0)]">
      <header className="sticky top-0 z-20 px-4 pt-4">
        <div className="glass-panel mx-auto max-w-md rounded-[18px] px-4 py-3">
          <h1 className="text-center text-[20px] font-semibold tracking-[0.02em]">
          BrainDump
          </h1>
        </div>
      </header>

      {/* Die Liste mit unseren Dummy-Daten */}
      <main className="mx-auto max-w-md pt-4">
        <EntryList entries={MOCK_ENTRIES} />
      </main>

      {/* Die Eingabeschicht */}
      <InputSection
        textValue={textValue}
        onTextChange={setTextValue}
        onTextSubmit={() => {
          console.log('Dummy-Submit:', textValue);
          setTextValue(''); // Feld nach Enter leeren
        }}
        isRecording={isRecording}
        onVoiceClick={() => setIsRecording(!isRecording)}
      />
    </div>
  );
};