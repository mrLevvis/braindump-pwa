import { useState } from 'react';
import { reprocessEntryAI } from '../services/processBrainDump';
import type { StructuredEntry } from '../types';

export interface KiSuggestionsState {
  isAnalyzing: boolean;
  draft: StructuredEntry | null;
  analyze: (text: string, captureId?: string) => Promise<void>;
  dismiss: () => void;
}

export function useKiSuggestions(): KiSuggestionsState {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [draft, setDraft] = useState<StructuredEntry | null>(null);

  const analyze = async (text: string, captureId?: string) => {
    setIsAnalyzing(true);
    try {
      const result = await reprocessEntryAI(text, captureId);
      setDraft(result);
    } catch {
      // KI ist optional — kein Fehler anzeigen, still ignorieren
    } finally {
      setIsAnalyzing(false);
    }
  };

  const dismiss = () => setDraft(null);

  return { isAnalyzing, draft, analyze, dismiss };
}
