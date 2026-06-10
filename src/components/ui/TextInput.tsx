import { useEffect } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';
import { useAutosizeTextarea } from '@/hooks/useAutosizeTextarea';

const DEFAULT_PLACEHOLDER = 'Schreibe einen Gedanken...';
const MAX_HEIGHT_VH = 30;

const TEXTAREA_CLASS_NAME = [
  'min-w-0', 'flex-1',
  'min-h-9', 'resize-none',
  'rounded-4xl', 'border', 'border-input', 'bg-background',
  'px-3', 'py-1', 'text-base', 'shadow-sm', 'transition-colors', 'outline-none',
  'placeholder:text-muted-foreground',
  'focus-visible:border-ring', 'focus-visible:ring-3', 'focus-visible:ring-ring/30',
  'disabled:cursor-not-allowed', 'disabled:opacity-50', 'md:text-sm',
].join(' ');

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TextInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
  className,
}: Readonly<TextInputProps>) {
  const maxHeightPx = window.innerHeight * (MAX_HEIGHT_VH / 100);
  const { ref, resize } = useAutosizeTextarea(maxHeightPx);
  const resolvedPlaceholder = placeholder ?? DEFAULT_PLACEHOLDER;

  // Resize when value changes externally (e.g. cleared after submit).
  useEffect(() => { resize(); }, [value, resize]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    if (!disabled && value.trim()) onSubmit();
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    resize();
  };

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={resolvedPlaceholder}
      disabled={disabled}
      className={cn(TEXTAREA_CLASS_NAME, className)}
    />
  );
}

export default TextInput;
