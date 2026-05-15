'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { sectionReveal } from '@/lib/motion';
import { LastRefreshedBadge } from '@/components/revenue/LastRefreshedBadge';
import { RefreshButton } from '@/components/revenue/RefreshButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrSummaryCard } from './ArrSummaryCard';
import { ArrMovementChart } from './ArrMovementChart';
import { useCustomerRevenue } from '@/hooks/useCustomerRevenue';
import { cn } from '@/lib/utils';
import type { Customer } from '@/types/entities';

interface Props {
  customer: Customer;
}

const MONTHS_OPTIONS = [
  { value: '3', label: 'Last 3 months' },
  { value: '6', label: 'Last 6 months' },
  { value: '12', label: 'Last 12 months' },
  { value: '24', label: 'Last 24 months' },
] as const;

export function RevenueTabContent({ customer }: Props) {
  const [monthsBack, setMonthsBack] = useState<number>(12);
  const revenue = useCustomerRevenue(customer.bcn, customer.accountNumber);

  return (
    <div className="space-y-4">
      <motion.div className="flex flex-wrap items-center gap-3" {...sectionReveal(0)}>
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

      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4" {...sectionReveal(0.05)}>
        <div className="space-y-4">
          <ArrSummaryCard customer={customer} currency="LC" />
          <ActiveEndCustomersCard count={revenue?.activeEndCustomers ?? null} />
        </div>
        <div className="md:col-span-2">
          <ArrMovementChart
            bcn={customer.bcn}
            monthsBack={monthsBack}
            currency="LC"
            currencyCode={revenue?.currencyCode ?? customer.arrCurrency ?? null}
          />
        </div>
      </motion.div>
    </div>
  );
}

function ActiveEndCustomersCard({ count, className }: { count: number | null; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-3',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Users size={13} />
        Active end customers
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums text-foreground">
          {count === null ? '—' : count.toLocaleString('nl-BE')}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        {count === null
          ? 'No revenue data yet — refresh in Admin → Revenue Sync'
          : 'End customers with active ARR this month'}
      </div>
    </div>
  );
}
