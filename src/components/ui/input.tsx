import * as React from 'react';

import { cn } from '@/lib/utils';

const INPUT_CLASS_NAME = [
  'flex h-9 w-full rounded-4xl border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors outline-none',
  'file:border-0 file:bg-transparent file:text-sm file:font-medium',
  'placeholder:text-muted-foreground',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30',
  'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
].join(' ');

function Input({ className, type = 'text', ...props }: React.ComponentProps<'input'>) {
  return <input type={type} data-slot="input" className={cn(INPUT_CLASS_NAME, className)} {...props} />;
}

export { Input };