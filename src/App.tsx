import { useState } from 'react';
import { BrainDumpDashboard } from './components/BrainDumpDashboard';
import { TimelineView } from './features/timeline';
import { Toaster } from './components/ui/sonner';
import { useEntriesBootstrap } from './hooks/useEntriesBootstrap';

type AppView = 'dashboard' | 'timeline';

function App() {
  useEntriesBootstrap();
  const [view, setView] = useState<AppView>('dashboard');

  return (
    <div>
      {view === 'dashboard' ? (
        <BrainDumpDashboard onOpenTimeline={() => setView('timeline')} />
      ) : (
        <TimelineView onBack={() => setView('dashboard')} />
      )}
      <Toaster />
    </div>
  );
}

export default App;
