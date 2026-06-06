import { useCallback, useState } from 'react';
import { BrainDumpDashboard } from './components/BrainDumpDashboard';
import { TimelineView } from './features/timeline';
import { Toaster } from './components/ui/sonner';
import { useEntriesBootstrap } from './hooks/useEntriesBootstrap';
import { parseAppRoute, type AppView } from './lib/routing';
import { useRouteSync } from './hooks/useRouteSync';
import { useSelectedDate } from './hooks/timelineSelectors';
import { useDaySelectionStore } from './features/timeline/store';

function App() {
  useEntriesBootstrap();

  const selectedDate = useSelectedDate();
  const navMode = useDaySelectionStore(s => s.navMode);
  const setSelectedDate = useDaySelectionStore(s => s.setSelectedDate);

  // Initialize view from URL on first render (date is already primed in the store).
  const [view, setView] = useState<AppView>(() => parseAppRoute().view);

  // Called by useRouteSync when the user navigates Back / Forward.
  const handlePop = useCallback((newView: AppView, date: string | null) => {
    setView(newView);
    if (date) setSelectedDate(date);
  }, [setSelectedDate]);

  useRouteSync(view, selectedDate, navMode, handlePop);

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
