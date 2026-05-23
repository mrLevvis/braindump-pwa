interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const TextInput = ({ value, onChange, onSubmit, placeholder, disabled }: TextInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onSubmit();
    }
  };

  return (
    <div className="w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Schreibe einen Gedanken...'}
        disabled={disabled}
        className="w-full rounded-[14px] border border-[color:rgba(123,227,255,0.3)] bg-[color:rgba(8,26,56,0.6)] px-4 py-3 text-sm text-[var(--text-0)] placeholder-[var(--text-1)] transition-all focus:border-[var(--accent-0)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(57,200,255,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
};