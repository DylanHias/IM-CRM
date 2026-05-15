'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { sectionReveal } from '@/lib/motion';
import { LastRefreshedBadge } from '@/components/revenue/LastRefreshedBadge';
import { RefreshButton } from '@/components/revenue/RefreshButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { KpiCards } from './KpiCards';
import { ActivityMetrics } from './ActivityMetrics';
import { TopCustomersTable } from './TopCustomersTable';
import { ArrTrendChart } from './ArrTrendChart';
import { NetSalesByVendorChart } from './NetSalesByVendorChart';
import { type Region, REGION_COUNTRIES, REGION_LABELS } from '@/lib/revenue/region';

const MONTHS_OPTIONS = [
  { value: '6', label: 'Last 6 months' },
  { value: '12', label: 'Last 12 months' },
  { value: '18', label: 'Last 18 months' },
  { value: '24', label: 'Last 24 months' },
] as const;

const REGION_OPTIONS: { value: Region; label: string }[] = [
  { value: 'BENELUX', label: REGION_LABELS.BENELUX },
  { value: 'BE', label: REGION_LABELS.BE },
  { value: 'NL', label: REGION_LABELS.NL },
  { value: 'LU', label: REGION_LABELS.LU },
];

export function InsightsPageContent() {
  const [region, setRegion] = useState<Region>('BENELUX');
  const [monthsBack, setMonthsBack] = useState<number>(12);

  const countryCodes = useMemo(() => REGION_COUNTRIES[region], [region]);
  const scopeLabel = REGION_LABELS[region];

  return (
    <div className="space-y-4">
      <motion.div {...sectionReveal(0)}>
        <h2 className="text-xl font-semibold text-foreground">Insights</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Revenue performance across {scopeLabel.toLowerCase()}.
        </p>
      </motion.div>

      <motion.div className="flex flex-wrap items-center gap-3" {...sectionReveal(0.05)}>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Region</Label>
          <Select value={region} onValueChange={(v) => setRegion(v as Region)}>
            <SelectTrigger className="h-9 w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Period</Label>
          <Select value={String(monthsBack)} onValueChange={(v) => setMonthsBack(Number(v))}>
            <SelectTrigger className="h-9 w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <LastRefreshedBadge />
          <RefreshButton />
        </div>
      </motion.div>

      <motion.div {...sectionReveal(0.1)}>
        <KpiCards currency="LC" region={region} />
      </motion.div>

      <motion.div {...sectionReveal(0.12)}>
        <ActivityMetrics region={region} monthsBack={monthsBack} />
      </motion.div>

      <motion.div {...sectionReveal(0.15)}>
        <ArrTrendChart monthsBack={monthsBack} countryCodes={countryCodes} scopeLabel={scopeLabel} />
      </motion.div>

      <motion.div {...sectionReveal(0.18)}>
        <NetSalesByVendorChart
          monthsBack={monthsBack}
          countryCodes={countryCodes}
          scopeLabel={scopeLabel}
        />
      </motion.div>

      <motion.div {...sectionReveal(0.2)}>
        <TopCustomersTable currency="LC" region={region} />
      </motion.div>
    </div>
  );
}
