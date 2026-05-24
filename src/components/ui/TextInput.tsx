import type { KeyboardEvent } from 'react';

/* -------------------------------------------------------------------------- */
/*                                   Props                                    */
/* -------------------------------------------------------------------------- */

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                              Styling Tokens                                */
/* -------------------------------------------------------------------------- */

const INPUT_CLASS = [
  'w-full',
  'rounded-[20px]',
  'border',
  'border-[rgba(255,255,255,0.25)]',
  'bg-[color:rgba(20,20,40,0.6)]',
  'backdrop-blur-[24px]',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_rgba(0,0,0,0.18)]',
  'px-4',
  'py-3',
  'text-sm',
  'text-[var(--text-glass-primary)]',
  '[text-shadow:0_1px_2px_rgba(0,0,0,0.2)]',
  'placeholder-[var(--text-glass-secondary)]',
  'transition-all',
  'focus:outline-none',
  'focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_rgba(0,0,0,0.18),0_0_0_3px_rgba(124,58,237,0.5)]',
  'disabled:cursor-not-allowed',
  'disabled:opacity-50',
].join(' ');

const DEFAULT_PLACEHOLDER = 'Schreibe einen Gedanken...';

/* -------------------------------------------------------------------------- */
/*                              UI Component                                  */
/* -------------------------------------------------------------------------- */

export const TextInput = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
}: Readonly<TextInputProps>) => {
  const resolvedPlaceholder = placeholder ?? DEFAULT_PLACEHOLDER;

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    if (!disabled && value.trim()) onSubmit();
  };

  const handleInputChange = (nextValue: string) => {
    onChange(nextValue);
  };

  return (
    <div className="w-full">
      <input
        type="text"
        value={value}
        onChange={(event) => handleInputChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={resolvedPlaceholder}
        disabled={disabled}
        className={INPUT_CLASS}
      />
    </div>
  );
};