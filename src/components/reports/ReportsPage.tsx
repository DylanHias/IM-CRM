'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { ViewBar, ViewBarSeparator, ViewBarSpacer } from '@/components/ui/view-bar';
import { Segmented } from '@/components/ui/segmented';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LastRefreshedBadge } from '@/components/revenue/LastRefreshedBadge';
import { RefreshButton } from '@/components/revenue/RefreshButton';
import { KpiCards } from '@/components/insights/KpiCards';
import { ActivityMetrics } from '@/components/insights/ActivityMetrics';
import { ArrTrendChart } from '@/components/insights/ArrTrendChart';
import { NetSalesByVendorChart } from '@/components/insights/NetSalesByVendorChart';
import { RevenueCustomersPanel } from '@/components/reports/RevenueCustomersPanel';
import { PipelinePanel } from '@/components/analytics/PipelinePanel';
import { CustomersPanel } from '@/components/analytics/CustomersPanel';
import { PersonalPanel } from '@/components/analytics/PersonalPanel';
import { ActivityPanel } from '@/components/analytics/ActivityPanel';
import { PeriodPicker } from '@/components/analytics/PeriodPicker';
import { type Region, REGION_COUNTRIES, REGION_LABELS } from '@/lib/revenue/region';
import type { PeriodKey } from '@/types/analytics';

export type ReportsTab = 'revenue' | 'pipeline' | 'customers' | 'me';

const TABS: { value: ReportsTab; label: string }[] = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'customers', label: 'Customers' },
  { value: 'me', label: 'My activity' },
];

const isTab = (v: string | null): v is ReportsTab => TABS.some((t) => t.value === v);

/** Revenue Overview, Insights and Analytics together as one Reports page with four tabs. */
export function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const param = searchParams.get('tab');
  const [tab, setTab] = useState<ReportsTab>(isTab(param) ? param : 'revenue');
  const [region, setRegion] = useState<Region>('BENELUX');
  const [monthsBack, setMonthsBack] = useState(12);
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [refreshKey, setRefreshKey] = useState(0);

  const countryCodes = useMemo(() => REGION_COUNTRIES[region], [region]);
  const scopeLabel = REGION_LABELS[region];

  const changeTab = (t: ReportsTab) => {
    setTab(t);
    router.replace(t === 'revenue' ? '/revenue-overview' : `/revenue-overview?tab=${t}`);
  };

  const refresh = (
    <Button variant="outline" onClick={() => setRefreshKey((k) => k + 1)}>
      <RefreshCw size={13} />
      Refresh
    </Button>
  );

  return (
    <div className="grid content-start gap-3">
      <ViewBar title="Reports">
        <ViewBarSeparator />
        <Segmented<ReportsTab> aria-label="Report" value={tab} onChange={changeTab} options={TABS} />
        <ViewBarSpacer />
        {tab === 'revenue' && (
          <>
            <Select value={region} onValueChange={(v) => setRegion(v as Region)}>
              <SelectTrigger className="w-[140px]" aria-label="Region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(REGION_LABELS) as Region[]).map((r) => (
                  <SelectItem key={r} value={r}>{REGION_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Segmented
              aria-label="Period"
              value={String(monthsBack)}
              onChange={(v) => setMonthsBack(Number(v))}
              options={[6, 12, 18, 24].map((m) => ({ value: String(m), label: `${m}M`, title: `Last ${m} months` }))}
            />
            <LastRefreshedBadge />
            <RefreshButton />
          </>
        )}
        {tab === 'me' && <PeriodPicker value={period} onChange={setPeriod} />}
        {(tab === 'pipeline' || tab === 'customers' || tab === 'me') && refresh}
      </ViewBar>

      {tab === 'revenue' && (
        <>
          <KpiCards currency="LC" region={region} />
          <ActivityMetrics region={region} monthsBack={monthsBack} />
          <div className="grid items-start gap-3 xl:grid-cols-2">
            <ArrTrendChart monthsBack={monthsBack} countryCodes={countryCodes} scopeLabel={scopeLabel} />
            <NetSalesByVendorChart monthsBack={monthsBack} countryCodes={countryCodes} scopeLabel={scopeLabel} />
          </div>
          <RevenueCustomersPanel />
        </>
      )}
      {tab === 'pipeline' && <PipelinePanel refreshKey={refreshKey} />}
      {tab === 'customers' && <CustomersPanel refreshKey={refreshKey} />}
      {tab === 'me' && (
        <>
          <PersonalPanel period={period} refreshKey={refreshKey} />
          <ActivityPanel period={period} refreshKey={refreshKey} />
        </>
      )}
    </div>
  );
}
