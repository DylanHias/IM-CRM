import { v4 as uuidv4 } from 'uuid';
import type { Customer, Contact, Activity, FollowUp, Opportunity } from '@/types/entities';
import type { SyncRecord, SyncError } from '@/types/sync';
import type { CrmUser } from '@/types/admin';

const NOW = '2026-03-25T12:00:00.000Z';

export function createCustomer(overrides?: Partial<Customer>): Customer {
  return {
    id: uuidv4(),
    name: 'Acme Corp',
    accountNumber: 'ACC-001',
    bcn: 'BCN-001',
    resellerId: 'RES-001',
    industry: 'Technology',
    segment: 'Enterprise',
    ownerId: 'owner-1',
    ownerName: 'Dylan',
    phone: '+32 123 456',
    email: 'info@acme.com',
    addressStreet: 'Main Street 1',
    addressCity: 'Antwerp',
    addressCountry: 'Belgium',
    website: 'https://acme.com',
    cloudCustomer: true,
    arr: 50000,
    arrCurrency: 'EUR',
    status: 'active',
    lastActivityAt: '2026-03-20T10:00:00.000Z',
    healthScore: null,
    syncedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function createContact(overrides?: Partial<Contact>): Contact {
  return {
    id: uuidv4(),
    customerId: uuidv4(),
    firstName: 'John',
    lastName: 'Doe',
    jobTitle: 'CTO',
    email: 'john@acme.com',
    phone: '+32 111 222',
    mobile: '+32 444 555',
    notes: null,
    contactType: null,
    cloudContact: null,
    syncStatus: 'synced',
    remoteId: null,
    source: 'local',
    syncedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function createActivity(overrides?: Partial<Activity>): Activity {
  return {
    id: uuidv4(),
    customerId: uuidv4(),
    contactId: null,
    type: 'meeting',
    subject: 'Quarterly Review',
    description: 'Discussed roadmap',
    occurredAt: NOW,
    startTime: null,
    activityStatus: 'open',
    direction: null,
    createdById: 'user-1',
    createdByName: 'Dylan',
    syncStatus: 'pending',
    remoteId: null,
    source: 'local',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function createFollowUp(overrides?: Partial<FollowUp>): FollowUp {
  return {
    id: uuidv4(),
    customerId: uuidv4(),
    activityId: null,
    title: 'Send proposal',
    description: null,
    dueDate: '2026-04-01',
    completed: false,
    completedAt: null,
    createdById: 'user-1',
    createdByName: 'Dylan',
    syncStatus: 'pending',
    remoteId: null,
    source: 'local',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function createOpportunity(overrides?: Partial<Opportunity>): Opportunity {
  return {
    id: uuidv4(),
    customerId: uuidv4(),
    contactId: null,
    status: 'Open',
    subject: 'Cloud Migration',
    bcn: 'BCN-001',
    multiVendorOpportunity: false,
    sellType: 'New',
    primaryVendor: 'Azure',
    opportunityType: 'Services',
    stage: 'Prospecting',
    probability: 5,
    expirationDate: '2026-06-01',
    estimatedRevenue: 100000,
    currency: 'EUR',
    country: 'Belgium',
    source: 'cloud',
    recordType: 'Sales',
    customerNeed: null,
    syncStatus: 'pending',
    remoteId: null,
    createdById: 'user-1',
    createdByName: 'Dylan',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function createSyncRecord(overrides?: Partial<SyncRecord>): SyncRecord {
  return {
    id: 1,
    syncType: 'd365',
    status: 'success',
    startedAt: NOW,
    finishedAt: NOW,
    recordsPulled: 10,
    recordsPushed: 0,
    errorMessage: null,
    createdAt: NOW,
    ...overrides,
  };
}

export function createSyncError(overrides?: Partial<SyncError>): SyncError {
  return {
    id: uuidv4(),
    syncType: 'd365',
    message: 'Connection timeout',
    occurredAt: NOW,
    ...overrides,
  };
}

export function createCrmUser(overrides?: Partial<CrmUser>): CrmUser {
  return {
    id: uuidv4(),
    email: 'dylan@ingrammicro.com',
    name: 'Dylan',
    role: 'admin',
    businessUnit: 'Cloud',
    title: 'Technical Account Manager',
    lastActiveAt: NOW,
    profilePhoto: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

