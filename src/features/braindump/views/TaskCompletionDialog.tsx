import { useState } from 'react';
import { useEntries, useToggleTaskCompleted, useUpdateEntry } from '@/hooks';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'confirm' | 'duration';

interface FlowState {
  phase: Phase;
  entryId: string;
  endTime: string;
}

const IDLE: FlowState = { phase: 'idle', entryId: '', endTime: '' };

function nowHHMM(): string {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

function subtractMinutes(hhmm: string, totalMin: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const totalEndMin = h * 60 + m;
  const totalStartMin = ((totalEndMin - totalMin) % (24 * 60) + 24 * 60) % (24 * 60);
  const sh = Math.floor(totalStartMin / 60);
  const sm = totalStartMin % 60;
  return `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTaskCompletionFlow() {
  const [flow, setFlow] = useState<FlowState>(IDLE);
  const [durationH, setDurationH] = useState('');
  const [durationM, setDurationM] = useState('');

  const allEntries        = useEntries();
  const toggleCompleted   = useToggleTaskCompleted();
  const updateEntry       = useUpdateEntry();

  // ── Public trigger ─────────────────────────────────────────────────────────

  const triggerToggle = (id: string, completed: boolean) => {
    if (!completed) {
      void toggleCompleted(id, false);
      return;
    }
    setDurationH('');
    setDurationM('');
    setFlow({ phase: 'confirm', entryId: id, endTime: '' });
  };

  // ── Confirm dialog handlers ────────────────────────────────────────────────

  const handleNo = () => {
    const { entryId } = flow;
    setFlow(IDLE);
    void toggleCompleted(entryId, true);
  };

  const handleYes = () => {
    setFlow(prev => ({ ...prev, phase: 'duration', endTime: nowHHMM() }));
  };

  // ── Duration dialog handlers ───────────────────────────────────────────────

  const applyCompletion = (entryId: string, endTime: string, durationMin: number) => {
    const entry = allEntries.find(e => e.id === entryId);
    void toggleCompleted(entryId, true);
    if (!entry) return;

    const payload: typeof entry.payload = { ...entry.payload, endTime };
    if (durationMin > 0) {
      payload.startTime = subtractMinutes(endTime, durationMin);
    }
    void updateEntry(entryId, { payload });
  };

  const handleSkip = () => {
    const { entryId, endTime } = flow;
    setFlow(IDLE);
    applyCompletion(entryId, endTime, 0);
  };

  const handleSave = () => {
    const { entryId, endTime } = flow;
    setFlow(IDLE);
    const h = Math.max(0, parseInt(durationH || '0', 10));
    const m = Math.max(0, parseInt(durationM || '0', 10));
    applyCompletion(entryId, endTime, h * 60 + m);
  };

  // ── Dialog JSX ────────────────────────────────────────────────────────────

  const dialogs = (
    <>
      {/* ── Dialog 1: Gerade erledigt? ──────────────────────────────────── */}
      <Dialog
        open={flow.phase === 'confirm'}
        onOpenChange={(open) => { if (!open) setFlow(IDLE); }}
      >
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Gerade erledigt?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Hast du diese Aufgabe eben abgeschlossen?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={handleNo}>
              Nein, nur abhaken
            </Button>
            <Button onClick={handleYes}>
              Ja, gerade eben
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog 2: Wie lange? ────────────────────────────────────────── */}
      <Dialog
        open={flow.phase === 'duration'}
        onOpenChange={(open) => { if (!open) setFlow(IDLE); }}
      >
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Wie lange hast du gebraucht?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Optional – hilft dir, ähnliche Aufgaben besser einzuschätzen.
          </p>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <p className="text-[10px] text-muted-foreground">Stunden</p>
              <Input
                type="number"
                min="0"
                max="23"
                value={durationH}
                onChange={e => setDurationH(e.target.value)}
                placeholder="0"
                autoFocus
              />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[10px] text-muted-foreground">Minuten</p>
              <Input
                type="number"
                min="0"
                max="59"
                value={durationM}
                onChange={e => setDurationM(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleSkip}>
              Überspringen
            </Button>
            <Button onClick={handleSave}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return { triggerToggle, dialogs };
}
