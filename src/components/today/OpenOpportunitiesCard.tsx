'use client';

import { useRouter } from 'next/navigation';
import { Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOpportunityListStore } from '@/store/opportunityListStore';
import { cn } from '@/lib/utils';

function fmtEur(n: number): string {
  return `€${n.toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const STAGE_COLOR: Record<string, string> = {
  Prospecting: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Validated: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Qualified: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  'Verbal Received': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'Contract Received': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  Purchased: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
};

export function OpenOpportunitiesCard() {
  const router = useRouter();
  const opportunities = useOpportunityListStore((s) => s.opportunities);
  const customerMap = useOpportunityListStore((s) => s.customerMap);

  const open = opportunities
    .filter((o) => o.status === 'Open')
    .sort((a, b) => (b.estimatedRevenue ?? 0) - (a.estimatedRevenue ?? 0))
    .slice(0, 8);

  if (open.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Target size={14} className="text-muted-foreground" />
          Open Opportunities
          <span className="ml-auto text-xs font-normal text-muted-foreground">{open.length} shown</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1.5">
          {open.map((o) => {
            const company = customerMap.get(o.customerId) ?? '';
            const stageClass = STAGE_COLOR[o.stage] ?? 'bg-muted text-muted-foreground';
            return (
              <div
                key={o.id}
                onClick={() => router.push(`/opportunities?id=${o.id}`)}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent cursor-pointer transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{o.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{company}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-md', stageClass)}>
                    {o.stage}
                  </span>
                  {o.estimatedRevenue != null && (
                    <span className="text-xs font-medium tabular-nums text-right min-w-[70px]">
                      {fmtEur(o.estimatedRevenue)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
