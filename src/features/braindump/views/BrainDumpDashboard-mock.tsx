import { useState } from 'react';
import type { BrainDumpEntry } from '../types/BrainDump';
import EntryList from './EntryList';
import InputSection from './InputSection';

// Statische Dummy-Daten exakt nach Interface-Vertrag
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
  {
    id: '4',
    created_at: new Date(Date.now() - 10800000).toISOString(), // vor 3 Stunden
    original_text: 'Zahnarzt-Termin nächsten Dienstag um 10:30 Uhr nicht vergessen.',
    category: 'EVENT',
    payload: { date: '2026-05-27', time: '10:30' },
  },
  {
    id: '5',
    created_at: new Date(Date.now() - 18000000).toISOString(), // vor 5 Stunden
    original_text: 'Einkaufsliste für das Wochenende erstellen: Reis, Gemüse, Olivenöl.',
    category: 'TASK',
    payload: { tags: ['Privat'] },
  },
  {
    id: '6',
    created_at: new Date(Date.now() - 86400000).toISOString(), // vor 1 Tag
    original_text: 'Idee: Braindump als Widget auf dem Homescreen anbieten – direkt diktieren ohne App zu öffnen.',
    category: 'NOTE',
    payload: { tags: ['Idee', 'PWA'] },
  },
];

export const BrainDumpDashboard = () => {
  // Temporäre lokale States, nur damit das Textfeld und der Button bedienbar sind.
  // In Ticket 2 wandert das in den globalen Zustand-Store.
  const [textValue, setTextValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div>
      <header>
        <div>
          <h1>
            BrainDump
          </h1>
        </div>
      </header>

      {/* Die Liste mit unseren Dummy-Daten */}
      <main>
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