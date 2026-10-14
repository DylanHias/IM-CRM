import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[13px] font-medium ring-offset-background transition-[background-color,border-color,color,box-shadow,transform,filter] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border border-primary bg-primary text-primary-foreground shadow-[0_1px_1px_rgb(0_0_0/0.06)] hover:brightness-110',
        destructive: 'border border-destructive bg-destructive text-destructive-foreground hover:brightness-110',
        outline: 'border border-border-strong bg-card text-foreground shadow-[0_1px_1px_rgb(0_0_0/0.04)] hover:bg-surface-2 active:bg-sunken',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-chrome-hover',
        ghost: 'text-foreground-2 hover:bg-sunken hover:text-foreground',
        link: 'text-accent-foreground underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-[30px] px-[11px]',
        sm: 'h-[26px] px-[9px] text-xs',
        lg: 'h-9 px-5',
        icon: 'h-[30px] w-[30px]',
        xs: 'h-6 px-2 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
