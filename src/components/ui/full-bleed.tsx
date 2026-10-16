import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Cancels the AppShell page padding so a page can fill the whole sheet edge to edge
 * (split views with their own scrolling panes).
 */
const FullBleed = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      '-mx-[var(--page-px)] -mb-[var(--page-pb)] -mt-[var(--page-pt)] h-[calc(100%+var(--page-pt)+var(--page-pb))] min-h-0',
      className,
    )}
    {...props}
  />
));
FullBleed.displayName = 'FullBleed';

export { FullBleed };
