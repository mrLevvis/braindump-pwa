import { useState } from 'react';
import { EntryList, InputSection } from './features/braindump/views';
import { useBrainDumpStore } from './features/braindump/store';

function App() {
  return (
    <BrainDumpDashboard />
  );
}

export default App;

export const BrainDumpDashboard = () => {
  const [textValue, setTextValue] = useState('');

  const entries = useBrainDumpStore((state) => state.entries);
  const isRecording = useBrainDumpStore((state) => state.isRecording);
  const isProcessing = useBrainDumpStore((state) => state.isProcessing);
  const setRecording = useBrainDumpStore((state) => state.setRecording);
  const addDummyEntry = useBrainDumpStore((state) => state.addDummyEntry);
  const updateEntryList = useBrainDumpStore((state) => state.updateEntryList);

  const handleTextSubmit = () => {
    if (!textValue.trim()) return;
    addDummyEntry(textValue);
    setTextValue('');
    updateEntryList();
  };

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
        isRecording={isRecording}
        onVoiceClick={() => setRecording(!isRecording)}
        disabled={isProcessing}
      />
    </div>
  );
};
