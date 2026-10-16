import { ACTIVITY_ICONS } from '@/components/activities/ActivityItem';
import { cn } from '@/lib/utils';
import type { Activity } from '@/types/entities';

interface Props {
  type: Activity['type'];
  size?: 'sm' | 'md';
  className?: string;
}

/** Rounded tile with the activity type's icon in its type colour. */
export function ActivityTypeIcon({ type, size = 'md', className }: Props) {
  const { icon: Icon, colorClass, bgClass, label } = ACTIVITY_ICONS[type];
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-[7px]', size === 'md' ? 'size-[26px]' : 'size-[22px]', colorClass, bgClass, className)}
      title={label}
    >
      <Icon size={size === 'md' ? 14 : 12} />
    </span>
  );
}
