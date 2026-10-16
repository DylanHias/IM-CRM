'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, CheckCircle2, Copy, Loader2, Lock, Save, Trophy, XOctagon } from 'lucide-react';
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
  isAwsVendor, isMicrosoftVendor, isSupportedVendor, isConsolidatedAwsServiceType,
  getRequiredFields, SUPPORTED_VENDORS, type Stage, type FieldKey,
} from '@/lib/opportunityRules';
import { useLookupTableStore } from '@/store/lookupTableStore';
import { useSettingsStore } from '@/store/settingsStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { queryAllCloudBeluxUsers, type CloudBeluxUser } from '@/lib/db/queries/cloudBeluxUsers';
import { formatDisplayName } from '@/lib/utils/nameUtils';
import { cn } from '@/lib/utils';
import { WIZARD_SECTIONS, countBySection, type FieldSection, type WizardSection } from '@/lib/opportunities/wizardSections';
import type { Opportunity, Contact, Customer } from '@/types/entities';

const SECONDARY_OWNER_NONE = '__none__';

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
  estimatedMargin: number | null;
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
  secondaryOwnerId: string | null;
  secondaryOwnerName: string | null;
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

function defaultExpiration(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function OpportunityWizard({
  opportunity, customer, customers, contacts,
  onSave, onCustomerChange, onCloseWon, onCloseLost, onCancel,
}: Props) {
  const isEditing = !!opportunity;
  const [saving, setSaving] = useState(false);

  const defaultCurrency = useSettingsStore((s) => s.defaultOpportunityCurrency);
  const defaultCountry = useSettingsStore((s) => s.defaultOpportunityCountry);
  const defaultStage = useSettingsStore((s) => s.defaultOpportunityStage);
  const defaultExpirationDays = useSettingsStore((s) => s.defaultOpportunityExpirationDays);

  const [customerId, setCustomerId] = useState(opportunity?.customerId ?? customer?.id ?? '');
  const [contactId, setContactId] = useState(opportunity?.contactId ?? '');
  const [subject, setSubject] = useState(opportunity?.subject ?? '');
  const [bcn, setBcn] = useState(opportunity?.bcn ?? customer?.bcn ?? '');
  const [singleOrCrossSell, setSingleOrCrossSell] = useState(opportunity?.singleOrCrossSell ?? 'Single');
  const [sellType, setSellType] = useState(opportunity?.sellType ?? 'New');
  const [primaryVendor, setPrimaryVendor] = useState<string>(opportunity?.primaryVendor ?? '');
  const [opportunityType, setOpportunityType] = useState(opportunity?.opportunityType ?? '');
  const [stage, setStage] = useState<Stage>((opportunity?.stage as Stage) ?? defaultStage);
  const [expirationDate, setExpirationDate] = useState(opportunity?.expirationDate ?? defaultExpiration(defaultExpirationDays));
  const estimatedRevenue = opportunity?.estimatedRevenue?.toString() ?? '';
  const [estimatedMRR, setEstimatedMRR] = useState(opportunity?.estimatedMRR?.toString() ?? '');
  const [annualRevenue, setAnnualRevenue] = useState(opportunity?.annualRevenue?.toString() ?? '');
  const [estimatedMargin, setEstimatedMargin] = useState(opportunity?.estimatedMargin?.toString() ?? '');

  const updateEstimatedMRR = (raw: string) => {
    setEstimatedMRR(raw);
    if (raw === '') {
      setAnnualRevenue('');
      return;
    }
    const n = parseFloat(raw);
    if (!Number.isNaN(n)) {
      setAnnualRevenue((Math.round(n * 12 * 100) / 100).toString());
    }
  };

  const updateAnnualRevenue = (raw: string) => {
    setAnnualRevenue(raw);
    if (raw === '') {
      setEstimatedMRR('');
      return;
    }
    const n = parseFloat(raw);
    if (!Number.isNaN(n)) {
      setEstimatedMRR((Math.round((n / 12) * 100) / 100).toString());
    }
  };
  const [currency, setCurrency] = useState(opportunity?.currency ?? defaultCurrency);
  const [country, setCountry] = useState(opportunity?.country ?? defaultCountry);
  const [customerNeed, setCustomerNeed] = useState(opportunity?.customerNeed ?? '');

  const [apnId, setApnId] = useState(opportunity?.apnId ?? customer?.apnId ?? '');
  const [awsPartnerType, setAwsPartnerType] = useState(opportunity?.awsPartnerType ?? '');
  const [awsServiceType, setAwsServiceType] = useState(opportunity?.awsServiceType ?? '');
  const [apnTagging, setApnTagging] = useState(opportunity?.apnTagging ?? '');
  const [endUserType, setEndUserType] = useState(opportunity?.endUserType ?? '');
  const [supportType, setSupportType] = useState(opportunity?.supportType ?? '');
  const [payerAccount, setPayerAccount] = useState(opportunity?.payerAccount ?? '');
  const [existingPayeeAccount, setExistingPayeeAccount] = useState(opportunity?.existingPayeeAccount ?? '');
  const [consolidationAcceptanceDate, setConsolidationAcceptanceDate] = useState(opportunity?.consolidationAcceptanceDate ?? '');

  const [msCspTenant, setMsCspTenant] = useState(opportunity?.msCspTenant ?? '');
  const [mpnId, setMpnId] = useState(opportunity?.mpnId ?? customer?.mpnId ?? '');
  const [migrationType, setMigrationType] = useState(opportunity?.migrationType ?? '');
  const [serviceName, setServiceName] = useState(opportunity?.serviceName ?? '');
  const [competitiveWinback, setCompetitiveWinback] = useState<string>(opportunity?.competitiveWinback ?? 'Unknown');
  const [publicSectorSegment, setPublicSectorSegment] = useState(opportunity?.publicSectorSegment ?? '');
  const [secondaryOwnerId, setSecondaryOwnerId] = useState<string>(opportunity?.secondaryOwnerId ?? SECONDARY_OWNER_NONE);
  const [cloudUsers, setCloudUsers] = useState<CloudBeluxUser[]>([]);

  useEffect(() => {
    if (!isTauriApp()) return;
    const load = async () => {
      try {
        setCloudUsers(await queryAllCloudBeluxUsers());
      } catch (err) {
        console.error('[opportunity] Failed to load cloud users:', err);
      }
    };
    load();
  }, []);

  // D365-synced lookup tables (vendors, services, countries, currencies)
  const lookupTables = useLookupTableStore((s) => s.lookupTables);
  const vendorOptions = useMemo(
    () => {
      const synced = (lookupTables['opportunity.primaryvendor'] ?? [])
        .filter((v) => isSupportedVendor(v.label));
      const seen = new Set<string>();
      const list: { value: string; label: string }[] = [];
      const pickSynced = (target: string) => {
        const match = synced.find((v) => v.label.trim().toUpperCase() === target.toUpperCase());
        return match?.label ?? target;
      };
      for (const target of SUPPORTED_VENDORS) {
        const label = pickSynced(target);
        const key = label.trim().toUpperCase();
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({ value: label, label });
      }
      return list;
    },
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
    stage,
  }), [primaryVendor, awsServiceType, endUserType, stage]);

  const requiredFields = useMemo(() => getRequiredFields(formState), [formState]);
  const requiredSet = useMemo(() => new Set<FieldKey>(requiredFields), [requiredFields]);
  const isReq = (f: FieldKey) => requiredSet.has(f);

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
  const [section, setSection] = useState<WizardSection>(isEditing ? 'review' : 'customer');
  const hasError = (f: FieldKey) => showErrors && !isFieldFilled(f);

  // Notify parent so it can load contacts for the picked customer
  useEffect(() => {
    if (onCustomerChange) onCustomerChange(customerId);
  }, [customerId, onCustomerChange]);

  const handleCustomerChange = (newId: string) => {
    if (newId === customerId) return;
    setCustomerId(newId);
    setContactId('');
    const c = (customers ?? []).find((x) => x.id === newId);
    setBcn(c?.bcn ?? '');
    setApnId(c?.apnId ?? '');
    setMpnId(c?.mpnId ?? '');
  };

  const handleSave = async () => {
    if (!allRequiredFilled) {
      setShowErrors(true);
      setSection('review');
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
        estimatedMargin: estimatedMargin ? parseFloat(estimatedMargin) : null,
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
        secondaryOwnerId: secondaryOwnerId === SECONDARY_OWNER_NONE ? null : secondaryOwnerId,
        secondaryOwnerName: secondaryOwnerId === SECONDARY_OWNER_NONE
          ? null
          : (cloudUsers.find((u) => u.id === secondaryOwnerId)?.name ?? null),
      });
    } finally {
      setSaving(false);
    }
  };

  const customerOptions = (customers ?? []).map((c) => ({ value: c.id, label: c.name }));
  const contactOptions = contacts.map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }));
  const opportunityTypeOptions = isMs ? OPP_TYPES_AZURE : (isAws ? ['Trad', 'Services', 'SPA', 'CMP'] : OPP_TYPES_AZURE);

  const sectionIndex = WIZARD_SECTIONS.findIndex((x) => x.id === section);
  const missingBySection = countBySection(missingFields);
  const requiredBySection = countBySection(requiredFields);
  const customerName = customer?.name ?? (customers ?? []).find((c) => c.id === customerId)?.name ?? '—';
  const contact = contacts.find((c) => c.id === contactId);
  const ownerName = secondaryOwnerId === SECONDARY_OWNER_NONE ? '—' : formatDisplayName(cloudUsers.find((u) => u.id === secondaryOwnerId)?.name ?? '—');
  const money = (v: string) => (v ? `${currency} ${Number(v).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—');

  const reviewRows: Record<FieldSection, [string, string][]> = {
    customer: [['Customer', customerName], ['Contact', contact ? `${contact.firstName} ${contact.lastName}` : '—'], ['BCN', bcn || '—'], ['Secondary owner', ownerName]],
    deal: [['Subject', subject || '—'], ['Stage', `${stage} (${probability}%)`], ['Sell / type', `${singleOrCrossSell || '—'} · ${sellType || '—'}`], ['Opp type', opportunityType || '—'], ['Customer need', customerNeed || '—']],
    vendor: [['Primary vendor', primaryVendor || '—'], ...((isAws || isMs) ? [['End user type', endUserType || '—'] as [string, string]] : [])],
    money: [['Annual revenue', money(annualRevenue)], ['Estimated MRR', money(estimatedMRR)], ['Expiration', expirationDate || '—'], ['Country · currency', `${country} · ${currency}`]],
  };

  const body: Record<WizardSection, React.ReactNode> = {
    customer: (
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {customers ? (
                <Field label="Customer" wide required error={hasError('accountId')}>
                  <Combobox
                    options={customerOptions}
                    value={customerId}
                    onValueChange={handleCustomerChange}
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
              <Field label="Contact" required error={hasError('contactId')}>
                <Combobox
                  options={contactOptions}
                  value={contactId === '__none' ? '' : contactId}
                  onValueChange={(v) => setContactId(v || '__none')}
                  placeholder={customerId ? 'Select contact' : 'Pick a customer first'}
                  emptyText={customerId ? 'No contacts for this customer' : 'Pick a customer first'}
                />
              </Field>
              <Field label="BCN" required error={hasError('bcn')}>
                <Input value={bcn} onChange={(e) => setBcn(e.target.value)} placeholder="Auto-filled from customer" />
              </Field>
              <Field label="Secondary Owner" wide colSpan={2}>
                <Combobox
                  options={[
                    { value: SECONDARY_OWNER_NONE, label: '—' },
                    ...cloudUsers.map((u) => ({ value: u.id, label: formatDisplayName(u.name) })),
                  ]}
                  value={secondaryOwnerId}
                  onValueChange={setSecondaryOwnerId}
                  placeholder="Select secondary owner"
                  searchPlaceholder="Search Cloud Belux Sales..."
                  emptyText="No users found"
                />
              </Field>
      </div>
    ),
    deal: (
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Subject" wide required error={hasError('subject')}>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="BE - #Service Name - Reseller - Vendor - End Customer - ARR" />
              </Field>
        <Field label="Stage" colSpan={2}>
          <StagePicker currentStage={stage} onSelect={setStage} />
        </Field>
              <Field label="Single or Cross Sell" required error={hasError('singleOrCrossSell')}>
                <Select value={singleOrCrossSell} onValueChange={setSingleOrCrossSell}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SINGLE_OR_CROSS_SELL.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Type" required error={hasError('type')}>
                <Select value={sellType} onValueChange={setSellType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SELL_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Opp Type" required error={hasError('opportunityType')}>
                <Select value={opportunityType} onValueChange={setOpportunityType}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {opportunityTypeOptions.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Customer Need" wide colSpan={2} required error={hasError('customerNeed')}>
                <Textarea
                  value={customerNeed}
                  onChange={(e) => setCustomerNeed(e.target.value)}
                  rows={2}
                  placeholder="What does the customer need?"
                />
              </Field>
      </div>
    ),
    vendor: (
      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Field label="Primary Vendor" wide required error={hasError('primaryVendor')}>
                  <Combobox
                    options={vendorOptions}
                    value={primaryVendor}
                    onValueChange={setPrimaryVendor}
                    placeholder="Select vendor"
                    emptyText="No vendor found — sync to load D365 vendors"
                  />
                </Field>
        </div>
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
              <Section title="AWS configuration" subtitle={isReq('apnId') ? 'Required at this stage' : 'Optional until Qualified'}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="APN ID" required={isReq('apnId')} error={hasError('apnId')}>
                    <Input value={apnId} onChange={(e) => setApnId(e.target.value)} />
                  </Field>
                  <Field label="AWS Partner Type" required={isReq('awsPartnerType')} error={hasError('awsPartnerType')}>
                    <Select value={awsPartnerType} onValueChange={setAwsPartnerType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {AWS_PARTNER_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="AWS Service Type" wide required={isReq('awsServiceType')} error={hasError('awsServiceType')}>
                    <Select value={awsServiceType} onValueChange={setAwsServiceType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {AWS_SERVICE_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="APN Tagging" required={isReq('apnTagging')} error={hasError('apnTagging')}>
                    <Select value={apnTagging} onValueChange={setApnTagging}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {APN_TAGGING_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="End User Type" required={isReq('endUserType')} error={hasError('endUserType')}>
                    <Select value={endUserType} onValueChange={setEndUserType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {END_USER_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Support Type" required={isReq('supportType')} error={hasError('supportType')}>
                    <Select value={supportType} onValueChange={setSupportType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {SUPPORT_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Payer Account" required={isReq('payerAccount')} error={hasError('payerAccount')}>
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
                          <Field label="Existing Payee Account" required={isReq('existingPayeeAccount')} error={hasError('existingPayeeAccount')}>
                            <Input value={existingPayeeAccount} onChange={(e) => setExistingPayeeAccount(e.target.value)} />
                          </Field>
                          <Field label="Consolidation Acceptance Date">
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
              <Section title="Microsoft configuration" subtitle={isReq('msCspTenant') ? 'Required at this stage' : 'Optional until Qualified'}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="MS CSP Tenant" required={isReq('msCspTenant')} error={hasError('msCspTenant')}>
                    <Input value={msCspTenant} onChange={(e) => setMsCspTenant(e.target.value)} />
                  </Field>
                  <Field label="MPN ID" required={isReq('mpnId')} error={hasError('mpnId')}>
                    <Input value={mpnId} onChange={(e) => setMpnId(e.target.value)} />
                  </Field>
                  <Field label="Migration Type" required={isReq('migrationType')} error={hasError('migrationType')}>
                    <Select value={migrationType} onValueChange={setMigrationType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {MIGRATION_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="End User Type" required={isReq('endUserType')} error={hasError('endUserType')}>
                    <Select value={endUserType} onValueChange={setEndUserType}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {END_USER_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Service Name" wide required={isReq('serviceName')} error={hasError('serviceName')}>
                    <Combobox
                      options={serviceNameOptions}
                      value={serviceName ?? ''}
                      onValueChange={setServiceName}
                      placeholder="Select service"
                      emptyText="No service found — sync to load D365 services"
                    />
                  </Field>
                  <Field label="Competitive Winback" wide required={isReq('competitiveWinback')} error={hasError('competitiveWinback')}>
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
                <Field label="Public Sector Segment">
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
      </div>
    ),
    money: (
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Country" required error={hasError('country')}>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {countryList.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Currency" required error={hasError('currency')}>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencyList.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
          <Field label={`Estimated MRR (${currency})`} required error={hasError('estimatedMRR')}>
              <MoneyInput value={estimatedMRR} onValueChange={updateEstimatedMRR} currency={currency} />
          </Field>
          <Field label={`Annual Revenue (${currency})`} required error={hasError('annualRevenue')}>
              <MoneyInput value={annualRevenue} onValueChange={updateAnnualRevenue} currency={currency} />
          </Field>
          <Field label={`Est. Margin (${currency})`}>
              <MoneyInput value={estimatedMargin} onValueChange={setEstimatedMargin} currency={currency} />
          </Field>
          <Field label="Expiration Date">
              <DatePicker value={expirationDate} onChange={setExpirationDate} />
          </Field>
      </div>
    ),
    review: (
      <div className="grid gap-2.5">
        {missingFields.length > 0 ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>Still needed: {missingFields.map(fieldLabel).join(', ')}</span>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-[13px] text-success">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
            <span>Everything required for <b>{stage}</b> is filled in.</span>
          </div>
        )}
        {(Object.keys(reviewRows) as FieldSection[]).map((sec) => (
          <section key={sec} className="overflow-hidden rounded-[calc(var(--radius)*1.5)] border border-border bg-card">
            <div className="flex min-h-[38px] items-center gap-2 border-b border-border px-3">
              <h4 className="flex-1 text-[12.5px] font-semibold">{WIZARD_SECTIONS.find((x) => x.id === sec)?.label}</h4>
              {missingBySection[sec] > 0 && <Badge variant="destructive">{missingBySection[sec]} missing</Badge>}
              <button type="button" onClick={() => setSection(sec)} className="text-xs font-medium text-accent-foreground hover:underline">Edit</button>
            </div>
            <dl className="grid grid-cols-[140px_minmax(0,1fr)] gap-x-3 gap-y-1.5 px-3 py-2.5 text-[13px]">
              {reviewRows[sec].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="min-w-0 break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    ),
  };

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
      <div className="flex items-start gap-3 border-b border-border py-3.5 pl-5 pr-12">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isEditing ? 'Edit opportunity' : 'New opportunity'}
            {isEditing && opportunity?.remoteId && (
              <button
                type="button"
                className="inline-flex items-center gap-1 hover:text-foreground"
                onClick={() => navigator.clipboard.writeText(opportunity.opportunityNumber ?? opportunity.remoteId!)}
                title={opportunity.opportunityNumber ? 'Copy opportunity ID' : 'Copy D365 ID'}
              >
                · <Copy size={11} /> {opportunity.opportunityNumber ?? `${opportunity.remoteId.slice(0, 8)}…`}
              </button>
            )}
          </div>
          <h2 className="truncate text-[17px] font-semibold tracking-[-0.01em]">{subject || 'Untitled opportunity'}</h2>
        </div>
        {isEditing && (
          <Badge variant={opportunity?.status === 'Open' ? 'secondary' : opportunity?.status === 'Won' ? 'success' : 'destructive'}>
            {opportunity?.status}
          </Badge>
        )}
        <Badge variant="purple" data-testid="stage-chip">{stage} · {probability}%</Badge>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)] max-md:grid-cols-1 max-md:grid-rows-[auto_minmax(0,1fr)]">
        <nav aria-label="Opportunity sections" className="flex min-h-0 flex-col gap-0.5 overflow-y-auto border-r border-border bg-surface-2 px-2 py-3 max-md:flex-row max-md:border-b max-md:border-r-0">
          {WIZARD_SECTIONS.map((sec, idx) => {
            const missing = sec.id === 'review' ? 0 : missingBySection[sec.id];
            const showMissing = showErrors && missing > 0;
            const done = sec.id !== 'review' && missing === 0 && (isEditing || idx < sectionIndex);
            const current = sec.id === section;
            return (
              <button
                key={sec.id}
                type="button"
                aria-current={current ? 'step' : undefined}
                onClick={() => setSection(sec.id)}
                className={cn('flex shrink-0 items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-sunken', current && 'bg-accent hover:bg-accent')}
              >
                <span
                  className={cn(
                    'grid size-[22px] shrink-0 place-items-center rounded-full border border-border-strong bg-sunken text-[11px] font-semibold text-muted-foreground',
                    current && 'border-primary bg-primary text-primary-foreground',
                    done && !current && 'border-transparent bg-success/15 text-success',
                    showMissing && 'border-destructive bg-destructive text-white',
                  )}
                >
                  {showMissing ? '!' : done ? <Check size={11} /> : idx + 1}
                </span>
                <span className="min-w-0 flex-1 max-md:hidden">
                  <b className="block text-[13px] font-medium">{sec.label}</b>
                  <span className="block text-[11.5px] text-muted-foreground">
                    {sec.id === 'review' ? 'Check and save' : showMissing ? `${missing} missing` : `${requiredBySection[sec.id]} required`}
                  </span>
                </span>
              </button>
            );
          })}
          {isEditing && opportunity?.status === 'Open' && (
            <div className="mt-auto grid gap-1.5 border-t border-border px-1.5 pb-1 pt-2.5 max-md:hidden">
              <span className="text-[11.5px] text-muted-foreground">Close this deal</span>
              <Button type="button" size="sm" variant="outline" onClick={onCloseWon} className="justify-start text-success hover:text-success">
                <Trophy size={13} />Close as Won
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={onCloseLost} className="justify-start text-destructive hover:text-destructive">
                <XOctagon size={13} />Close as Lost
              </Button>
            </div>
          )}
        </nav>

        <div className="min-w-0 overflow-y-auto px-[22px] pb-6 pt-4">
          <h3 className="mb-3 text-[15px] font-semibold">{WIZARD_SECTIONS[sectionIndex].label}</h3>
          <motion.div key={section} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.16 }}>
            {body[section]}
          </motion.div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border bg-card px-5 py-3">
        <span className={cn('text-xs tabular-nums', showErrors && !allRequiredFilled ? 'text-destructive' : 'text-muted-foreground')}>
          {filledRequiredCount} / {requiredFields.length} required filled
        </span>
        <span className="flex-1" />
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
        {sectionIndex > 0 && (
          <Button type="button" variant="outline" onClick={() => setSection(WIZARD_SECTIONS[sectionIndex - 1].id)}>Back</Button>
        )}
        {sectionIndex < WIZARD_SECTIONS.length - 1 && (
          <Button type="button" variant="outline" onClick={() => setSection(WIZARD_SECTIONS[sectionIndex + 1].id)}>Next</Button>
        )}
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : isEditing ? 'Save' : 'Create opportunity'}
        </Button>
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

function Field({ label, children, wide, colSpan, required, error }: { label: string; children: React.ReactNode; wide?: boolean; colSpan?: number; required?: boolean; error?: boolean }) {
  void wide;
  const errorClasses = error
    ? '[&_input]:!border-destructive [&_textarea]:!border-destructive [&_button[role=combobox]]:!border-destructive [&_input]:focus-visible:!ring-destructive [&_textarea]:focus-visible:!ring-destructive [&_button[role=combobox]]:focus:!ring-destructive'
    : '';
  return (
    <div className={`space-y-1 ${colSpan === 2 ? 'col-span-2' : ''} ${errorClasses}`}>
      <Label className={`text-xs font-medium text-foreground-2 ${error ? '!text-destructive' : ''}`}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}

interface StagePickerProps {
  currentStage: Stage;
  onSelect: (s: Stage) => void;
}

/** Stage pills: earlier stages ticked, the current one filled; Billing Rejection is a dashed side branch. */
function StagePicker({ currentStage, onSelect }: StagePickerProps) {
  const currentIdx = STAGES.indexOf(currentStage);
  const isBillingRejection = currentStage === 'Billing Rejection';
  return (
    <div className="flex flex-wrap gap-1">
      {STAGES.map((s, i) => {
        const isActive = s === currentStage;
        const isBranch = s === 'Billing Rejection';
        const isPast = !isBillingRejection && !isBranch && i < currentIdx;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onSelect(s)}
            aria-pressed={isActive}
            title={`${s} (${STAGE_PROBABILITY[s]}%)`}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-full border border-border-strong bg-card px-2.5 text-xs font-medium transition-colors hover:bg-surface-2',
              isPast && 'border-primary/40 text-accent-foreground',
              isBranch && 'border-dashed',
              isActive && 'border-primary bg-primary text-primary-foreground hover:bg-primary',
            )}
          >
            {isPast && <Check size={11} />}
            {s}
            <small className={cn('text-[10.5px]', isActive ? 'opacity-80' : 'text-faint')}>{STAGE_PROBABILITY[s]}%</small>
          </button>
        );
      })}
    </div>
  );
}
