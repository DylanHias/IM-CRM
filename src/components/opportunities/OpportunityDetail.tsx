'use client';

import { useRouter } from 'next/navigation';
import { Building2, Pencil, ThumbsDown, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel, PanelHeader, PanelBody } from '@/components/ui/panel';
import { MetricStrip, Metric } from '@/components/ui/metric-strip';
import { ExpiryLabel, OpportunityStatusBadge } from '@/components/opportunities/OpportunityBadges';
import { ActivityTypeIcon } from '@/components/activities/ActivityTypeIcon';
import { useActivities } from '@/hooks/useActivities';
import { useCustomerStore } from '@/store/customerStore';
import { STAGES } from '@/lib/opportunityRules';
import { formatCurrency } from '@/lib/utils/currencyUtils';
import { formatDisplayName } from '@/lib/utils/nameUtils';
import { weightedValue } from '@/lib/opportunities/display';
import { cn } from '@/lib/utils';
import type { Opportunity } from '@/types/entities';

interface Props {
  opportunity: Opportunity;
  companyName: string;
  onEdit: () => void;
  onCloseAs: (outcome: 'Won' | 'Lost') => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 select-text break-words">{children ?? '—'}</dd>
    </>
  );
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

/** Read-only overview of one opportunity for the pipeline's detail pane. */
export function OpportunityDetail({ opportunity: o, companyName, onEdit, onCloseAs }: Props) {
  const router = useRouter();
  const contact = useCustomerStore((s) => (o.contactId ? s.allContacts.find((c) => c.id === o.contactId) : undefined));
  const { activities } = useActivities(o.customerId);
  const latest = [...activities].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 2);
  const money = (v: number | null) => (v === null ? '—' : formatCurrency(v, o.currency, { locale: 'nl-BE' }));
  const current = STAGES.indexOf(o.stage as (typeof STAGES)[number]);
  const steps = STAGES.filter((s) => s !== 'Billing Rejection' || o.stage === s);

  return (
    <div className="grid max-w-[900px] content-start gap-3 px-5 pb-7 pt-4">
      <div className="flex items-start gap-2">
        <div className="grid min-w-0 flex-1 gap-1">
          <span className="text-[11px] text-faint">
            {[o.opportunityNumber, o.createdByName && `created by ${formatDisplayName(o.createdByName)}`].filter(Boolean).join(' · ')}
          </span>
          <h2 className="text-lg font-semibold tracking-[-0.015em]">{o.subject}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <OpportunityStatusBadge status={o.status} />
            <button type="button" onClick={() => router.push(`/customers?id=${o.customerId}`)} className="inline-flex items-center gap-1 text-xs font-medium text-accent-foreground hover:underline">
              <Building2 size={11} /> {companyName}
            </button>
            {o.status === 'Open' && <ExpiryLabel date={o.expirationDate} />}
          </div>
        </div>
        <Button variant="outline" onClick={onEdit}>
          <Pencil size={13} /> Edit
        </Button>
        {o.status === 'Open' && (
          <>
            <Button variant="outline" className="text-success" onClick={() => onCloseAs('Won')}>
              <Trophy size={13} /> Won
            </Button>
            <Button variant="outline" className="text-destructive" onClick={() => onCloseAs('Lost')}>
              <ThumbsDown size={13} /> Lost
            </Button>
          </>
        )}
      </div>

      <div className="flex gap-0.5" aria-label={`Stage: ${o.stage}`}>
        {steps.map((s) => {
          const n = STAGES.indexOf(s);
          const isCur = s === o.stage;
          const isPast = n < current && o.stage !== 'Billing Rejection';
          return (
            <div key={s} className="grid min-w-0 flex-1 gap-1" title={s}>
              <i className={cn('block h-[5px] rounded-full', isCur ? 'bg-primary' : isPast ? 'bg-primary/35' : 'bg-border')} />
              <span className={cn('truncate text-[10.5px]', isCur ? 'font-semibold text-accent-foreground' : 'text-faint')}>{s}</span>
            </div>
          );
        })}
      </div>

      <MetricStrip>
        <Metric label="Annual revenue" value={money(o.annualRevenue ?? o.estimatedRevenue)} />
        <Metric label="Estimated MRR" value={money(o.estimatedMRR)} />
        <Metric label="Probability" value={`${o.probability}%`} />
        <Metric label="Weighted" value={money(weightedValue(o))} />
      </MetricStrip>

      <div className="grid items-start gap-3 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Deal" />
          <PanelBody>
            <dl className="m-0 grid grid-cols-[112px_minmax(0,1fr)] gap-x-2.5 gap-y-1.5 text-xs">
              <Field label="Primary vendor">{o.primaryVendor}</Field>
              <Field label="Opp type">{o.opportunityType}</Field>
              <Field label="Single / Cross">{o.singleOrCrossSell}</Field>
              <Field label="Type">{o.sellType}</Field>
              <Field label="Expiration">{fmtDate(o.expirationDate)}</Field>
              <Field label="Country">{[o.country, o.currency].filter(Boolean).join(' · ')}</Field>
            </dl>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHeader title="People" />
          <PanelBody>
            <dl className="m-0 grid grid-cols-[112px_minmax(0,1fr)] gap-x-2.5 gap-y-1.5 text-xs">
              <Field label="Contact">{contact ? `${contact.firstName} ${contact.lastName}` : null}</Field>
              <Field label="BCN">{o.bcn}</Field>
              <Field label="Primary owner">{o.createdByName ? formatDisplayName(o.createdByName) : null}</Field>
              <Field label="Secondary owner">{o.secondaryOwnerName ? formatDisplayName(o.secondaryOwnerName) : null}</Field>
            </dl>
          </PanelBody>
        </Panel>
      </div>

      {o.customerNeed && (
        <Panel>
          <PanelHeader title="Customer need" />
          <PanelBody className="select-text whitespace-pre-wrap leading-relaxed text-foreground-2">{o.customerNeed}</PanelBody>
        </Panel>
      )}

      {o.status !== 'Open' && (o.statusReason || o.closeDescription) && (
        <Panel>
          <PanelHeader title={`Closed as ${o.status}`} sub={fmtDate(o.closeDate) ?? undefined} />
          <PanelBody>
            <dl className="m-0 grid grid-cols-[112px_minmax(0,1fr)] gap-x-2.5 gap-y-1.5 text-xs">
              <Field label="Reason">{o.statusReason}</Field>
              <Field label="Actual revenue">{o.actualRevenue !== null ? money(o.actualRevenue) : null}</Field>
              <Field label="Description">{o.closeDescription}</Field>
            </dl>
          </PanelBody>
        </Panel>
      )}

      <Panel>
        <PanelHeader title={`Latest activity with ${companyName}`} />
        {latest.length === 0 ? (
          <PanelBody className="text-xs text-muted-foreground">Nothing logged yet.</PanelBody>
        ) : (
          <ul>
            {latest.map((a) => (
              <li key={a.id} className="grid grid-cols-[30px_minmax(0,1fr)_auto] items-start gap-2.5 border-t border-border px-3 py-2.5 first:border-t-0">
                <ActivityTypeIcon type={a.type} />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium">{a.subject}</div>
                  {a.createdByName && <div className="truncate text-xs text-muted-foreground">{formatDisplayName(a.createdByName)}</div>}
                </div>
                <span className="whitespace-nowrap text-[11.5px] text-muted-foreground">{fmtDate(a.occurredAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
