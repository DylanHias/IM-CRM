export const STAGES = [
  'Prospecting',
  'Validated',
  'Qualified',
  'Verbal Received',
  'Contract Received',
  'Billing Rejection',
  'Pending Vendor Confirmation',
  'Purchased',
] as const;
export type Stage = typeof STAGES[number];

export const STAGE_PROBABILITY: Record<Stage, number> = {
  'Prospecting': 5,
  'Validated': 25,
  'Qualified': 50,
  'Verbal Received': 75,
  'Contract Received': 100,
  'Billing Rejection': 100,
  'Pending Vendor Confirmation': 100,
  'Purchased': 100,
};

/** Legacy static lists — vendors are now sourced from D365's im360_vendors table.
 *  Kept only as a hint for tests / fallback display. Use isAwsVendor/isMicrosoftVendor for gating logic. */
export const AWS_VENDORS = ['AWS - CONSOLIDATED', 'AWS - STANDALONE'] as const;
export const MICROSOFT_VENDORS = ['MICROSOFT - AZURE', 'MICROSOFT - CLOUD'] as const;
export const SUPPORTED_VENDORS = [...AWS_VENDORS, ...MICROSOFT_VENDORS] as const;
export type SupportedVendor = typeof SUPPORTED_VENDORS[number];

export const AWS_SERVICE_TYPES = [
  'Direct Consolidation',
  'Direct Consolidation – Cloud Marketplace (CMP)',
  'New Reseller Account – No Root Access',
  'New Sub Account – No Root Access',
  'RI Program Management',
] as const;
export type AwsServiceType = typeof AWS_SERVICE_TYPES[number];

export const CONSOLIDATED_AWS_SERVICE_TYPES: readonly AwsServiceType[] = [
  'Direct Consolidation',
  'Direct Consolidation – Cloud Marketplace (CMP)',
];

export const AWS_PARTNER_TYPES = ['Service', 'Software'] as const;
export const APN_TAGGING_OPTIONS = ['Internal', 'End User'] as const;
export const SUPPORT_TYPES = ['Developer', 'Business', 'Enterprise', 'Partner Led', 'Basic'] as const;

export const MIGRATION_TYPES = [
  'CSP to CSP',
  'Current Partner Growth Transition',
  'EA to CSP',
  'ISV',
  'New Reseller',
  'PAYG',
  'Tier 1',
] as const;
export type MigrationType = typeof MIGRATION_TYPES[number];

export const END_USER_TYPES = ['Commercial', 'Public Sector'] as const;
export type EndUserType = typeof END_USER_TYPES[number];

export const PUBLIC_SECTOR_SEGMENTS = [
  'SLG – IMGSA', 'EDU – IMGSA', 'Federal – IMGSA', 'Healthcare – IMGSA',
  'SLG – IMNCPA', 'EDU – IMNCPA', 'Federal – IMNCPA', 'Healthcare – IMNCPA',
  'SLG – No Contract', 'EDU – No Contract', 'Federal – No Contract', 'Healthcare – No Contract',
  'Non-Profit',
  'SLG – IM OMNIA', 'EDU – IM OMNIA', 'Healthcare – IM OMNIA',
] as const;
export type PublicSectorSegment = typeof PUBLIC_SECTOR_SEGMENTS[number];

export const SINGLE_OR_CROSS_SELL = ['Single', 'Cross Sell'] as const;
export const SELL_TYPES = ['New', 'Install'] as const;
export const OPP_TYPES_AZURE = [
  'Services', 'SPA', 'SPA - Partner Agreement', 'CMP', 'Trad', 'MPO2Connect', 'Azure Private Offer', 'Breath',
] as const;

export const COMPETITIVE_WINBACK_OPTIONS = ['Yes', 'No', 'Unknown'] as const;
export type CompetitiveWinback = typeof COMPETITIVE_WINBACK_OPTIONS[number];

export const COUNTRIES = ['Belgium', 'Netherlands'] as const;
export type Country = typeof COUNTRIES[number];

export const CURRENCIES = ['USD', 'EUR'] as const;
export type Currency = typeof CURRENCIES[number];

export const WON_STATUS_REASONS = [
  'Purchased', 'Bulk Closed', 'Won', 'PO received', 'Invoiced to Reseller', 'Deal Analyzer-Approved',
] as const;
export type WonStatusReason = typeof WON_STATUS_REASONS[number];

