import { Circle, CircleCheck } from 'lucide-react';

const SIZE_MAP = {
  sm: { container: 'h-6 w-6', icon: 'h-5 w-5' },
  md: { container: 'h-7 w-7', icon: 'h-6 w-6' },
  lg: { container: 'h-9 w-9', icon: 'h-8 w-8' },
} as const;

const BASE_BTN = [
  'flex items-center justify-center rounded-full',
  'bg-white dark:bg-white/10 shadow-sm',
  'hover:opacity-80 transition-opacity',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
].join(' ');

interface Props {
  completed: boolean;
  accent: string;
  size: 'sm' | 'md' | 'lg';
  onToggle: () => void;
  /** Positioning classes — caller supplies the absolute/relative placement. */
  className?: string;
}

export function TaskToggle({ completed, accent, size, onToggle, className }: Readonly<Props>) {
  const { container, icon } = SIZE_MAP[size];
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={completed ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
      aria-pressed={completed}
      className={[BASE_BTN, container, className ?? ''].join(' ')}
    >
      {completed
        ? <CircleCheck className={`${icon} text-emerald-500`} aria-hidden="true" />
        : <Circle className={`${icon} ${accent}`} aria-hidden="true" />}
    </button>
  );
}
