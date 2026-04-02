'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SubSidebarProps<T extends string> {
  tabs: readonly Tab[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  className?: string;
}

export function SubSidebar<T extends string>({ tabs, activeTab, onTabChange, className }: SubSidebarProps<T>) {
  return (
    <nav className={cn('flex flex-col gap-0.5 min-w-[180px] flex-shrink-0', className)}>
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id as T)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150',
            'outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
            activeTab === id
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          )}
        >
          <Icon size={15} className="shrink-0" />
          {label}
        </button>
      ))}
    </nav>
  );
}
