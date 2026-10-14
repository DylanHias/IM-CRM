import type { FieldKey } from '@/lib/opportunityRules';

export type WizardSection = 'customer' | 'deal' | 'vendor' | 'money' | 'review';
export type FieldSection = Exclude<WizardSection, 'review'>;

export const WIZARD_SECTIONS: { id: WizardSection; label: string }[] = [
  { id: 'customer', label: 'Customer' },
  { id: 'deal', label: 'Deal' },
  { id: 'vendor', label: 'Vendor' },
  { id: 'money', label: 'Financials' },
  { id: 'review', label: 'Review' },
];

const SECTION_FIELDS: Record<FieldSection, readonly FieldKey[]> = {
  customer: ['accountId', 'contactId', 'bcn'],
  deal: ['subject', 'stage', 'singleOrCrossSell', 'type', 'opportunityType', 'customerNeed'],
  vendor: [
    'primaryVendor', 'apnId', 'awsPartnerType', 'awsServiceType', 'apnTagging', 'endUserType', 'supportType',
    'payerAccount', 'existingPayeeAccount', 'consolidationAcceptanceDate', 'msCspTenant', 'mpnId',
    'migrationType', 'serviceName', 'competitiveWinback', 'publicSectorSegment',
  ],
  money: ['country', 'currency', 'estimatedMRR', 'annualRevenue', 'expirationDate'],
};

/** The wizard section a field is edited in; null for fields filled automatically (record type, source). */
export function sectionOf(field: FieldKey): FieldSection | null {
  for (const [section, fields] of Object.entries(SECTION_FIELDS) as [FieldSection, readonly FieldKey[]][]) {
    if (fields.includes(field)) return section;
  }
  return null;
}

export function countBySection(fields: readonly FieldKey[]): Record<FieldSection, number> {
  const counts: Record<FieldSection, number> = { customer: 0, deal: 0, vendor: 0, money: 0 };
  for (const f of fields) {
    const s = sectionOf(f);
    if (s) counts[s] += 1;
  }
  return counts;
}
