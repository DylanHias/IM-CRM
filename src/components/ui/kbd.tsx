import * as React from 'react';
import { cn } from '@/lib/utils';

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(({ className, children, ...props }, ref) => (
  <kbd
    ref={ref}
    className={cn(
      'inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground',
      className
    )}
    {...props}
  >
    {children}
  </kbd>
));
Kbd.displayName = 'Kbd';

interface KbdGroupProps extends React.HTMLAttributes<HTMLSpanElement> {
  keys: string;
}

const KbdGroup = React.forwardRef<HTMLSpanElement, KbdGroupProps>(({ keys, className, ...props }, ref) => {
  const parts = keys.split('+');
  return (
    <Kbd ref={ref} className={className} {...props}>
      {parts.map((key, i) => (
        <span key={i} className="flex items-center">
          {i > 0 && <span className="mx-0.5 text-muted-foreground/60">+</span>}
          <span>{key}</span>
        </span>
      ))}
    </Kbd>
  );
});
KbdGroup.displayName = 'KbdGroup';

export { Kbd, KbdGroup };
