'use client';

import { cn } from '@/lib/utils';
import type { Currency } from '@/lib/revenue/effectiveArr';

interface Props {
  value: Currency;
  onChange: (currency: Currency) => void;
  className?: string;
}

const OPTIONS: { value: Currency; label: string; title: string }[] = [
  { value: 'USD', label: 'USD', title: 'United States Dollars' },
  { value: 'LC', label: 'Local', title: 'Local currency of each customer' },
];

export function CurrencyToggle({ value, onChange, className }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="ARR currency"
      className={cn(
        'inline-flex items-center rounded-md border border-border/70 p-0.5 bg-card h-9',
        className,
      )}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          title={opt.title}
          className={cn(
            'px-3 h-full text-xs font-medium rounded-sm transition-colors',
            value === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
