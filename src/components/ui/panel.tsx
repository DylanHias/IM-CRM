import * as React from 'react';
import { cn } from '@/lib/utils';

const Panel = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ className, ...props }, ref) => (
  <section
    ref={ref}
    className={cn('min-w-0 overflow-hidden rounded-[calc(var(--radius)*1.5)] border border-border bg-card', className)}
    {...props}
  />
));
Panel.displayName = 'Panel';

interface PanelHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  sub?: React.ReactNode;
}

const PanelHeader = React.forwardRef<HTMLDivElement, PanelHeaderProps>(({ title, sub, className, children, ...props }, ref) => (
  <div ref={ref} className={cn('flex min-h-[38px] items-center gap-2 border-b border-border px-3 py-1', className)} {...props}>
    <h2 className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-[12.5px] font-semibold">{title}</h2>
    {sub && <span className="shrink-0 text-xs text-muted-foreground">{sub}</span>}
    {children}
  </div>
));
PanelHeader.displayName = 'PanelHeader';

const PanelBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-3', className)} {...props} />
));
PanelBody.displayName = 'PanelBody';

/** Small text button used in panel headers ("Open timeline"). */
const PanelLink = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn('shrink-0 text-xs font-medium text-accent-foreground hover:underline', className)}
      {...props}
    />
  ),
);
PanelLink.displayName = 'PanelLink';

export { Panel, PanelHeader, PanelBody, PanelLink };
