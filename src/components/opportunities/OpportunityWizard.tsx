'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Trophy, XOctagon, ChevronRight, Check, Save, Copy, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Combobox } from '@/components/ui/combobox';
import { MoneyInput } from '@/components/ui/MoneyInput';
import {
  STAGES, STAGE_PROBABILITY,
  AWS_SERVICE_TYPES, AWS_PARTNER_TYPES, APN_TAGGING_OPTIONS, SUPPORT_TYPES,
  MIGRATION_TYPES, END_USER_TYPES, PUBLIC_SECTOR_SEGMENTS,
  SINGLE_OR_CROSS_SELL, SELL_TYPES, OPP_TYPES_AZURE,
  COMPETITIVE_WINBACK_OPTIONS,
  isAwsVendor, isMicrosoftVendor, isConsolidatedAwsServiceType,
  getRequiredFields, type Stage, type FieldKey,
} from '@/lib/opportunityRules';
import { useLookupTableStore } from '@/store/lookupTableStore';
import type { Opportunity, Contact, Customer } from '@/types/entities';

export interface WizardFormData {
  customerId: string;
  contactId: string | null;
  subject: string;
  bcn: string | null;
  singleOrCrossSell: string | null;
  sellType: string;
  primaryVendor: string | null;
  opportunityType: string | null;
  stage: Stage;
  probability: number;
  expirationDate: string | null;
  estimatedRevenue: number | null;
  estimatedMRR: number | null;
  annualRevenue: number | null;
  currency: string;
  country: string;
  customerNeed: string | null;
  apnId: string | null;
  awsPartnerType: string | null;
  awsServiceType: string | null;
  apnTagging: string | null;
  endUserType: string | null;
  supportType: string | null;
  payerAccount: string | null;
  existingPayeeAccount: string | null;
  consolidationAcceptanceDate: string | null;
  msCspTenant: string | null;
  mpnId: string | null;
  migrationType: string | null;
  serviceName: string | null;
  competitiveWinback: string | null;
  publicSectorSegment: string | null;
}

interface Props {
  opportunity?: Opportunity;
  customer?: Customer;
  customers?: Customer[];
  contacts: Contact[];
  onSave: (data: WizardFormData) => Promise<void>;
  onCustomerChange?: (customerId: string) => void;
  onCloseWon?: () => void;
  onCloseLost?: () => void;
  onCancel: () => void;
}

