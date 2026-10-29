'use client';

import { useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ViewBar, ViewBarSeparator, ViewBarSpacer } from '@/components/ui/view-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { Panel } from '@/components/ui/panel';
import { ReportControls, type ReportFilters } from '@/components/reports/ReportControls';
import { GrowthTab } from '@/components/reports/tabs/GrowthTab';
import { PipelineTab } from '@/components/reports/tabs/PipelineTab';
import { AccountsTab } from '@/components/reports/tabs/AccountsTab';

type ReportTab = 'growth' | 'pipeline' | 'accounts' | 'activity';

const TABS: { value: ReportTab; label: string }[] = [
  { value: 'growth', label: 'Growth' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'activity', label: 'Activity' },
];

interface TabProps {
  filters: ReportFilters;
}

// ponytail: placeholder; Task 12 replaces it with the real Activity tab taking the same props.
function Placeholder({ label }: TabProps & { label: string }) {
  return (
    <Panel className="grid lg:min-h-0 lg:flex-1 place-items-center">
      <EmptyState title={`${label} lands next`} />
    </Panel>
  );
}

const TAB_PANELS: Record<ReportTab, (p: TabProps) => ReactNode> = {
  growth: (p) => <GrowthTab {...p} />,
  pipeline: (p) => <PipelineTab {...p} />,
  accounts: (p) => <AccountsTab {...p} />,
  activity: (p) => <Placeholder label="Activity" {...p} />,
};

const isTab = (v: string | null): v is ReportTab => TABS.some((t) => t.value === v);

export function ReportsShell() {
  const router = useRouter();
  const param = useSearchParams().get('tab');
  const [tab, setTab] = useState<ReportTab>(isTab(param) ? param : 'growth');
  const [filters, setFilters] = useState<ReportFilters>({ scope: 'mine', region: 'BENELUX', period: { kind: 'rolling', months: 12 } });

  const changeTab = (t: ReportTab) => {
    setTab(t);
    router.replace(t === 'growth' ? '/revenue-overview' : `/revenue-overview?tab=${t}`);
  };
  // Country only applies to Team; drop it on the way back to Mine so tabs never see a stale one.
  const changeFilters = (next: ReportFilters) => setFilters(next.scope === 'mine' ? { ...next, region: 'BENELUX' } : next);

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <ViewBar title="Reports">
        <ViewBarSeparator />
        <div role="tablist" aria-label="Report" className="inline-flex shrink-0 rounded-md border border-border-strong bg-card p-0.5">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              id={`report-tab-${t.value}`}
              aria-selected={tab === t.value}
              aria-controls="report-panel"
              onClick={() => changeTab(t.value)}
              className="inline-flex h-6 items-center whitespace-nowrap rounded px-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
            >
              {t.label}
            </button>
          ))}
        </div>
        <ViewBarSpacer />
        <ReportControls filters={filters} onChange={changeFilters} />
      </ViewBar>
      {/* Each tab owns its tile strip (natural height) and a content area that takes lg:flex-1 lg:min-h-0. */}
      <div role="tabpanel" id="report-panel" aria-labelledby={`report-tab-${tab}`} className="flex flex-col gap-3 lg:min-h-0 lg:flex-1">
        {TAB_PANELS[tab]({ filters })}
      </div>
    </div>
  );
}
