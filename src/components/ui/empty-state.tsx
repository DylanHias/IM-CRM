import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, className, children, ...props }: Props) {
  return (
    <div className={cn('grid place-items-center gap-1.5 px-4 py-7 text-center text-[12.5px] text-muted-foreground', className)} {...props}>
      {Icon && <Icon size={20} className="text-faint" />}
      <b className="text-[13px] font-medium text-foreground-2">{title}</b>
      {description && <span>{description}</span>}
      {children}
    </div>
  );
}
