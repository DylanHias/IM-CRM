import type { Customer, Contact, Activity, FollowUp } from '@/types/entities';
import type { SpCustomerItem, SpContactItem, SpListResponse } from '@/types/api';
import type { ID365Adapter } from './d365Adapter';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

function getUserEmailFromToken(token: string): string {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
    return (decoded['preferred_username'] ?? decoded['upn'] ?? decoded['email'] ?? '') as string;
  } catch {
    return '';
  }
}

function mapSpCustomerToCustomer(item: SpCustomerItem, now: string): Customer {
  const f = item.fields;
  return {
    id: f.AccountId,
    name: f.Title,
    accountNumber: f.AccountNumber,
    bcn: null,
    industry: f.Industry,
    segment: null,
    ownerId: f.OwnerId,
    ownerName: f.OwnerName,
    phone: f.Phone,
    email: f.Email,
    addressStreet: f.Street,
    addressCity: f.City,
    addressCountry: f.Country,
    website: f.Website,
    cloudCustomer: null,
    language: null,
    arr: null,
    status: f.StateCode === 0 ? 'active' : 'inactive',
    lastActivityAt: null,
    syncedAt: now,
    createdAt: now,
    updatedAt: f.ModifiedOn,
  };
}

function mapSpContactToContact(item: SpContactItem, now: string): Contact {
  const f = item.fields;
  return {
    id: f.ContactId,
    customerId: f.CustomerId,
    firstName: f.FirstName,
    lastName: f.LastName,
    jobTitle: f.JobTitle,
    email: f.Email,
    phone: f.Phone,
    mobile: f.Mobile,
    notes: null,
    contactType: f.ContactType ?? null,
    syncedAt: now,
    createdAt: now,
    updatedAt: f.ModifiedOn,
  };
}

async function fetchAllSpPages<T>(firstUrl: string, token: string): Promise<T[]> {
  const results: T[] = [];
  let url: string | undefined = firstUrl;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Graph API error ${res.status}: ${text}`);
    }

    const json: SpListResponse<T> = await res.json();
    results.push(...json.value);
    url = json['@odata.nextLink'];
  }

  return results;
}

class PowerAutomateAdapter implements ID365Adapter {
  private siteId = process.env.NEXT_PUBLIC_SHAREPOINT_SITE_ID!;
  private customersListId = process.env.NEXT_PUBLIC_SP_CUSTOMERS_LIST_ID!;
  private contactsListId = process.env.NEXT_PUBLIC_SP_CONTACTS_LIST_ID!;
  private pendingActivitiesListId = process.env.NEXT_PUBLIC_SP_PENDING_ACTIVITIES_LIST_ID!;
  private pendingFollowUpsListId = process.env.NEXT_PUBLIC_SP_PENDING_FOLLOWUPS_LIST_ID!;

  async fetchCustomers(token: string): Promise<Customer[]> {
    const url = `${GRAPH_BASE}/sites/${this.siteId}/lists/${this.customersListId}/items?$expand=fields`;
    const now = new Date().toISOString();
    const items = await fetchAllSpPages<SpCustomerItem>(url, token);
    return items.map((item) => mapSpCustomerToCustomer(item, now));
  }

  async fetchContacts(token: string): Promise<Contact[]> {
    const url = `${GRAPH_BASE}/sites/${this.siteId}/lists/${this.contactsListId}/items?$expand=fields`;
    const now = new Date().toISOString();
    const items = await fetchAllSpPages<SpContactItem>(url, token);
    return items.map((item) => mapSpContactToContact(item, now));
  }

  async pushActivity(token: string, activity: Activity): Promise<string> {
    const url = `${GRAPH_BASE}/sites/${this.siteId}/lists/${this.pendingActivitiesListId}/items`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          Title: activity.subject,
          Description: activity.description ?? '',
          OccurredAt: activity.occurredAt,
          ActivityType: activity.type,
          CustomerId: activity.customerId,
          ContactId: activity.contactId ?? '',
          UserEmail: getUserEmailFromToken(token),
          Processed: false,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`SP pending activity write failed ${res.status}: ${text}`);
    }

    const json = await res.json() as { id?: string };
    return json.id ?? `SP-ACT-${activity.id.slice(0, 8).toUpperCase()}`;
  }

  async pushFollowUp(token: string, followUp: FollowUp): Promise<string> {
    const url = `${GRAPH_BASE}/sites/${this.siteId}/lists/${this.pendingFollowUpsListId}/items`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          Title: followUp.title,
          Description: followUp.description ?? '',
          DueDate: followUp.dueDate,
          CustomerId: followUp.customerId,
          UserEmail: getUserEmailFromToken(token),
          Processed: false,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`SP pending follow-up write failed ${res.status}: ${text}`);
    }

    const json = await res.json() as { id?: string };
    return json.id ?? `SP-FU-${followUp.id.slice(0, 8).toUpperCase()}`;
  }
}

export function getPowerAutomateAdapter(): ID365Adapter {
  return new PowerAutomateAdapter();
}
