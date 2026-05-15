'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { sectionReveal } from '@/lib/motion';
import { CurrencyToggle } from '@/components/revenue/CurrencyToggle';
import { LastRefreshedBadge } from '@/components/revenue/LastRefreshedBadge';
import { RefreshButton } from '@/components/revenue/RefreshButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { KpiCards } from './KpiCards';
import { TopCustomersTable } from './TopCustomersTable';
import { ArrTrendChart } from './ArrTrendChart';
import type { Currency } from '@/lib/revenue/effectiveArr';

const MONTHS_OPTIONS = [
  { value: '6', label: 'Last 6 months' },
  { value: '12', label: 'Last 12 months' },
  { value: '18', label: 'Last 18 months' },
  { value: '24', label: 'Last 24 months' },
] as const;

const TOP_N_OPTIONS = [
  { value: '10', label: 'Top 10' },
  { value: '25', label: 'Top 25' },
  { value: '50', label: 'Top 50' },
  { value: '100', label: 'Top 100' },
] as const;

export function InsightsPageContent() {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [monthsBack, setMonthsBack] = useState<number>(12);
  const [topN, setTopN] = useState<number>(25);

  return (
    <div className="space-y-4">
      <motion.div {...sectionReveal(0)}>
        <h2 className="text-xl font-semibold text-foreground">Insights</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Org-wide revenue performance across the Benelux customer base.
        </p>
      </motion.div>

      <motion.div className="flex flex-wrap items-center gap-3" {...sectionReveal(0.05)}>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Currency</Label>
          <CurrencyToggle value={currency} onChange={setCurrency} />
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

        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Top N</Label>
          <Select value={String(topN)} onValueChange={(v) => setTopN(Number(v))}>
            <SelectTrigger className="h-9 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOP_N_OPTIONS.map((opt) => (
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
        <KpiCards currency={currency} />
      </motion.div>

      <motion.div {...sectionReveal(0.15)}>
        <ArrTrendChart monthsBack={monthsBack} />
      </motion.div>

      <motion.div {...sectionReveal(0.2)}>
        <TopCustomersTable currency={currency} limit={topN} />
      </motion.div>
    </div>
  );
}
