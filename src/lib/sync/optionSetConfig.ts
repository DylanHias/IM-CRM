import type { OptionSetItem } from '@/types/optionSet';

interface OptionSetFieldConfig {
  entityName: string;
  attributeName: string;
  fallbackOptions: OptionSetItem[];
}

export type OptionSetFieldKey =
  | 'account.industrycode'
  | 'opportunity.stage'
  | 'opportunity.selltype'
  | 'opportunity.opptype'
  | 'opportunity.recordtype'
  | 'opportunity.source'
  | 'opportunity.singleorcrosssell'
  | 'opportunity.awspartnertype'
  | 'opportunity.awsservicetype'
  | 'opportunity.apntagging'
  | 'opportunity.endusertype'
  | 'opportunity.supporttype'
  | 'opportunity.migrationtype'
  | 'opportunity.publicsectorsegment';

export const OPTION_SET_FIELDS: Record<OptionSetFieldKey, OptionSetFieldConfig> = {
  'account.industrycode': {
    entityName: 'account',
    attributeName: 'industrycode',
    fallbackOptions: [
      { value: 1, label: 'Accounting' },
      { value: 2, label: 'Agriculture and Non-petrol Natural Resource Extraction' },
      { value: 3, label: 'Broadcasting Printing and Publishing' },
      { value: 4, label: 'Brokers' },
      { value: 5, label: 'Building Supply Retail' },
      { value: 6, label: 'Business Services' },
      { value: 7, label: 'Consulting' },
      { value: 8, label: 'Consumer Services' },
      { value: 9, label: 'Design, Direction and Creative Management' },
      { value: 10, label: 'Distributors, Dispatchers and Processors' },
      { value: 11, label: "Doctor's Offices and Clinics" },
      { value: 12, label: 'Durable Manufacturing' },
      { value: 13, label: 'Eating and Drinking Places' },
      { value: 14, label: 'Entertainment Retail' },
      { value: 15, label: 'Equipment Rental and Leasing' },
      { value: 16, label: 'Financial' },
      { value: 17, label: 'Food and Tobacco Processing' },
      { value: 18, label: 'Inbound Capital Intensive Processing' },
      { value: 19, label: 'Inbound Repair and Services' },
      { value: 20, label: 'Insurance' },
      { value: 21, label: 'Legal Services' },
      { value: 22, label: 'Non-Durable Merchandise Retail' },
      { value: 23, label: 'Outbound Consumer Service' },
      { value: 24, label: 'Petrochemical Extraction and Distribution' },
      { value: 25, label: 'Service Retail' },
      { value: 26, label: 'SIG Affiliations' },
      { value: 27, label: 'Social Services' },
      { value: 28, label: 'Special Outbound Trade Contractors' },
      { value: 29, label: 'Specialty Realty' },
      { value: 30, label: 'Transportation' },
      { value: 31, label: 'Utility Creation and Distribution' },
      { value: 32, label: 'Vehicle Retail' },
      { value: 33, label: 'Wholesale' },
    ],
  },
  'opportunity.stage': {
    entityName: 'opportunity',
    attributeName: 'im360_oppstage',
    fallbackOptions: [
      { value: 100000000, label: 'Prospecting' },
      { value: 100000001, label: 'Validated' },
      { value: 100000002, label: 'Qualified' },
      { value: 100000003, label: 'Verbal Received' },
      { value: 100000004, label: 'Contract Received' },
      { value: 100000005, label: 'Billing Rejection' },
      { value: 100000006, label: 'Pending Vendor Confirmation' },
      { value: 100000007, label: 'Purchased' },
    ],
  },
  'opportunity.selltype': {
    entityName: 'opportunity',
    attributeName: 'im360_opptype',
    fallbackOptions: [
      { value: 100000000, label: 'New' },
      { value: 100000001, label: 'Install' },
    ],
  },
  'opportunity.opptype': {
    entityName: 'opportunity',
    attributeName: 'im360_drpboxopptype',
    fallbackOptions: [
      { value: 100000003, label: 'Services' },
      { value: 100000004, label: 'SPA' },
      { value: 100000005, label: 'SPA - Partner Agreement' },
      { value: 100000000, label: 'CMP' },
      { value: 100000001, label: 'Trad' },
      { value: 100000002, label: 'MPO2Connect' },
      { value: 336770001, label: 'Azure Private Offer' },
      { value: 336770002, label: 'Breath' },
    ],
  },
  'opportunity.recordtype': {
    entityName: 'opportunity',
    attributeName: 'im360_recordtype',
    fallbackOptions: [
      { value: 0, label: 'Sales' },
    ],
  },
  'opportunity.source': {
    entityName: 'opportunity',
    attributeName: 'im360_source',
    fallbackOptions: [
      { value: 0, label: 'cloud' },
    ],
  },
  'opportunity.singleorcrosssell': {
    entityName: 'opportunity',
    attributeName: 'im360_singleorcrosssell',
    fallbackOptions: [
      { value: 100000000, label: 'Single' },
      { value: 100000001, label: 'Cross Sell' },
    ],
  },
  'opportunity.awspartnertype': {
    entityName: 'opportunity',
    attributeName: 'im360_awspartnertype1',
    fallbackOptions: [
      { value: 100000000, label: 'Service' },
      { value: 100000001, label: 'Software' },
    ],
  },
  'opportunity.awsservicetype': {
    entityName: 'opportunity',
    attributeName: 'im360_awsservicetype',
    fallbackOptions: [
      { value: 100000000, label: 'Direct Consolidation' },
      { value: 100000001, label: 'Direct Consolidation – Cloud Marketplace (CMP)' },
      { value: 100000002, label: 'New Reseller Account – No Root Access' },
      { value: 100000003, label: 'New Sub Account – No Root Access' },
      { value: 100000004, label: 'RI Program Management' },
    ],
  },
  'opportunity.apntagging': {
    entityName: 'opportunity',
    attributeName: 'im360_apntagging',
    fallbackOptions: [
      { value: 100000000, label: 'Internal' },
      { value: 100000001, label: 'End User' },
    ],
  },
  'opportunity.endusertype': {
    entityName: 'opportunity',
    attributeName: 'im360_endusertype',
    fallbackOptions: [
      { value: 100000000, label: 'Commercial' },
      { value: 100000001, label: 'Public Sector' },
    ],
  },
  'opportunity.supporttype': {
    entityName: 'opportunity',
    attributeName: 'im360_supporttype',
    fallbackOptions: [
      { value: 100000000, label: 'Developer' },
      { value: 100000001, label: 'Business' },
      { value: 100000002, label: 'Enterprise' },
      { value: 100000003, label: 'Partner Led' },
      { value: 100000004, label: 'Basic' },
    ],
  },
  'opportunity.migrationtype': {
    entityName: 'opportunity',
    attributeName: 'im360_migrationtype',
    fallbackOptions: [
      { value: 100000000, label: 'CSP to CSP' },
      { value: 100000001, label: 'Current Partner Growth Transition' },
      { value: 100000002, label: 'EA to CSP' },
      { value: 100000003, label: 'ISV' },
      { value: 100000004, label: 'New Reseller' },
      { value: 100000005, label: 'PAYG' },
      { value: 100000006, label: 'Tier 1' },
    ],
  },
  'opportunity.publicsectorsegment': {
    entityName: 'opportunity',
    attributeName: 'im360_publicsectorsegment',
    fallbackOptions: [
      { value: 100000000, label: 'SLG – IMGSA' },
      { value: 100000001, label: 'EDU – IMGSA' },
      { value: 100000002, label: 'Federal – IMGSA' },
      { value: 100000003, label: 'Healthcare – IMGSA' },
      { value: 100000004, label: 'SLG – IMNCPA' },
      { value: 100000005, label: 'EDU – IMNCPA' },
      { value: 100000006, label: 'Federal – IMNCPA' },
      { value: 100000007, label: 'Healthcare – IMNCPA' },
      { value: 100000008, label: 'SLG – No Contract' },
      { value: 100000009, label: 'EDU – No Contract' },
      { value: 100000010, label: 'Federal – No Contract' },
      { value: 100000011, label: 'Healthcare – No Contract' },
      { value: 100000012, label: 'Non-Profit' },
      { value: 100000013, label: 'SLG – IM OMNIA' },
      { value: 100000014, label: 'EDU – IM OMNIA' },
      { value: 100000015, label: 'Healthcare – IM OMNIA' },
    ],
  },
};
