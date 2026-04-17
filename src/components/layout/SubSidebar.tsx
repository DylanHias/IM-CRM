'use client';

import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { underlineSpring } from '@/lib/motion';

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
  layoutIdPrefix?: string;
}

export function SubSidebar<T extends string>({
  tabs, activeTab, onTabChange, className, layoutIdPrefix = 'subsidebar',
}: SubSidebarProps<T>) {
  return (
    <nav className={cn('flex flex-col gap-0.5 min-w-[180px] flex-shrink-0', className)}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id as T)}
            className={cn(
              'relative flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium',
              'outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
              isActive
                ? 'text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors duration-150',
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`${layoutIdPrefix}-pill`}
                className="absolute inset-0 bg-sidebar-accent rounded-md -z-10"
                transition={underlineSpring}
              />
            )}
            <Icon size={15} className="shrink-0 relative z-10" />
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
