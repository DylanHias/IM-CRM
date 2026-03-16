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

export interface Activity {
  id: string;
  customerId: string;
  contactId: string | null;
  type: ActivityType;
  subject: string;
  description: string | null;
  occurredAt: string;
  createdById: string;
  createdByName: string;
  syncStatus: 'pending' | 'synced' | 'error';
  remoteId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Training {
  id: string;
  customerId: string;
  title: string;
  trainingDate: string;
  participant: string | null;
  provider: string | null;
  status: 'completed' | 'registered' | 'cancelled' | null;
  syncedAt: string;
  createdAt: string;
}

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
  createdAt: string;
  updatedAt: string;
}

export type TimelineEvent =
  | ({ kind: 'activity' } & Activity)
  | ({ kind: 'training' } & Training)
  | ({ kind: 'followup' } & FollowUp);
