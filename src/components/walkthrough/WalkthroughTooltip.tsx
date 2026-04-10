'use client';

import { X } from 'lucide-react';
import type { TooltipRenderProps } from 'react-joyride';

export function WalkthroughTooltip({
  backProps,
  closeProps,
  continuous,
  index,
  isLastStep,
  primaryProps,
  size,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="bg-card text-card-foreground border border-border rounded-xl shadow-lg p-5 w-[320px]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex-1 min-w-0 pr-3">
          {step.title && (
            <h3 className="text-sm font-semibold text-foreground leading-snug">
              {step.title as React.ReactNode}
            </h3>
          )}
          <span className="text-[11px] text-muted-foreground">
            {index + 1} of {size}
          </span>
        </div>
        <button
          {...closeProps}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
          type="button"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
        {step.content as React.ReactNode}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <button
          {...skipProps}
          className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          type="button"
        >
          Skip tour
        </button>
        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="h-7 px-3 text-[12px] font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              type="button"
            >
              Back
            </button>
          )}
          {continuous && (
            <button
              {...primaryProps}
              className="h-7 px-3 text-[12px] font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              type="button"
            >
              {isLastStep ? 'Done' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
