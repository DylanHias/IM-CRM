'use client';

import { Badge } from '@/components/ui/badge';
import { ExpiryLabel } from '@/components/opportunities/OpportunityBadges';
import { OpportunityContextMenu } from '@/components/opportunities/OpportunityContextMenu';
import { STAGES, STAGE_PROBABILITY } from '@/lib/opportunityRules';
import { compactMoney } from '@/lib/opportunities/display';
import { cn } from '@/lib/utils';
import type { Opportunity } from '@/types/entities';

interface Props {
  opportunities: Opportunity[];
  customerMap: Map<string, string>;
  onOpen: (o: Opportunity) => void;
  onCloseAs: (o: Opportunity, outcome: 'Won' | 'Lost') => void;
  /** Show only this stage's column. */
  stage: string | null;
}

/** Kanban-style board: one column per stage with its deals. Lost deals are left out. */
export function PipelineBoard({ opportunities, customerMap, onOpen, onCloseAs, stage }: Props) {
  const live = opportunities.filter((o) => o.status !== 'Lost');
  const columns = STAGES.filter((s) => !stage || s === stage).map((s) => {
    const items = live.filter((o) => o.stage === s);
    return { stage: s, items, sum: items.reduce((a, o) => a + (o.estimatedRevenue ?? 0), 0) };
  });
  const max = Math.max(...columns.map((c) => c.sum), 1);

  return (
    <div className="grid h-full min-h-[360px] auto-cols-[264px] grid-flow-col gap-2.5 overflow-x-auto px-4 py-3">
      {columns.map((c) => (
        <section key={c.stage} aria-label={c.stage} className="grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] rounded-[9px] border border-border bg-sunken">
          <div className="flex items-center gap-2 px-2.5 pb-1.5 pt-2">
            <h2 className="truncate text-xs font-semibold">{c.stage}</h2>
            <span className="text-[11px] text-faint">{STAGE_PROBABILITY[c.stage]}%</span>
            <span className="ml-auto text-[11.5px] tabular-nums text-muted-foreground">{c.items.length} · {compactMoney(c.sum)}</span>
          </div>
          <div className="mx-2.5 mb-2 h-[3px] overflow-hidden rounded-full bg-border">
            <i className="block h-full bg-primary" style={{ width: `${(c.sum / max) * 100}%` }} />
          </div>
          <div className="grid min-h-0 content-start gap-1.5 overflow-y-auto px-2 pb-2">
            {c.items.length === 0 && <p className="px-1 text-[11px] text-faint">No deals</p>}
            {c.items.map((o) => (
              <OpportunityContextMenu key={o.id} opportunity={o} onOpen={() => onOpen(o)} onCloseAs={(out) => onCloseAs(o, out)}>
                <button
                  type="button"
                  onClick={() => onOpen(o)}
                  className={cn(
                    'grid gap-1.5 rounded-md border bg-card px-2.5 py-2 text-left transition-colors hover:border-border-strong',
                    o.stage === 'Billing Rejection' ? 'border-destructive' : 'border-border',
                  )}
                >
                  <b className="text-[13px] font-medium leading-snug">{o.subject}</b>
                  <span className="truncate text-[11px] text-muted-foreground">{customerMap.get(o.customerId) ?? ''}</span>
                  <div className="flex items-center justify-between gap-2">
                    {o.primaryVendor ? <Badge variant="secondary" className="max-w-[60%] truncate">{o.primaryVendor.split(' - ')[0]}</Badge> : <span />}
                    <span className="whitespace-nowrap font-semibold tabular-nums">{compactMoney(o.estimatedRevenue, o.currency)}</span>
                  </div>
                  {o.status === 'Open' && <ExpiryLabel date={o.expirationDate} />}
                </button>
              </OpportunityContextMenu>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
