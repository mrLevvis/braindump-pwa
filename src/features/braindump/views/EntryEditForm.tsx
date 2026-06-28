import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { BrainDumpEntry, EntryCategory, EntryPatch, RecurrenceRule, TimeOfDay } from '../types';
import { TIME_OF_DAY_OPTIONS, TIME_OF_DAY_LABEL } from '../types/BrainDump';
import { RecurrencePickerSection } from './RecurrencePickerSection';
import { useBrainDumpStore } from '../store';
import { wouldCreateCycle } from '../utils/dependencies';
import { useErrorToast } from '@/hooks';
import { useKiSuggestions } from '../hooks/useKiSuggestions';

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
const TIME_GRID_CLS = 'grid grid-cols-1 sm:grid-cols-3 gap-2';
const SELECT_CLS = [
  'flex w-full rounded-4xl border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors outline-none',
  'text-foreground placeholder:text-muted-foreground',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ');

const KI_SUGGESTION_CLS = [
  'flex flex-wrap items-center gap-1.5 rounded-lg border border-dashed border-primary/30',
  'bg-primary/5 px-3 py-2 text-xs',
].join(' ');

const CATEGORIES: EntryCategory[] = ['TASK', 'EVENT', 'NOTE', 'SHOPPING'];
const CATEGORY_LABEL: Record<EntryCategory, string> = { TASK: 'Aufgabe', EVENT: 'Termin', NOTE: 'Notiz', SHOPPING: 'Einkauf' };

const CATEGORY_ACTIVE: Record<EntryCategory, string> = {
  TASK:     'bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/40',
  EVENT:    'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40',
  NOTE:     'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
  SHOPPING: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
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
  const [endDate, setEndDate] = useState(entry.payload?.endDate ?? '');
  const [startTime, setStartTime] = useState(entry.payload?.startTime ?? '');
  const [endTime, setEndTime] = useState(entry.payload?.endTime ?? '');
  const [deadline, setDeadline] = useState(entry.payload?.deadline ?? '');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | ''>(entry.payload?.timeOfDay ?? '');
  const [tags, setTags] = useState<string[]>(entry.payload?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [summary, setSummary] = useState<string[]>(entry.summary ?? []);
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(entry.recurrence ?? null);
  const [predecessorIds, setPredecessorIds] = useState<string[]>(entry.dependsOn ?? []);
  const [predSearch, setPredSearch] = useState('');
  const [predDropdownOpen, setPredDropdownOpen] = useState(false);
  const [kiTitleDismissed, setKiTitleDismissed] = useState(false);
  const [kiSummaryDismissed, setKiSummaryDismissed] = useState(false);

  const allEntries = useBrainDumpStore(s => s.entries);
  const showErrorToast = useErrorToast();
  const { isAnalyzing, draft: kiDraft, analyze, dismiss: dismissKi } = useKiSuggestions();

  const tagInputRef = useRef<HTMLInputElement>(null);
  const predSearchRef = useRef<HTMLInputElement>(null);

  // Reset KI-dismissed flags whenever a new draft arrives
  useEffect(() => {
    if (kiDraft) {
      setKiTitleDismissed(false);
      setKiSummaryDismissed(false);
    }
  }, [kiDraft]);

  const handleCategoryChange = (cat: EntryCategory) => {
    setCategory(cat);
    if (cat === 'NOTE') {
      setDate('');
      setStartTime('');
      setEndTime('');
      setDeadline('');
      setTimeOfDay('');
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

  const candidateTasks = allEntries.filter(e =>
    e.category === 'TASK' &&
    e.id !== entry.id &&
    !e._isVirtualOccurrence &&
    !predecessorIds.includes(e.id)
  );
  const filteredCandidates = predSearch.trim()
    ? candidateTasks.filter(e => (e.title ?? '').toLowerCase().includes(predSearch.toLowerCase()))
    : candidateTasks.slice(0, 8);

  const handleAddPredecessor = (predId: string) => {
    if (wouldCreateCycle(entry.id, predId, allEntries)) {
      showErrorToast('Dieser Vorgänger würde einen Zyklus erzeugen.');
      return;
    }
    setPredecessorIds(prev => [...prev, predId]);
    setPredSearch('');
    setPredDropdownOpen(false);
    predSearchRef.current?.focus();
  };

  const handleRemovePredecessor = (predId: string) =>
    setPredecessorIds(prev => prev.filter(id => id !== predId));

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
        ...(category === 'EVENT' && endDate && endDate > (date || '') ? { endDate } : {}),
        ...(category !== 'NOTE' && startTime ? { startTime } : {}),
        ...(category !== 'NOTE' && endTime && startTime ? { endTime } : {}),
        ...(category === 'TASK' && deadline ? { deadline } : {}),
        ...(category !== 'NOTE' && timeOfDay ? { timeOfDay } : {}),
        ...(tags.length > 0 ? { tags } : {}),
      },
      summary: summary.filter(s => s.trim()),
      ...(category === 'EVENT' ? { recurrence: recurrence ?? null } : {}),
      ...(category === 'TASK' && !entry._isVirtualOccurrence ? { dependsOn: predecessorIds } : {}),
    };
    onSave(patch);
  };

  const handleAnalyzeWithKi = () => {
    const textParts = [title, ...summary].filter(Boolean);
    const text = textParts.join('. ') || entry.original_text;
    void analyze(text, entry.captureId);
  };

  // KI-suggested tags that the user doesn't already have
  const kiSuggestedTags = kiDraft?.payload?.tags?.filter(t => !tags.includes(t)) ?? [];

  // KI-suggested title differs from current
  const kiTitle = kiDraft?.title;
  const showKiTitle = !kiTitleDismissed && kiTitle && kiTitle !== title;

  // KI-suggested summary
  const kiSummary = kiDraft?.summary ?? [];
  const showKiSummary = !kiSummaryDismissed && kiSummary.length > 0;

  return (
    <div className="space-y-5 px-6 pb-10">
      <div className={SECTION_CLS}>
        <p className={LABEL_CLS}>Titel</p>
        <AutoGrowTextarea
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Titel"
        />
        {showKiTitle && (
          <div className={KI_SUGGESTION_CLS}>
            <Sparkles className="h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-muted-foreground">KI:</span>
            <span className="flex-1">{kiTitle}</span>
            <button
              type="button"
              onClick={() => setTitle(kiTitle)}
              className="rounded px-1.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/10"
            >
              Übernehmen
            </button>
            <button
              type="button"
              onClick={() => setKiTitleDismissed(true)}
              aria-label="KI-Titelvorschlag ignorieren"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
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
        <>
          <div className={SECTION_CLS}>
            <p className={LABEL_CLS}>Datum &amp; Uhrzeit</p>
            <div className={TIME_GRID_CLS}>
              <div className="space-y-1">
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
            <div className="space-y-1 mt-2">
              <p className="text-[10px] text-muted-foreground">Enddatum (optional, für mehrtägige Einträge)</p>
              <Input
                type="date"
                value={endDate}
                min={date || undefined}
                onChange={e => setEndDate(e.target.value)}
                className="sm:max-w-[calc(33.33%-0.5rem)]"
              />
            </div>
            {!startTime && (
              <div className="space-y-1 mt-2">
                <p className="text-[10px] text-muted-foreground">Grobe Tageszeit</p>
                <select
                  value={timeOfDay}
                  onChange={e => setTimeOfDay(e.target.value as TimeOfDay | '')}
                  className={SELECT_CLS}
                  aria-label="Grobe Tageszeit"
                >
                  <option value="">– keine –</option>
                  {TIME_OF_DAY_OPTIONS.map(t => (
                    <option key={t} value={t}>{TIME_OF_DAY_LABEL[t]}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className={SECTION_CLS}>
            <p className={LABEL_CLS}>Wiederholung</p>
            <RecurrencePickerSection value={recurrence} onChange={setRecurrence} />
          </div>
        </>
      )}

      {category === 'TASK' && (
        <>
          <div className={SECTION_CLS}>
            <p className={LABEL_CLS}>Termin</p>
            <div className={TIME_GRID_CLS}>
              <div className="space-y-1">
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
            {!startTime && (
              <div className="space-y-1 mt-2">
                <p className="text-[10px] text-muted-foreground">Grobe Tageszeit</p>
                <select
                  value={timeOfDay}
                  onChange={e => setTimeOfDay(e.target.value as TimeOfDay | '')}
                  className={SELECT_CLS}
                  aria-label="Grobe Tageszeit"
                >
                  <option value="">– keine –</option>
                  {TIME_OF_DAY_OPTIONS.map(t => (
                    <option key={t} value={t}>{TIME_OF_DAY_LABEL[t]}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className={SECTION_CLS}>
            <p className={LABEL_CLS}>Deadline</p>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">Fällig bis</p>
              <Input type="time" value={deadline} onChange={e => setDeadline(e.target.value)} className="sm:max-w-[calc(33.33%-0.5rem)]" />
            </div>
          </div>
        </>
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
        {showKiSummary && (
          <div className={cn(KI_SUGGESTION_CLS, 'flex-col items-start gap-2 mt-1')}>
            <div className="flex w-full items-center gap-1.5">
              <Sparkles className="h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
              <span className="flex-1 text-muted-foreground">KI-Zusammenfassung</span>
              <button
                type="button"
                onClick={() => { setSummary(kiSummary); setKiSummaryDismissed(true); }}
                className="rounded px-1.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/10"
              >
                Alle übernehmen
              </button>
              <button
                type="button"
                onClick={() => setKiSummaryDismissed(true)}
                aria-label="KI-Zusammenfassung ignorieren"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <ul className="w-full space-y-0.5 pl-1">
              {kiSummary.map((line, i) => (
                <li key={i} className="flex items-start gap-1.5 text-foreground/80">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden="true" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
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
        {kiSuggestedTags.length > 0 && (
          <div className={KI_SUGGESTION_CLS}>
            <Sparkles className="h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-muted-foreground shrink-0">KI schlägt vor:</span>
            {kiSuggestedTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setTags(prev => [...prev, tag])}
                className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
              >
                <Plus className="h-2.5 w-2.5" />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {category === 'TASK' && !entry._isVirtualOccurrence && (
        <div className={SECTION_CLS}>
          <p className={LABEL_CLS}>Vorgänger</p>
          <div className="flex flex-wrap gap-1.5">
            {predecessorIds.map(predId => {
              const pred = allEntries.find(e => e.id === predId);
              return (
                <span
                  key={predId}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
                >
                  {pred?.title ?? 'Unbekannt'}
                  <button
                    type="button"
                    onClick={() => handleRemovePredecessor(predId)}
                    aria-label="Vorgänger entfernen"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
          <div className="relative">
            <Input
              ref={predSearchRef}
              value={predSearch}
              onChange={e => { setPredSearch(e.target.value); setPredDropdownOpen(true); }}
              onFocus={() => setPredDropdownOpen(true)}
              onBlur={() => setTimeout(() => setPredDropdownOpen(false), 150)}
              placeholder="Vorgänger hinzufügen…"
              className="h-7 text-sm"
            />
            {predDropdownOpen && filteredCandidates.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
                {filteredCandidates.map(task => (
                  <li key={task.id}>
                    <button
                      type="button"
                      onMouseDown={() => handleAddPredecessor(task.id)}
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted truncate"
                    >
                      {task.title ?? 'Unbenannt'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {bottomSlot}

      {/* KI-Analyse-Trigger */}
      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={handleAnalyzeWithKi}
          disabled={isAnalyzing || isSaving}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors',
            'text-muted-foreground hover:text-primary hover:bg-primary/5',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <Sparkles className={cn('h-3 w-3', isAnalyzing && 'animate-spin')} aria-hidden="true" />
          {isAnalyzing ? 'KI analysiert…' : kiDraft ? 'Erneut analysieren' : 'Mit KI analysieren'}
        </button>
        {kiDraft && (
          <button
            type="button"
            onClick={dismissKi}
            className="ml-1 flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-3 w-3" />
            Vorschläge verwerfen
          </button>
        )}
      </div>

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
