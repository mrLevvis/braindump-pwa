import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { BrainDumpEntry, EntryCategory, EntryPatch } from '../types';

// Matches Input's visual style but grows with content instead of clipping.
const AUTOGROW_CLS = [
  'flex w-full rounded-4xl border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors outline-none',
  'placeholder:text-muted-foreground',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30',
  'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
  'resize-none overflow-hidden leading-normal',
].join(' ');

function AutoGrowTextarea({ value, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return <textarea ref={ref} value={value} rows={1} className={cn(AUTOGROW_CLS, className)} {...props} />;
}

const LABEL_CLS = 'text-xs font-medium uppercase tracking-wide text-muted-foreground';
const SECTION_CLS = 'space-y-1.5';
const TIME_GRID_CLS = 'grid grid-cols-2 sm:grid-cols-3 gap-2';

const CATEGORIES: EntryCategory[] = ['TASK', 'EVENT', 'NOTE'];
const CATEGORY_LABEL: Record<EntryCategory, string> = { TASK: 'Aufgabe', EVENT: 'Termin', NOTE: 'Notiz' };

const CATEGORY_ACTIVE: Record<EntryCategory, string> = {
  TASK: 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/40',
  EVENT: 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40',
  NOTE: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
};

const CAT_BTN_BASE = 'flex-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors';

interface Props {
  entry: BrainDumpEntry;
  onSave: (patch: EntryPatch) => void;
  onCancel: () => void;
  isSaving: boolean;
  bottomSlot?: React.ReactNode;
}

export function EntryEditForm({ entry, onSave, onCancel, isSaving, bottomSlot }: Readonly<Props>) {
  const [title, setTitle] = useState(entry.title ?? '');
  const [category, setCategory] = useState<EntryCategory>(entry.category);
  const [date, setDate] = useState(entry.payload?.date ?? '');
  const [startTime, setStartTime] = useState(entry.payload?.startTime ?? '');
  const [endTime, setEndTime] = useState(entry.payload?.endTime ?? '');
  const [tags, setTags] = useState<string[]>(entry.payload?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [summary, setSummary] = useState<string[]>(entry.summary ?? []);

  const tagInputRef = useRef<HTMLInputElement>(null);

  const handleCategoryChange = (cat: EntryCategory) => {
    setCategory(cat);
    if (cat === 'NOTE') {
      setDate('');
      setStartTime('');
      setEndTime('');
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
    }
    setTagInput('');
    tagInputRef.current?.focus();
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
  };

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const updateSummaryLine = (i: number, value: string) =>
    setSummary(prev => prev.map((line, idx) => idx === i ? value : line));

  const removeSummaryLine = (i: number) =>
    setSummary(prev => prev.filter((_, idx) => idx !== i));

  const addSummaryLine = () => setSummary(prev => [...prev, '']);

  const handleSave = () => {
    const patch: EntryPatch = {
      title: title.trim() || undefined,
      category,
      payload: {
        ...(category !== 'NOTE' && date ? { date } : {}),
        ...(category !== 'NOTE' && startTime ? { startTime } : {}),
        ...(category !== 'NOTE' && endTime ? { endTime } : {}),
        ...(tags.length > 0 ? { tags } : {}),
      },
      summary: summary.filter(s => s.trim()),
    };
    onSave(patch);
  };

  return (
    <div className="space-y-5 px-6 pb-10">
      <div className={SECTION_CLS}>
        <p className={LABEL_CLS}>Titel</p>
        <AutoGrowTextarea
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Titel"
        />
      </div>

      <div className={SECTION_CLS}>
        <p className={LABEL_CLS}>Kategorie</p>
        <div className="flex gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={cn(CAT_BTN_BASE, category === cat
                ? CATEGORY_ACTIVE[cat]
                : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              {CATEGORY_LABEL[cat]}
            </button>
          ))}
        </div>
      </div>

      {category === 'EVENT' && (
        <div className={SECTION_CLS}>
          <p className={LABEL_CLS}>Datum &amp; Uhrzeit</p>
          <div className={TIME_GRID_CLS}>
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <p className="text-[10px] text-muted-foreground">Datum</p>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">Von</p>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">Bis</p>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {category === 'TASK' && (
        <div className={SECTION_CLS}>
          <p className={LABEL_CLS}>Fällig am</p>
          <div className={TIME_GRID_CLS}>
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <p className="text-[10px] text-muted-foreground">Datum</p>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">Von</p>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">Bis</p>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      <div className={SECTION_CLS}>
        <p className={LABEL_CLS}>Zusammenfassung</p>
        <div className="space-y-1.5">
          {summary.map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden="true" />
              <AutoGrowTextarea
                value={line}
                onChange={e => updateSummaryLine(i, e.target.value)}
                className="py-0.5 text-sm"
              />
              <button
                type="button"
                onClick={() => removeSummaryLine(i)}
                aria-label="Punkt entfernen"
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSummaryLine}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" /> Punkt hinzufügen
          </button>
        </div>
      </div>

      <div className={SECTION_CLS}>
        <p className={LABEL_CLS}>Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Tag ${tag} entfernen`}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            ref={tagInputRef}
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Neuer Tag…"
            className="h-7 text-sm"
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag} className="h-7 px-2">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {bottomSlot}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
          Abbrechen
        </Button>
        <Button type="button" size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Speichert…' : 'Speichern'}
        </Button>
      </div>
    </div>
  );
}