export const LOST_STATUS_REASONS = [
  'Returned', 'Auto-Created', 'Budgetary Only', 'No Stock', 'Lost/Not Pursued',
  'Duplicate Opportunity', 'Reseller / Partner Lost Opportunity', 'Duplicate Vendor',
  'Not Interested', 'Won with Another Reseller', 'Gone Direct', 'Won by Cloud',
  'No Feedback from Customer', 'Lack of Credit', 'Bulk Closed', 'Declined',
  'Canceled', 'Out-Sold', 'Lost to IM Competitor', 'Postponed / Put On Hold',
  'Price', 'Solution', 'Partner Taken In house', 'Service not Required',
  'Kit Decommissioned', 'System Bulk Close Job', 'Deal Analyzer-Rejected',
] as const;
export type LostStatusReason = typeof LOST_STATUS_REASONS[number];

/** D365 statuscode values for opportunity won/lost reasons. */
export const STATUS_REASON_CODES: Record<string, number> = {
  // Won (statecode=1)
  'Purchased': 100000004,
  'Bulk Closed': 700910001,
  'Won': 3,
  'PO received': 756150003,
  'Invoiced to Reseller': 756150004,
  'Deal Analyzer-Approved': 756150025,
  // Lost (statecode=2)
  'Returned': 100000005,
  'Auto-Created': 100000008,
  'Budgetary Only': 100000009,
  'No Stock': 700910003,
  'Lost/Not Pursued': 100000010,
  'Duplicate Opportunity': 100000011,
  'Reseller / Partner Lost Opportunity': 756150005,
  'Duplicate Vendor': 100000012,
  'Not Interested': 756150013,
  'Won with Another Reseller': 756150006,
  'Gone Direct': 756150007,
  'Won by Cloud': 756150008,
  'No Feedback from Customer': 756150009,
  'Lack of Credit': 756150010,
  'Declined': 700910002,
  'Canceled': 4,
  'Out-Sold': 5,
  'Lost to IM Competitor': 756150002,
  'Postponed / Put On Hold': 756150011,
  'Price': 756150018,
  'Solution': 756150019,
  'Partner Taken In house': 756150020,
  'Service not Required': 756150021,
  'Kit Decommissioned': 756150022,
  'System Bulk Close Job': 336770001,
  'Deal Analyzer-Rejected': 756150026,
};

/** Special-case 'Bulk Closed' has different codes per state (won=700910001, lost=700910000). */
export function getStatusReasonCode(label: string, status: 'Won' | 'Lost'): number | null {
  if (label === 'Bulk Closed' && status === 'Lost') return 700910000;
  return STATUS_REASON_CODES[label] ?? null;
}

export type FieldKey =
  | 'subject' | 'accountId' | 'contactId' | 'singleOrCrossSell' | 'type'
  | 'primaryVendor' | 'opportunityType' | 'country' | 'currency' | 'stage'
  | 'bcn' | 'recordType' | 'source' | 'customerNeed'
  | 'estimatedMRR' | 'annualRevenue' | 'expirationDate'
  | 'apnId' | 'awsPartnerType' | 'awsServiceType' | 'apnTagging' | 'endUserType'
  | 'supportType' | 'payerAccount' | 'existingPayeeAccount' | 'consolidationAcceptanceDate'
  | 'msCspTenant' | 'mpnId' | 'migrationType' | 'serviceName' | 'competitiveWinback'
  | 'publicSectorSegment';

const BASE_REQUIRED: readonly FieldKey[] = [
  'subject', 'accountId', 'contactId', 'singleOrCrossSell', 'type',
  'primaryVendor', 'opportunityType', 'country', 'currency', 'stage',
  'bcn', 'customerNeed', 'estimatedMRR', 'annualRevenue',
] as const;

const AWS_REQUIRED: readonly FieldKey[] = [
  'apnId', 'awsPartnerType', 'awsServiceType', 'apnTagging',
  'endUserType', 'supportType', 'payerAccount',
] as const;

const MICROSOFT_REQUIRED: readonly FieldKey[] = [
  'msCspTenant', 'mpnId', 'migrationType', 'endUserType',
  'serviceName', 'competitiveWinback',
] as const;

