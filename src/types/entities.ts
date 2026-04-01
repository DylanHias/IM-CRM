export interface Customer {
  id: string;
  name: string;
  accountNumber: string | null;
  bcn: string | null;
  resellerId: string | null;
  industry: string | null;
  segment: string | null;
  ownerId: string | null;
  ownerName: string | null;
  phone: string | null;
  email: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressCountry: string | null;
  website: string | null;
  cloudCustomer: boolean | null;
  language: string | null;
  arr: number | null;
  status: 'active' | 'inactive';
  lastActivityAt: string | null;
  syncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  notes: string | null;
  contactType: string | null;
  syncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType = 'meeting' | 'visit' | 'call' | 'note';

export type ActivitySource = 'local' | 'd365';

export interface Activity {
  id: string;
  customerId: string;
  contactId: string | null;
  type: ActivityType;
  subject: string;
  description: string | null;
  occurredAt: string;
  startTime: string | null;
  createdById: string;
  createdByName: string;
  syncStatus: 'pending' | 'synced' | 'error';
  remoteId: string | null;
  source: ActivitySource;
  createdAt: string;
  updatedAt: string;
}

export type FollowUpSource = 'local' | 'd365';

export interface FollowUp {
  id: string;
  customerId: string;
  activityId: string | null;
  title: string;
  description: string | null;
  dueDate: string;
  completed: boolean;
  completedAt: string | null;
  createdById: string;
  createdByName: string;
  syncStatus: 'pending' | 'synced' | 'error';
  remoteId: string | null;
  source: FollowUpSource;
  createdAt: string;
  updatedAt: string;
}

export type OpportunityStatus = 'Open' | 'Won' | 'Lost';
export type OpportunityType = string;
export type OpportunityStage = string;
export type SellType = string;
export type PrimaryVendor = string;

export interface Opportunity {
  id: string;
  customerId: string;
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
  syncStatus: 'pending' | 'synced' | 'error';
  remoteId: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export type TimelineEvent =
  | ({ kind: 'activity' } & Activity)
  | ({ kind: 'followup' } & FollowUp);
