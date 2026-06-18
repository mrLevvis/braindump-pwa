import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RecurrenceScope } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'delete' | 'edit';
  onConfirm: (scope: RecurrenceScope) => void;
}

const OPTIONS: { value: RecurrenceScope; label: string; description: string }[] = [
  {
    value: 'single',
    label: 'Nur dieser Termin',
    description: 'Alle anderen Termine der Serie bleiben erhalten.',
  },
  {
    value: 'following',
    label: 'Dieser und alle folgenden',
    description: 'Dieser und alle nachfolgenden Termine werden betroffen.',
  },
  {
    value: 'all',
    label: 'Alle Termine der Serie',
    description: 'Die gesamte Serie wird betroffen.',
  },
];

export function RecurrenceScopeDialog({ open, onOpenChange, mode, onConfirm }: Readonly<Props>) {
  const [scope, setScope] = useState<RecurrenceScope>('single');

  const handleConfirm = () => {
    onConfirm(scope);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === 'delete' ? 'Termin löschen' : 'Termin bearbeiten'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-1">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setScope(opt.value)}
              className={cn(
                'w-full rounded-xl border p-3 text-left transition-colors',
                scope === opt.value
                  ? 'border-sky-500 bg-sky-500/10 dark:bg-sky-500/15'
                  : 'border-border hover:bg-muted/50',
              )}
            >
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button
            variant={mode === 'delete' ? 'destructive' : 'default'}
            onClick={handleConfirm}
          >
            {mode === 'delete' ? 'Löschen' : 'Weiter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
