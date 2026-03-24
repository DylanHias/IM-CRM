'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { stageToProbability } from '@/hooks/useOpportunities';
import type { Opportunity, OpportunityStatus, OpportunityType, OpportunityStage, SellType, PrimaryVendor, Contact, Customer } from '@/types/entities';

const STATUSES: OpportunityStatus[] = ['Open', 'Won', 'Lost'];
const OPPORTUNITY_TYPES: OpportunityType[] = ['Services', 'SPA', 'SPA - Partner Agreement', 'CMP', 'Trad', 'MPO2Connect', 'Azure Private Offer', 'Breath'];
const STAGES: OpportunityStage[] = ['Prospecting', 'Validated', 'Qualified', 'Verbal Received', 'Contract Received', 'Billing Rejection', 'Pending Vendor Confirmation', 'Purchased'];
const SELL_TYPES: SellType[] = ['New', 'Install'];
const PRIMARY_VENDORS: PrimaryVendor[] = ['AWS', 'Azure', 'Adobe'];

interface OpportunityFormProps {
  opportunity?: Opportunity;
  contacts: Contact[];
  customer?: Customer;
  onSubmit: (data: OpportunityFormData) => Promise<void>;
  onCancel: () => void;
}

export interface OpportunityFormData {
  contactId: string | null;
  status: OpportunityStatus;
  subject: string;
  bcn: string | null;
  multiVendorOpportunity: boolean;
  sellType: SellType;
  primaryVendor: PrimaryVendor | null;
  opportunityType: OpportunityType | null;
  stage: OpportunityStage;
  probability: number;
  expirationDate: string | null;
  estimatedRevenue: number | null;
  currency: string;
  country: string;
  source: string;
  recordType: string;
  customerNeed: string | null;
}

export function OpportunityForm({ opportunity, contacts, customer, onSubmit, onCancel }: OpportunityFormProps) {
  const [status, setStatus] = useState<OpportunityStatus>(opportunity?.status ?? 'Open');
  const [subject, setSubject] = useState(opportunity?.subject ?? '');
  const [bcn, setBcn] = useState(opportunity?.bcn ?? customer?.bcn ?? '');
  const [multiVendor, setMultiVendor] = useState(opportunity?.multiVendorOpportunity ?? false);
  const [sellType, setSellType] = useState<SellType>(opportunity?.sellType ?? 'New');
  const [primaryVendor, setPrimaryVendor] = useState<string>(opportunity?.primaryVendor ?? 'none');
  const [oppType, setOppType] = useState<string>(opportunity?.opportunityType ?? 'none');
  const [stage, setStage] = useState<OpportunityStage>(opportunity?.stage ?? 'Prospecting');
  const [probability, setProbability] = useState(opportunity?.probability ?? 5);
  const [expirationDate, setExpirationDate] = useState(opportunity?.expirationDate ?? '');
  const [estimatedRevenue, setEstimatedRevenue] = useState(opportunity?.estimatedRevenue?.toString() ?? '');
  const [currency] = useState(opportunity?.currency ?? 'EUR');
  const [country] = useState(opportunity?.country ?? 'Belgium');
  const [contactId, setContactId] = useState<string>(opportunity?.contactId ?? 'none');
  const [customerNeed, setCustomerNeed] = useState(opportunity?.customerNeed ?? '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setProbability(stageToProbability(stage));
  }, [stage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    setIsSaving(true);
    try {
      await onSubmit({
        contactId: contactId === 'none' ? null : contactId,
        status,
        subject: subject.trim(),
        bcn: bcn.trim() || null,
        multiVendorOpportunity: multiVendor,
        sellType,
        primaryVendor: primaryVendor === 'none' ? null : primaryVendor as PrimaryVendor,
        opportunityType: oppType === 'none' ? null : oppType as OpportunityType,
        stage,
        probability,
        expirationDate: expirationDate || null,
        estimatedRevenue: estimatedRevenue ? parseFloat(estimatedRevenue) : null,
        currency,
        country,
        source: opportunity?.source ?? 'cloud',
        recordType: opportunity?.recordType ?? 'Sales',
        customerNeed: customerNeed.trim() || null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Subject *</Label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as OpportunityStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Stage</Label>
          <Select value={stage} onValueChange={(v) => setStage(v as OpportunityStage)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Probability</Label>
          <Input type="number" value={probability} readOnly className="bg-muted" />
        </div>
        <div className="space-y-1">
          <Label>Sell Type</Label>
          <Select value={sellType} onValueChange={(v) => setSellType(v as SellType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SELL_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Primary Vendor</Label>
          <Select value={primaryVendor} onValueChange={setPrimaryVendor}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {PRIMARY_VENDORS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Opportunity Type</Label>
          <Select value={oppType} onValueChange={setOppType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {OPPORTUNITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Estimated Revenue</Label>
          <Input type="number" step="0.01" value={estimatedRevenue} onChange={(e) => setEstimatedRevenue(e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-1">
          <Label>Expiration Date</Label>
          <Input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Contact</Label>
          <Select value={contactId} onValueChange={setContactId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No contact</SelectItem>
              {contacts.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>BCN</Label>
          <Input value={bcn} onChange={(e) => setBcn(e.target.value)} />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={multiVendor}
          onChange={(e) => setMultiVendor(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        <span className="text-sm">Multi-vendor opportunity</span>
      </label>

      <div className="space-y-1">
        <Label>Customer Need</Label>
        <Textarea value={customerNeed} onChange={(e) => setCustomerNeed(e.target.value)} rows={3} placeholder="Describe what the customer needs..." />
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" disabled={isSaving || !subject.trim()} className="flex-1">
          {isSaving ? <><Loader2 size={15} className="animate-spin mr-2" />Saving...</> : opportunity ? 'Save Changes' : 'Create Opportunity'}
        </Button>
      </div>
    </form>
  );
}
