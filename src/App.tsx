import { useState } from 'react';
import { EntryList, InputSection } from './features/braindump/views';
import { DASHBOARD_MOCK_ENTRIES } from './features/braindump/mock-entries';


function App() {
  return (
      <BrainDumpDashboard />
  );
}

export default App;

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

      {/* Die Liste mit den Dummy-Daten */}
      <main>
        <EntryList entries={DASHBOARD_MOCK_ENTRIES} />
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