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

export const AWS_PARTNER_TYPES = ['Software', 'Services', 'Hardware'] as const;
export const APN_TAGGING_OPTIONS = ['Internal', 'External'] as const;
export const SUPPORT_TYPES = ['Developer', 'Business', 'Enterprise', 'Basic'] as const;

export const MIGRATION_TYPES = [
  'CSP to CSP',
  'Current Partner with Transition',
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
export const SELL_TYPES = ['New', 'Renewal', 'Add-on'] as const;
export const OPP_TYPES_AZURE = [
  'Services', 'SPA', 'SPA - Partner Agreement', 'CMP', 'Trad', 'MPO2Connect', 'Azure Private Offer', 'Breath',
] as const;

export const COUNTRIES = ['Belgium', 'Luxembourg', 'Netherlands'] as const;
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
  'Cancelled', 'Out Sold', 'Lost to IM Competitor', 'Postponed / Put On Hold',
  'Price', 'Solution', 'Partner Taken In house', 'Service not Required',
  'Kit Decommissioned', 'System Bulk Close Job', 'Deal Analyzer Rejected',
] as const;
export type LostStatusReason = typeof LOST_STATUS_REASONS[number];

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
  return !!vendor && (AWS_VENDORS as readonly string[]).includes(vendor);
}

export function isMicrosoftVendor(vendor: string | null | undefined): boolean {
  return !!vendor && (MICROSOFT_VENDORS as readonly string[]).includes(vendor);
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
