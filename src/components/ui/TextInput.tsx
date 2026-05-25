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

const DEFAULT_PLACEHOLDER = 'Schreibe einen Gedanken...';

/* -------------------------------------------------------------------------- */
/*                              UI Component                                  */
/* -------------------------------------------------------------------------- */

export default function TextInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
}: Readonly<TextInputProps>) {
  const resolvedPlaceholder = placeholder ?? DEFAULT_PLACEHOLDER;

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    if (!disabled && value.trim()) onSubmit();
  };

  const handleInputChange = (nextValue: string) => {
    onChange(nextValue);
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(event) => handleInputChange(event.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={resolvedPlaceholder}
      disabled={disabled}
    />
  );
}