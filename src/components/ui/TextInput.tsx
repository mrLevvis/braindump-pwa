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
  'bg-white/5',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]',
  'border',
  'border-white/10',
  'px-4',
  'py-3',
  'text-sm',
  'text-white',
  'placeholder-white/40',
  'transition-all',
  'focus:outline-none',
  'focus:ring-[3px]',
  'focus:ring-[#7c3aed]/50',
  'focus:border-white/20',
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