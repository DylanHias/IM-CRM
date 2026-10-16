'use client';

import { cn } from '@/lib/utils';

interface Option<T extends string> {
  value: T;
  label: React.ReactNode;
  title?: string;
}

interface Props<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  'aria-label': string;
  size?: 'default' | 'sm';
  className?: string;
}

/** Joined toggle buttons for switching between a few mutually exclusive views or scopes. */
export function Segmented<T extends string>({ value, onChange, options, size = 'default', className, ...props }: Props<T>) {
  return (
    <div role="group" aria-label={props['aria-label']} className={cn('inline-flex shrink-0 rounded-md border border-border-strong bg-card p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex items-center gap-1.5 whitespace-nowrap rounded font-medium text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-accent aria-pressed:text-accent-foreground',
            size === 'sm' ? 'h-[20px] px-2 text-xs' : 'h-6 px-2.5 text-[12.5px]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