function defaultExpiration(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

export function OpportunityWizard({
  opportunity, customer, customers, contacts,
  onSave, onCustomerChange, onCloseWon, onCloseLost, onCancel,
}: Props) {
  const isEditing = !!opportunity;
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState(opportunity?.customerId ?? customer?.id ?? '');
  const [contactId, setContactId] = useState(opportunity?.contactId ?? '');
  const [subject, setSubject] = useState(opportunity?.subject ?? '');
  const [bcn, setBcn] = useState(opportunity?.bcn ?? customer?.bcn ?? '');
  const [singleOrCrossSell, setSingleOrCrossSell] = useState(opportunity?.singleOrCrossSell ?? 'Single');
  const [sellType, setSellType] = useState(opportunity?.sellType ?? 'New');
  const [primaryVendor, setPrimaryVendor] = useState<string>(opportunity?.primaryVendor ?? '');
  const [opportunityType, setOpportunityType] = useState(opportunity?.opportunityType ?? '');
  const [stage, setStage] = useState<Stage>((opportunity?.stage as Stage) ?? 'Prospecting');
  const [expirationDate, setExpirationDate] = useState(opportunity?.expirationDate ?? defaultExpiration());
  const [estimatedRevenue, setEstimatedRevenue] = useState(opportunity?.estimatedRevenue?.toString() ?? '');
  const [estimatedMRR, setEstimatedMRR] = useState(opportunity?.estimatedMRR?.toString() ?? '');
  const [annualRevenue, setAnnualRevenue] = useState(opportunity?.annualRevenue?.toString() ?? '');
  const [currency, setCurrency] = useState(opportunity?.currency ?? 'USD');
  const [country, setCountry] = useState(opportunity?.country ?? 'Belgium');
  const [customerNeed, setCustomerNeed] = useState(opportunity?.customerNeed ?? '');

  const [apnId, setApnId] = useState(opportunity?.apnId ?? '');
  const [awsPartnerType, setAwsPartnerType] = useState(opportunity?.awsPartnerType ?? '');
  const [awsServiceType, setAwsServiceType] = useState(opportunity?.awsServiceType ?? '');
  const [apnTagging, setApnTagging] = useState(opportunity?.apnTagging ?? '');
  const [endUserType, setEndUserType] = useState(opportunity?.endUserType ?? '');
  const [supportType, setSupportType] = useState(opportunity?.supportType ?? '');
  const [payerAccount, setPayerAccount] = useState(opportunity?.payerAccount ?? '');
  const [existingPayeeAccount, setExistingPayeeAccount] = useState(opportunity?.existingPayeeAccount ?? '');
  const [consolidationAcceptanceDate, setConsolidationAcceptanceDate] = useState(opportunity?.consolidationAcceptanceDate ?? '');

  const [msCspTenant, setMsCspTenant] = useState(opportunity?.msCspTenant ?? '');
  const [mpnId, setMpnId] = useState(opportunity?.mpnId ?? '');
  const [migrationType, setMigrationType] = useState(opportunity?.migrationType ?? '');
  const [serviceName, setServiceName] = useState(opportunity?.serviceName ?? '');
  const [competitiveWinback, setCompetitiveWinback] = useState<string>(opportunity?.competitiveWinback ?? 'Unknown');
  const [publicSectorSegment, setPublicSectorSegment] = useState(opportunity?.publicSectorSegment ?? '');

  // D365-synced lookup tables (vendors, services, countries, currencies)
  const lookupTables = useLookupTableStore((s) => s.lookupTables);
  const vendorOptions = useMemo(
    () => (lookupTables['opportunity.primaryvendor'] ?? [])
      .filter((v) => isAwsVendor(v.label) || isMicrosoftVendor(v.label))
      .map((v) => ({ value: v.label, label: v.label })),
    [lookupTables],
  );
  const serviceNameOptions = useMemo(
    () => (lookupTables['opportunity.servicename'] ?? []).map((v) => ({ value: v.label, label: v.label })),
    [lookupTables],
  );
  const countryList = useMemo(
    () => {
      const synced = (lookupTables['opportunity.country'] ?? []).map((v) => v.label);
      return synced.length > 0 ? synced : ['Belgium', 'Netherlands'];
    },
    [lookupTables],
  );
  const currencyList = useMemo(
    () => {
      const synced = (lookupTables['opportunity.currency'] ?? [])
        .map((v) => v.label)
        .filter((c) => c === 'EUR' || c === 'USD');
      return synced.length > 0 ? synced : ['EUR', 'USD'];
    },
    [lookupTables],
  );

  const isAws = isAwsVendor(primaryVendor);
  const isMs = isMicrosoftVendor(primaryVendor);
  const showConsolidation = isAws && isConsolidatedAwsServiceType(awsServiceType);
  const showPublicSegment = endUserType === 'Public Sector';

  const probability = STAGE_PROBABILITY[stage];

  const formState = useMemo(() => ({
    primaryVendor: primaryVendor || null,
    awsServiceType: awsServiceType || null,
    endUserType: endUserType || null,
  }), [primaryVendor, awsServiceType, endUserType]);

  const requiredFields = useMemo(() => getRequiredFields(formState), [formState]);

  const fieldValueMap = useMemo<Record<FieldKey, unknown>>(() => ({
    subject, accountId: customerId, contactId, singleOrCrossSell, type: sellType,
    primaryVendor, opportunityType, country, currency, stage,
    bcn, recordType: 'Sales', source: 'cloud', customerNeed,
    estimatedMRR, annualRevenue, expirationDate,
    apnId, awsPartnerType, awsServiceType, apnTagging, endUserType,
    supportType, payerAccount, existingPayeeAccount, consolidationAcceptanceDate,
    msCspTenant, mpnId, migrationType, serviceName, competitiveWinback,
    publicSectorSegment,
  }), [
    subject, customerId, contactId, singleOrCrossSell, sellType, primaryVendor,
    opportunityType, country, currency, stage, bcn, customerNeed,
    estimatedMRR, annualRevenue, expirationDate,
    apnId, awsPartnerType, awsServiceType, apnTagging, endUserType,
    supportType, payerAccount, existingPayeeAccount, consolidationAcceptanceDate,
    msCspTenant, mpnId, migrationType, serviceName, competitiveWinback,
    publicSectorSegment,
  ]);

  const isFieldFilled = (f: FieldKey): boolean => {
    const v = fieldValueMap[f];
    if (typeof v === 'boolean') return true;
    if (typeof v === 'number') return !Number.isNaN(v);
    return v != null && String(v).trim() !== '';
  };
  const missingFields = requiredFields.filter((f) => !isFieldFilled(f));
  const filledRequiredCount = requiredFields.length - missingFields.length;
  const allRequiredFilled = missingFields.length === 0;
  const [showErrors, setShowErrors] = useState(false);

  // Auto-fill BCN from customer when customer changes
  useEffect(() => {
    if (!opportunity && customers && customerId) {
      const c = customers.find((x) => x.id === customerId);
      if (c?.bcn && !bcn) setBcn(c.bcn);
    }
  }, [customerId, customers, opportunity, bcn]);

  // Notify parent so it can load contacts for the picked customer
  useEffect(() => {
    if (onCustomerChange) onCustomerChange(customerId);
  }, [customerId, onCustomerChange]);

  const handleSave = async () => {
    if (!allRequiredFilled) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    try {
      await onSave({
        customerId,
        contactId: contactId && contactId !== '__none' ? contactId : null,
        subject: subject.trim(),
        bcn: bcn.trim() || null,
        singleOrCrossSell: singleOrCrossSell || null,
        sellType: sellType || 'New',
        primaryVendor: primaryVendor || null,
        opportunityType: opportunityType || null,
        stage,
        probability,
        expirationDate: expirationDate || null,
        estimatedRevenue: estimatedRevenue ? parseFloat(estimatedRevenue) : null,
        estimatedMRR: estimatedMRR ? parseFloat(estimatedMRR) : null,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : null,
        currency,
        country,
        customerNeed: customerNeed.trim() || null,
        apnId: isAws ? (apnId.trim() || null) : null,
        awsPartnerType: isAws ? (awsPartnerType || null) : null,
        awsServiceType: isAws ? (awsServiceType || null) : null,
        apnTagging: isAws ? (apnTagging || null) : null,
        endUserType: (isAws || isMs) ? (endUserType || null) : null,
        supportType: isAws ? (supportType || null) : null,
        payerAccount: isAws ? (payerAccount.trim() || null) : null,
        existingPayeeAccount: showConsolidation ? (existingPayeeAccount.trim() || null) : null,
        consolidationAcceptanceDate: showConsolidation ? (consolidationAcceptanceDate || null) : null,
        msCspTenant: isMs ? (msCspTenant.trim() || null) : null,
        mpnId: isMs ? (mpnId.trim() || null) : null,
        migrationType: isMs ? (migrationType || null) : null,
        serviceName: isMs ? (serviceName.trim() || null) : null,
        competitiveWinback: isMs ? competitiveWinback : null,
        publicSectorSegment: showPublicSegment ? (publicSectorSegment || null) : null,
      });
    } finally {
      setSaving(false);
    }
  };

  const customerOptions = (customers ?? []).map((c) => ({ value: c.id, label: c.name }));
  const contactOptions = contacts.map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }));
  const opportunityTypeOptions = isMs ? OPP_TYPES_AZURE : (isAws ? ['Trad', 'Services', 'SPA', 'CMP'] : OPP_TYPES_AZURE);

  return (
    <div className="flex flex-col w-full min-w-0 max-h-[85vh] overflow-hidden">
      {/* Header — title + status pills */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground mb-1">
              {isEditing ? 'Edit opportunity' : 'New opportunity'}
            </div>
            <div className="text-lg font-semibold truncate">
              {subject || 'Untitled opportunity'}
            </div>
            {isEditing && (
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant={opportunity?.status === 'Open' ? 'default' : opportunity?.status === 'Won' ? 'success' : 'destructive'}>
                  {opportunity?.status}
                </Badge>
                {opportunity?.remoteId && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    onClick={() => navigator.clipboard.writeText(opportunity.remoteId!)}
                    title="Copy D365 ID"
                  >
                    <Copy size={11} /> {opportunity.remoteId.slice(0, 8)}…
                  </button>
                )}
              </div>
            )}
          </div>
          {isEditing && opportunity?.status === 'Open' && (
            <div className="flex gap-2 flex-shrink-0 mr-8">
              <Button type="button" size="sm" variant="outline" onClick={onCloseWon} className="text-emerald-600 hover:text-emerald-700">
                <Trophy size={14} className="mr-1.5" />Close as Won
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={onCloseLost} className="text-rose-600 hover:text-rose-700">
                <XOctagon size={14} className="mr-1.5" />Close as Lost
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stage stepper */}
      <div className="px-6 py-4 border-b bg-muted/30">
        <StageStepper currentStage={stage} onSelect={setStage} />
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-6 py-5 space-y-6">
        {/* Section: Basics */}
        <Section title="Basics" subtitle="Core details about this opportunity">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Subject *" wide>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Cloud migration project" required />
            </Field>

            {customers ? (
              <Field label="Customer *" wide>
                <Combobox
                  options={customerOptions}
                  value={customerId}
                  onValueChange={setCustomerId}
                  placeholder="Select customer"
                  emptyText="No customer found"
                />
              </Field>
            ) : customer && (
              <Field label="Customer">
                <div className="px-3 py-2 text-sm bg-muted rounded-md flex items-center gap-2">
                  <Lock size={12} className="text-muted-foreground" />{customer.name}
                </div>
              </Field>
            )}

            <Field label="Contact *">
              <Combobox
                options={contactOptions}
                value={contactId === '__none' ? '' : contactId}
                onValueChange={(v) => setContactId(v || '__none')}
                placeholder={customerId ? 'Select contact' : 'Pick a customer first'}
                emptyText={customerId ? 'No contacts for this customer' : 'Pick a customer first'}
              />
            </Field>

            <Field label="BCN *">
              <Input value={bcn} onChange={(e) => setBcn(e.target.value)} placeholder="Auto-filled from customer" />
            </Field>

            <Field label="Single or Cross Sell *">
              <Select value={singleOrCrossSell} onValueChange={setSingleOrCrossSell}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SINGLE_OR_CROSS_SELL.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Type *">
              <Select value={sellType} onValueChange={setSellType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SELL_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Primary Vendor *" wide>
              <Combobox
                options={vendorOptions}
                value={primaryVendor}
                onValueChange={setPrimaryVendor}
                placeholder="Select vendor"
                emptyText="No vendor found — sync to load D365 vendors"
              />
            </Field>

            <Field label="Opp Type *">
              <Select value={opportunityType} onValueChange={setOpportunityType}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {opportunityTypeOptions.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Country *">
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {countryList.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Currency *">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencyList.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Customer Need *" wide colSpan={2}>
              <Textarea
                value={customerNeed}
                onChange={(e) => setCustomerNeed(e.target.value)}
                rows={2}
                placeholder="What does the customer need?"
              />
            </Field>
          </div>
        </Section>

        {/* Section: Vendor-specific */}
        <AnimatePresence initial={false}>
          {isAws && (
            <motion.div
              key="aws"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Section title="AWS configuration" subtitle="Required when selling AWS">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="APN ID *">
                    <Input value={apnId} onChange={(e) => setApnId(e.target.value)} />
                  </Field>
                  <Field label="AWS Partner Type *">
                    <Select value={awsPartnerType} onValueChange={setAwsPartnerType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {AWS_PARTNER_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="AWS Service Type *" wide>
                    <Select value={awsServiceType} onValueChange={setAwsServiceType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {AWS_SERVICE_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="APN Tagging *">
                    <Select value={apnTagging} onValueChange={setApnTagging}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {APN_TAGGING_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="End User Type *">
                    <Select value={endUserType} onValueChange={setEndUserType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {END_USER_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Support Type *">
                    <Select value={supportType} onValueChange={setSupportType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {SUPPORT_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Payer Account *">
                    <Input value={payerAccount} onChange={(e) => setPayerAccount(e.target.value)} />
                  </Field>

                  <AnimatePresence initial={false}>
                    {showConsolidation && (
                      <>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="col-span-2 grid grid-cols-2 gap-4 pt-2 border-t"
                        >
                          <Field label="Existing Payee Account *">
                            <Input value={existingPayeeAccount} onChange={(e) => setExistingPayeeAccount(e.target.value)} />
                          </Field>
                          <Field label="Consolidation Acceptance Date *">
                            <DatePicker value={consolidationAcceptanceDate} onChange={setConsolidationAcceptanceDate} />
                          </Field>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </Section>
            </motion.div>
          )}

          {isMs && (
            <motion.div
              key="ms"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Section title="Microsoft configuration" subtitle="Required when selling Microsoft Azure or Cloud">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="MS CSP Tenant *">
                    <Input value={msCspTenant} onChange={(e) => setMsCspTenant(e.target.value)} />
                  </Field>
                  <Field label="MPN ID *">
                    <Input value={mpnId} onChange={(e) => setMpnId(e.target.value)} />
                  </Field>
                  <Field label="Migration Type *">
                    <Select value={migrationType} onValueChange={setMigrationType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {MIGRATION_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="End User Type *">
                    <Select value={endUserType} onValueChange={setEndUserType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {END_USER_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Service Name *" wide>
                    <Combobox
                      options={serviceNameOptions}
                      value={serviceName ?? ''}
                      onValueChange={setServiceName}
                      placeholder="Select service"
                      emptyText="No service found — sync to load D365 services"
                    />
                  </Field>
                  <Field label="Competitive Winback *" wide>
                    <Select value={competitiveWinback} onValueChange={setCompetitiveWinback}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COMPETITIVE_WINBACK_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </Section>
            </motion.div>
          )}

          {showPublicSegment && (
            <motion.div
              key="psg"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Section title="Public sector" subtitle="Required for public sector deals">
                <Field label="Public Sector Segment *">
                  <Select value={publicSectorSegment} onValueChange={setPublicSectorSegment}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {PUBLIC_SECTOR_SEGMENTS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </Section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section: Financials */}
        <Section title="Financials" subtitle="Revenue projections and timing">
          <div className="grid grid-cols-2 gap-4">
            <Field label={`Estimated MRR * (${currency})`}>
              <MoneyInput value={estimatedMRR} onValueChange={setEstimatedMRR} currency={currency} />
            </Field>
            <Field label={`Annual Revenue * (${currency})`}>
              <MoneyInput value={annualRevenue} onValueChange={setAnnualRevenue} currency={currency} />
            </Field>
            <Field label={`Estimated Revenue (${currency})`}>
              <MoneyInput value={estimatedRevenue} onValueChange={setEstimatedRevenue} currency={currency} placeholder="Total deal value" />
            </Field>
            <Field label="Expiration Date">
              <DatePicker value={expirationDate} onChange={setExpirationDate} />
            </Field>
          </div>
        </Section>
      </div>

      {/* Footer — sticky save bar */}
      <div className="px-6 py-3 border-t bg-card flex items-center justify-between gap-4">
        <div className="text-xs">
          <span className={`font-medium ${allRequiredFilled ? 'text-foreground' : 'text-rose-600'}`}>{filledRequiredCount}</span>
          <span className="text-muted-foreground"> / {requiredFields.length} required filled</span>
          <span className="mx-2 text-muted-foreground">·</span>
          <span className="text-muted-foreground">Stage: <span className="font-medium text-foreground">{stage}</span> ({probability}%)</span>
          {showErrors && !allRequiredFilled && (
            <div className="mt-1 text-rose-600">
              Missing: {missingFields.map(fieldLabel).join(', ')}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 size={14} className="animate-spin mr-2" />Saving…</> : <><Save size={14} className="mr-2" />Save</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

const FIELD_LABELS: Record<FieldKey, string> = {
  subject: 'Subject', accountId: 'Customer', contactId: 'Contact',
  singleOrCrossSell: 'Single or Cross Sell', type: 'Type',
  primaryVendor: 'Primary Vendor', opportunityType: 'Opp Type',
  country: 'Country', currency: 'Currency', stage: 'Stage',
  bcn: 'BCN', recordType: 'Record Type', source: 'Source',
  customerNeed: 'Customer Need', estimatedMRR: 'Estimated MRR',
  annualRevenue: 'Annual Revenue', expirationDate: 'Expiration Date',
  apnId: 'APN ID', awsPartnerType: 'AWS Partner Type',
  awsServiceType: 'AWS Service Type', apnTagging: 'APN Tagging',
  endUserType: 'End User Type', supportType: 'Support Type',
  payerAccount: 'Payer Account', existingPayeeAccount: 'Existing Payee Account',
  consolidationAcceptanceDate: 'Consolidation Acceptance Date',
  msCspTenant: 'MS CSP Tenant', mpnId: 'MPN ID',
  migrationType: 'Migration Type', serviceName: 'Service Name',
  competitiveWinback: 'Competitive Winback',
  publicSectorSegment: 'Public Sector Segment',
};

function fieldLabel(f: FieldKey): string {
  return FIELD_LABELS[f] ?? f;
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, wide, colSpan }: { label: string; children: React.ReactNode; wide?: boolean; colSpan?: number }) {
  void wide;
  return (
    <div className={`space-y-1 ${colSpan === 2 ? 'col-span-2' : ''}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

interface StageStepperProps {
  currentStage: Stage;
  onSelect: (s: Stage) => void;
}

function StageStepper({ currentStage, onSelect }: StageStepperProps) {
  const currentIdx = STAGES.indexOf(currentStage);
  const isBillingRejection = currentStage === 'Billing Rejection';

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STAGES.map((s, i) => {
        const isActive = s === currentStage;
        const isPast = !isBillingRejection && i < currentIdx;
        const isBranch = s === 'Billing Rejection';
        return (
          <div key={s} className="flex items-center flex-shrink-0">
            <button
              type="button"
              onClick={() => onSelect(s)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                isActive ? 'bg-primary text-primary-foreground'
                : isPast ? 'text-foreground hover:bg-accent'
                : isBranch ? 'text-muted-foreground hover:bg-accent border border-dashed'
                : 'text-muted-foreground hover:bg-accent'
              }`}
              title={`${s} (${STAGE_PROBABILITY[s]}%)`}
            >
              {isPast && <Check size={11} className="flex-shrink-0" />}
              <span className="whitespace-nowrap">{s}</span>
              <span className="text-[10px] opacity-70">{STAGE_PROBABILITY[s]}%</span>
            </button>
            {i < STAGES.length - 1 && !isBranch && (
              <ChevronRight size={12} className="text-muted-foreground/40 mx-0.5 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
