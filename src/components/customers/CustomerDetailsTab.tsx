'use client';

import { useState } from 'react';
import { Copy, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { VendorIdsDialog } from '@/components/customers/VendorIdsDialog';
import { CloudContactsDialog } from '@/components/customers/CloudContactsDialog';
import { formatDisplayName } from '@/lib/utils/nameUtils';
import type { Customer } from '@/types/entities';

type Row = [label: string, value: string | null | undefined];

function Prop({ label, value }: { label: string; value: string | null | undefined }) {
  const empty = !value;
  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Copied ${label}`);
    } catch (err) {
      console.error('[customer] Failed to copy field:', err);
    }
  };
  return (
    <button
      type="button"
      disabled={empty}
      onClick={copy}
      title={empty ? undefined : `Copy ${label}`}
      className="group/prop grid min-h-[34px] grid-cols-[150px_minmax(0,1fr)_20px] items-center gap-2.5 rounded-md px-2 py-1 text-left transition-colors enabled:hover:bg-surface-2 enabled:active:bg-accent disabled:cursor-default"
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="select-text break-words text-[13px] font-medium">{value || <span className="font-normal text-faint">—</span>}</span>
      {!empty && <Copy size={13} className="text-faint opacity-0 transition-opacity group-hover/prop:opacity-100 group-focus-visible/prop:opacity-100" />}
    </button>
  );
}

function Section({ title, rows, onEdit, editLabel }: { title: string; rows: Row[]; onEdit?: () => void; editLabel?: string }) {
  return (
    <Panel>
      <PanelHeader title={title}>
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit} aria-label={editLabel}>
            <Pencil size={12} />
            Edit
          </Button>
        )}
      </PanelHeader>
      <div className="grid p-1">
        {rows.map(([label, value]) => (
          <Prop key={label} label={label} value={value} />
        ))}
      </div>
    </Panel>
  );
}

const person = (name: string | null) => (name ? formatDisplayName(name) : null);

/** Every company field the CRM holds, grouped, each copied with one click. */
export function CustomerDetailsTab({ customer: c }: { customer: Customer }) {
  const [vendorOpen, setVendorOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);

  return (
    <div className="grid items-start gap-3 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
      <Section
        title="Company"
        rows={[
          ['Name', c.name],
          ['Status', c.status === 'active' ? 'Active' : 'Inactive'],
          ['Industry', c.industry],
          ['Segment', c.segment],
          ['Cloud customer', c.cloudCustomer === null ? null : c.cloudCustomer ? 'Yes' : 'No'],
        ]}
      />
      <Section
        title="Identifiers"
        onEdit={() => setVendorOpen(true)}
        editLabel="Edit vendor IDs"
        rows={[
          ['Account number', c.accountNumber],
          ['BCN', c.bcn],
          ['Reseller ID', c.resellerId],
          ['MPN ID', c.mpnId],
          ['APN ID', c.apnId],
        ]}
      />
      <Section
        title="Contact"
        rows={[
          ['Email', c.email],
          ['Phone', c.phone],
          ['Website', c.website],
          ['Address', c.addressStreet],
          ['City', c.addressCity],
          ['Country', c.addressCountry],
        ]}
      />
      <Section
        title="Account team"
        onEdit={() => setTeamOpen(true)}
        editLabel="Edit account team"
        rows={[
          ['Account owner', person(c.ownerName)],
          ['Customer Success Manager', person(c.customerSuccessManagerName)],
          ['AWS owner', person(c.awsOwnerName)],
          ['Azure owner', person(c.azureOwnerName)],
          ['Inside sales owner', person(c.insideSalesOwnerName)],
          ['Account manager', person(c.accountManagerName)],
        ]}
      />
      <VendorIdsDialog customer={c} open={vendorOpen} onOpenChange={setVendorOpen} />
      <CloudContactsDialog customer={c} open={teamOpen} onOpenChange={setTeamOpen} />
    </div>
  );
}
