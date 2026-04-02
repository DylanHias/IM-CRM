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
} from 'lucide-react';
import { SubSidebar } from '@/components/layout/SubSidebar';
import { ScrollArea } from '@/components/ui/scroll-area';

import gettingStarted from '../../../../docs/help/getting-started.md';
import customers from '../../../../docs/help/customers.md';
import activities from '../../../../docs/help/activities.md';
import followUps from '../../../../docs/help/follow-ups.md';
import contacts from '../../../../docs/help/contacts.md';
import opportunities from '../../../../docs/help/opportunities.md';
import arrOverview from '../../../../docs/help/arr-overview.md';
import sync from '../../../../docs/help/sync.md';
import settings from '../../../../docs/help/settings.md';
import shortcuts from '../../../../docs/help/shortcuts.md';

const TABS = [
  { id: 'getting-started', label: 'Getting Started', icon: Rocket },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'activities', label: 'Activities', icon: Calendar },
  { id: 'follow-ups', label: 'Follow-Ups', icon: CheckSquare },
  { id: 'contacts', label: 'Contacts', icon: Contact },
  { id: 'opportunities', label: 'Opportunities', icon: Target },
  { id: 'arr-overview', label: 'ARR Overview', icon: BarChart2 },
  { id: 'sync', label: 'Sync', icon: RefreshCw },
  { id: 'settings', label: 'Settings', icon: Settings2 },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
] as const;

type TabId = (typeof TABS)[number]['id'];

const CONTENT: Record<TabId, string> = {
  'getting-started': gettingStarted,
  customers,
  activities,
  'follow-ups': followUps,
  contacts,
  opportunities,
  'arr-overview': arrOverview,
  sync,
  settings,
  shortcuts,
};

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<TabId>('getting-started');

  return (
    <div>
      <h1 className="text-lg font-semibold mb-6">Help</h1>
      <div className="flex gap-8 min-h-0">
        <SubSidebar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} className="min-w-[200px]" />
        <ScrollArea className="flex-1 min-w-0 max-h-[calc(100vh-160px)]">
          <article className="prose prose-sm dark:prose-invert prose-headings:font-semibold prose-h1:text-xl prose-h1:mb-4 prose-h2:text-base prose-h2:mt-6 prose-h2:mb-2 prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-1 prose-p:text-[13px] prose-p:leading-relaxed prose-li:text-[13px] prose-ul:my-2 prose-ol:my-2 prose-strong:text-foreground max-w-[720px]">
            <Markdown>{CONTENT[activeTab]}</Markdown>
          </article>
        </ScrollArea>
      </div>
    </div>
  );
}
