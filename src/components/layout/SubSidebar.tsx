'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  dividerAfter?: boolean;
}

interface SubSidebarProps<T extends string> {
  tabs: readonly Tab[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  className?: string;
  'aria-label'?: string;
}

/** Secondary navigation column for pages with their own sections (Help). Becomes a scrolling row on narrow windows. */
export function SubSidebar<T extends string>({ tabs, activeTab, onTabChange, className, ...props }: SubSidebarProps<T>) {
  return (
    <nav
      aria-label={props['aria-label']}
      className={cn(
        'flex min-h-0 flex-col gap-px overflow-y-auto border-r border-border bg-card p-2 max-md:flex-row max-md:overflow-x-auto max-md:border-b max-md:border-r-0',
        className,
      )}
    >
      {tabs.map(({ id, label, icon: Icon, dividerAfter }) => {
        const isActive = activeTab === id;
        return (
          <div key={id} className="contents">
            <button
              type="button"
              onClick={() => onTabChange(id as T)}
              aria-current={isActive ? 'page' : undefined}
              data-active={isActive}
              className={cn(
                'relative flex h-8 w-full shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors max-md:w-auto',
                'outline-none hover:bg-sunken hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
                'before:absolute before:left-0 before:top-1/2 before:-mt-2 before:h-4 before:w-[3px] before:rounded-full before:bg-primary before:opacity-0 before:transition-opacity data-[active=true]:before:opacity-100',
                isActive && 'bg-sunken text-foreground',
              )}
            >
              <Icon size={15} className="shrink-0" />
              <span className="truncate">{label}</span>
            </button>
            {dividerAfter && <hr className="mx-1 my-1.5 border-border max-md:hidden" />}
          </div>
        );
      })}
    </nav>
  );
}