export interface OpportunityRulesState {
  primaryVendor?: string | null;
  awsServiceType?: string | null;
  endUserType?: string | null;
}

export function isAwsVendor(vendor: string | null | undefined): boolean {
  if (!vendor) return false;
  return /^aws\b/i.test(vendor.trim());
}

export function isMicrosoftVendor(vendor: string | null | undefined): boolean {
  if (!vendor) return false;
  return /^(microsoft|azure)\b/i.test(vendor.trim());
}

export function isConsolidatedAwsServiceType(value: string | null | undefined): boolean {
  return !!value && (CONSOLIDATED_AWS_SERVICE_TYPES as readonly string[]).includes(value);
}

export function getRequiredFields(state: OpportunityRulesState): FieldKey[] {
  const fields: FieldKey[] = [...BASE_REQUIRED];

  if (isAwsVendor(state.primaryVendor)) {
    fields.push(...AWS_REQUIRED);
    if (isConsolidatedAwsServiceType(state.awsServiceType)) {
      fields.push('existingPayeeAccount', 'consolidationAcceptanceDate');
    }
  }

  if (isMicrosoftVendor(state.primaryVendor)) {
    fields.push(...MICROSOFT_REQUIRED);
  }

  if (state.endUserType === 'Public Sector') {
    fields.push('publicSectorSegment');
  }

  return fields;
}

export function isFieldVisible(field: FieldKey, state: OpportunityRulesState): boolean {
  if ((BASE_REQUIRED as readonly FieldKey[]).includes(field)) return true;
  if ((AWS_REQUIRED as readonly FieldKey[]).includes(field)) return isAwsVendor(state.primaryVendor);
  if (field === 'existingPayeeAccount' || field === 'consolidationAcceptanceDate') {
    return isAwsVendor(state.primaryVendor) && isConsolidatedAwsServiceType(state.awsServiceType);
  }
  if ((MICROSOFT_REQUIRED as readonly FieldKey[]).includes(field)) return isMicrosoftVendor(state.primaryVendor);
  if (field === 'publicSectorSegment') return state.endUserType === 'Public Sector';
  if (field === 'expirationDate' || field === 'recordType' || field === 'source') return true;
  return false;
}

export function getStageProbability(stage: Stage): number {
  return STAGE_PROBABILITY[stage];
}

export function getNextStage(stage: Stage): Stage | null {
  const i = STAGES.indexOf(stage);
  if (i < 0 || i >= STAGES.length - 1) return null;
  return STAGES[i + 1];
}

export function getPreviousStage(stage: Stage): Stage | null {
  const i = STAGES.indexOf(stage);
  if (i <= 0) return null;
  return STAGES[i - 1];
}

export const EMPTY_OPP_EXTRA_FIELDS = {
  singleOrCrossSell: null,
  estimatedMRR: null,
  annualRevenue: null,
  apnId: null,
  awsPartnerType: null,
  awsServiceType: null,
  apnTagging: null,
  endUserType: null,
  supportType: null,
  payerAccount: null,
  existingPayeeAccount: null,
  consolidationAcceptanceDate: null,
  msCspTenant: null,
  mpnId: null,
  migrationType: null,
  serviceName: null,
  competitiveWinback: null,
  publicSectorSegment: null,
  statusReason: null,
  actualRevenue: null,
  closeDate: null,
  competitorId: null,
  closeDescription: null,
} as const;

export const STAGE_FIELD_GROUPS: Record<Stage, FieldKey[]> = {
  'Prospecting': [
    'subject', 'accountId', 'contactId', 'bcn',
    'singleOrCrossSell', 'type', 'primaryVendor', 'opportunityType',
    'customerNeed',
  ],
  'Validated': [
    'apnId', 'awsPartnerType', 'awsServiceType', 'apnTagging',
    'endUserType', 'supportType', 'payerAccount',
    'existingPayeeAccount', 'consolidationAcceptanceDate',
    'msCspTenant', 'mpnId', 'migrationType', 'serviceName', 'competitiveWinback',
    'publicSectorSegment',
  ],
  'Qualified': [
    'estimatedMRR', 'annualRevenue', 'expirationDate', 'country', 'currency',
  ],
  'Verbal Received': [],
  'Contract Received': [],
  'Billing Rejection': [],
  'Pending Vendor Confirmation': [],
  'Purchased': [],
};
