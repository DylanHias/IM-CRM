'use client';

import { ACTIVITY_ICONS } from '@/components/activities/ActivityItem';
import { cn } from '@/lib/utils';
import type { Activity } from '@/types/entities';

const TYPES: Activity['type'][] = ['meeting', 'visit', 'call', 'note'];

interface Props {
  value: Activity['type'];
  onChange: (type: Activity['type']) => void;
  className?: string;
}

/** Two-by-two type buttons with each type's icon; the picked one takes its type colour. */
export function ActivityTypePicker({ value, onChange, className }: Props) {
  return (
    <div role="group" aria-label="Activity type" className={cn('grid grid-cols-2 gap-1.5', className)}>
      {TYPES.map((t) => {
        const { icon: Icon, colorClass, bgClass, label } = ACTIVITY_ICONS[t];
        const active = value === t;
        return (
          <button
            key={t}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(t)}
            className={cn(
              'flex h-9 items-center gap-2 rounded-md border border-border-strong bg-card px-2.5 text-[13px] font-medium text-foreground-2 transition-colors hover:bg-surface-2',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active && cn('border-current shadow-[inset_0_0_0_1px_currentColor] hover:bg-transparent', colorClass, bgClass),
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
