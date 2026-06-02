import type { KeyboardEvent } from 'react';
import { Input } from './input';

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
const TEXT_INPUT_CLASS_NAME = ['min-w-0', 'flex-1'].join(' ');

/* -------------------------------------------------------------------------- */
/*                              UI Component                                  */
/* -------------------------------------------------------------------------- */

export function TextInput({
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
    <Input
      type="text"
      value={value}
      onChange={(event) => handleInputChange(event.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={resolvedPlaceholder}
      disabled={disabled}
      className={TEXT_INPUT_CLASS_NAME}
    />
  );
}

export default TextInput;