'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/** Element above the page's scroll area that ViewBars render into (provided by AppShell). */
const ViewBarSlotContext = React.createContext<HTMLElement | null>(null);

interface ViewBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  meta?: React.ReactNode;
}

/** Page toolbar: 48px bar with the page title, optional meta text and actions. Stays fixed while the page scrolls. */
const ViewBar = React.forwardRef<HTMLDivElement, ViewBarProps>(({ title, meta, className, children, ...props }, ref) => {
  const slot = React.useContext(ViewBarSlotContext);
  const bar = (
    <div
      ref={ref}
      className={cn(
        'flex h-12 items-center gap-2 overflow-x-auto overflow-y-hidden border-b border-border bg-card px-4 [scrollbar-width:none] [&>*]:shrink-0',
        className,
      )}
      {...props}
    >
      <h1 className="whitespace-nowrap text-[15px] font-semibold tracking-[-0.01em]">{title}</h1>
      {meta && <span className="!shrink truncate text-xs text-muted-foreground">{meta}</span>}
      {children}
    </div>
  );
  return slot ? createPortal(bar, slot) : bar;
});
ViewBar.displayName = 'ViewBar';

/** Pushes the following ViewBar items to the right. */
const ViewBarSpacer = () => <span className="!shrink flex-1" aria-hidden />;
ViewBarSpacer.displayName = 'ViewBarSpacer';

/** Thin vertical divider between ViewBar groups. */
const ViewBarSeparator = () => <span className="mx-1 h-5 w-px bg-border" aria-hidden />;
ViewBarSeparator.displayName = 'ViewBarSeparator';

export { ViewBar, ViewBarSpacer, ViewBarSeparator, ViewBarSlotContext };
