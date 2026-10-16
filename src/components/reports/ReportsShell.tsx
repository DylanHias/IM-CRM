'use client';

import { useState } from 'react';
import { ViewBar, ViewBarSeparator, ViewBarSpacer } from '@/components/ui/view-bar';
import { Segmented } from '@/components/ui/segmented';
import { EmptyState } from '@/components/ui/empty-state';
import { Panel } from '@/components/ui/panel';
import { ReportControls, type ReportFilters } from '@/components/reports/ReportControls';

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

// ponytail: placeholders; Tasks 9-12 each replace one with its real tab taking the same props.
function Placeholder({ label }: TabProps & { label: string }) {
  return (
    <Panel className="grid lg:min-h-0 lg:flex-1 place-items-center">
      <EmptyState title={`${label} lands next`} />
    </Panel>
  );
}

const TAB_PANELS: Record<ReportTab, (p: TabProps) => React.ReactNode> = {
  growth: (p) => <Placeholder label="Growth" {...p} />,
  pipeline: (p) => <Placeholder label="Pipeline" {...p} />,
  accounts: (p) => <Placeholder label="Accounts" {...p} />,
  activity: (p) => <Placeholder label="Activity" {...p} />,
};

export function ReportsShell() {
  const [tab, setTab] = useState<ReportTab>('growth');
  const [filters, setFilters] = useState<ReportFilters>({ scope: 'mine', region: 'BENELUX', period: { kind: 'rolling', months: 12 } });

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <ViewBar title="Reports">
        <ViewBarSeparator />
        <Segmented<ReportTab> aria-label="Report" value={tab} onChange={setTab} options={TABS} />
        <ViewBarSpacer />
        <ReportControls filters={filters} onChange={setFilters} />
      </ViewBar>
      {/* Each tab owns its tile strip (natural height) and a content area that takes lg:flex-1 lg:min-h-0. */}
      <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1">{TAB_PANELS[tab]({ filters })}</div>
    </div>
  );
}
