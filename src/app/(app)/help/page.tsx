'use client';

import { useState } from 'react';
import Markdown from 'react-markdown';
import {
  Rocket,
  Users,
  Calendar,
  CheckSquare,
  Contact,
  Target,
  BarChart2,
  RefreshCw,
  Settings2,
  Keyboard,
  LineChart,
  CalendarClock,
  LayoutDashboard,
} from 'lucide-react';
import { SubSidebar } from '@/components/layout/SubSidebar';
import { AnimatedTabPanels } from '@/components/layout/AnimatedTabPanels';
import { ViewBar } from '@/components/ui/view-bar';
import { FullBleed } from '@/components/ui/full-bleed';

import today from '../../../../docs/help/today.md';
import gettingStarted from '../../../../docs/help/getting-started.md';
import customers from '../../../../docs/help/customers.md';
import activities from '../../../../docs/help/activities.md';
import followUps from '../../../../docs/help/follow-ups.md';
import contacts from '../../../../docs/help/contacts.md';
import opportunities from '../../../../docs/help/opportunities.md';
import revenueOverview from '../../../../docs/help/revenue-overview.md';
import analytics from '../../../../docs/help/analytics.md';
import sync from '../../../../docs/help/sync.md';
import settings from '../../../../docs/help/settings.md';
import timeline from '../../../../docs/help/timeline.md';
import shortcuts from '../../../../docs/help/shortcuts.md';

const TABS = [
  { id: 'getting-started', label: 'Getting Started', icon: Rocket, dividerAfter: true },
  { id: 'today', label: 'Home', icon: LayoutDashboard },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'opportunities', label: 'Pipeline', icon: Target },
  { id: 'timeline', label: 'Activity', icon: CalendarClock },
  { id: 'revenue-overview', label: 'Reports', icon: BarChart2, dividerAfter: true },
  { id: 'activities', label: 'Activities', icon: Calendar },
  { id: 'follow-ups', label: 'Follow-Ups', icon: CheckSquare },
  { id: 'contacts', label: 'Contacts', icon: Contact },
  { id: 'analytics', label: 'Report tabs', icon: LineChart },
  { id: 'sync', label: 'Sync', icon: RefreshCw },
  { id: 'settings', label: 'Settings', icon: Settings2 },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
] as const;

type TabId = (typeof TABS)[number]['id'];

const CONTENT: Record<TabId, string> = {
  today,
  'getting-started': gettingStarted,
  customers,
  activities,
  'follow-ups': followUps,
  contacts,
  opportunities,
  'revenue-overview': revenueOverview,
  analytics,
  sync,
  settings,
  timeline,
  shortcuts,
};

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<TabId>('getting-started');

  return (
    <>
      <ViewBar title="Help" />
      <FullBleed className="grid grid-cols-[200px_minmax(0,1fr)] max-md:grid-cols-1 max-md:grid-rows-[auto_minmax(0,1fr)]">
        <SubSidebar aria-label="Help topics" tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="min-h-0 overflow-y-auto px-[var(--page-px)] pb-10 pt-[var(--page-pt)]">
          <AnimatedTabPanels activeKey={activeTab}>
            <article className="prose prose-sm max-w-[720px] select-text dark:prose-invert prose-headings:font-semibold prose-headings:tracking-[-0.01em] prose-h1:mb-4 prose-h1:text-[22px] prose-h2:mb-2 prose-h2:mt-7 prose-h2:text-[15px] prose-h3:mb-1 prose-h3:mt-5 prose-h3:text-[13.5px] prose-p:text-[13.5px] prose-p:leading-[1.65] prose-p:text-foreground-2 prose-a:text-accent-foreground prose-strong:text-foreground prose-ol:my-2 prose-ul:my-2 prose-li:text-[13.5px] prose-li:text-foreground-2">
              <Markdown>{CONTENT[activeTab]}</Markdown>
            </article>
          </AnimatedTabPanels>
        </div>
      </FullBleed>
    </>
  );
}
