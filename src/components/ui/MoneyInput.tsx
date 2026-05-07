'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

interface Props {
  value: string;
  onValueChange: (raw: string) => void;
  currency?: string;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
}

const NUMBER_FORMAT = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatDisplay(raw: string): string {
  if (!raw) return '';
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return raw;
  return NUMBER_FORMAT.format(n);
}

function stripFormatting(input: string): string {
  // Keep digits, comma → strip, period stays as decimal separator
  return input.replace(/,/g, '').trim();
}

/** Currency-formatted text input. Stores the raw numeric string upstream;
 *  shows a thousand-separated value on blur and the raw editable string on focus. */
export function MoneyInput({ value, onValueChange, currency, placeholder, id, disabled }: Props) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(value);

  // Keep draft in sync with external value when not focused
  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);

  const display = focused ? draft : formatDisplay(draft);
  const prefix = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '';

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
          {prefix}
        </span>
      )}
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={display}
        placeholder={placeholder ?? '0.00'}
        disabled={disabled}
        className={prefix ? 'pl-7' : ''}
        onFocus={() => {
          setFocused(true);
          setDraft(value);
        }}
        onBlur={() => {
          setFocused(false);
          const cleaned = stripFormatting(draft);
          if (cleaned === '' || /^\d+(\.\d+)?$/.test(cleaned)) {
            onValueChange(cleaned);
          } else {
            setDraft(value);
          }
        }}
        onChange={(e) => setDraft(stripFormatting(e.target.value))}
      />
    </div>
  );
}
