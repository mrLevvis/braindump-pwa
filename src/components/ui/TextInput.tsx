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
  'rounded-[14px]',
  'border',
  'border-[color:rgba(123,227,255,0.3)]',
  'bg-[color:rgba(8,26,56,0.6)]',
  'px-4',
  'py-3',
  'text-sm',
  'text-[var(--text-0)]',
  'placeholder-[var(--text-1)]',
  'transition-all',
  'focus:border-[var(--accent-0)]',
  'focus:outline-none',
  'focus:ring-2',
  'focus:ring-[color:rgba(57,200,255,0.25)]',
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