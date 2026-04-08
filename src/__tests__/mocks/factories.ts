import { v4 as uuidv4 } from 'uuid';
import type { Customer, Contact, Activity, FollowUp, Opportunity } from '@/types/entities';
import type { SyncRecord, SyncError } from '@/types/sync';
import type { CrmUser } from '@/types/admin';
import type { InvoiceSearchItem, InvoiceDetail } from '@/types/invoice';

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
    status: 'active',
    lastActivityAt: '2026-03-20T10:00:00.000Z',
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
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function createInvoiceSearchItem(overrides?: Partial<InvoiceSearchItem>): InvoiceSearchItem {
  return {
    invoiceNumber: 'INV-001',
    invoiceStatus: 'Open',
    invoiceDate: '2026-03-01',
    invoiceDueDate: '2026-04-01',
    invoicedAmountDue: 1500.00,
    invoiceAmountInclTax: 1815.00,
    customerOrderNumber: 'CO-123',
    endCustomerOrderNumber: null,
    orderCreateDate: '2026-02-28',
    erpOrderNumber: 'ERP-456',
    paymentTermsDueDate: '2026-04-01',
    ...overrides,
  };
}

export function createInvoiceDetail(overrides?: Partial<InvoiceDetail>): InvoiceDetail {
  return {
    invoiceNumber: 'INV-001',
    invoiceStatus: 'Open',
    invoiceDate: '2026-03-01',
    invoiceDueDate: '2026-04-01',
    customerOrderNumber: 'CO-123',
    endCustomerOrderNumber: null,
    erpOrderNumber: 'ERP-456',
    orderCreateDate: '2026-02-28',
    billToInfo: {
      companyName: 'Acme Corp',
      addressLine1: 'Main St 1',
      addressLine2: null,
      city: 'Antwerp',
      state: null,
      postalCode: '2000',
      countryCode: 'BE',
    },
    shipToInfo: {
      companyName: 'Acme Corp',
      addressLine1: 'Main St 1',
      addressLine2: null,
      city: 'Antwerp',
      state: null,
      postalCode: '2000',
      countryCode: 'BE',
    },
    paymentTermsInfo: {
      paymentTermsDescription: 'Net 30',
      paymentTermsDueDate: '2026-04-01',
      paymentTermsNetDays: 30,
    },
    lines: [
      {
        ingramPartNumber: 'ING-001',
        vendorPartNumber: 'VP-001',
        vendorName: 'Microsoft',
        productDescription: 'Azure Credits',
        quantity: 1,
        unitPrice: 1500.00,
        extendedPrice: 1500.00,
        taxAmount: 315.00,
        quantityOrdered: 1,
        quantityShipped: 1,
        currencyCode: 'EUR',
      },
    ],
    summary: {
      totalLines: 1,
      totalAmount: 1500.00,
      totalTax: 315.00,
      totalAmountInclTax: 1815.00,
      currencyCode: 'EUR',
    },
    ...overrides,
  };
}
