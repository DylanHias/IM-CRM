import type { Customer, Contact, Activity, FollowUp } from '@/types/entities';
import type { D365Customer, D365Contact, D365ODataResponse } from '@/types/api';
import { mockCustomers } from '@/lib/mock/customers';
import { mockContacts } from '@/lib/mock/contacts';

export interface ID365Adapter {
  fetchCustomers(token: string): Promise<Customer[]>;
  fetchContacts(token: string): Promise<Contact[]>;
  pushActivity(token: string, activity: Activity): Promise<string>;
  pushFollowUp(token: string, followUp: FollowUp): Promise<string>;
}

// D365 standard industry code → label mapping
const INDUSTRY_CODE_MAP: Record<number, string> = {
  1: 'Accounting',
  2: 'Agriculture and Non-petrol Natural Resource Extraction',
  3: 'Broadcasting Printing and Publishing',
  4: 'Brokers',
  5: 'Building Supply Retail',
  6: 'Business Services',
  7: 'Consulting',
  8: 'Consumer Services',
  9: 'Design, Direction and Creative Management',
  10: 'Distributors, Dispatchers and Processors',
  11: 'Doctor\'s Offices and Clinics',
  12: 'Durable Manufacturing',
  13: 'Eating and Drinking Places',
  14: 'Entertainment Retail',
  15: 'Equipment Rental and Leasing',
  16: 'Financial',
  17: 'Food and Tobacco Processing',
  18: 'Inbound Capital Intensive Processing',
  19: 'Inbound Repair and Services',
  20: 'Insurance',
  21: 'Legal Services',
  22: 'Non-Durable Merchandise Retail',
  23: 'Outbound Consumer Service',
  24: 'Petrochemical Extraction and Distribution',
  25: 'Service Retail',
  26: 'SIC Code 01 - Crops',
  27: 'SIC Code 02 - Livestock and Animal Specialties',
  28: 'SIC Code 07 - Agricultural Services',
  29: 'SIC Code 08 - Forestry',
  30: 'SIC Code 09 - Fishing, Hunting, and Trapping',
  31: 'SIC Code 10 - Metal Mining',
  32: 'SIC Code 12 - Coal Mining',
  33: 'SIC Code 13 - Oil and Gas Extraction',
  34: 'SIC Code 14 - Nonmetallic Minerals, Except Fuels',
  35: 'Snack Food Production and Distribution',
  36: 'Transportation',
  37: 'Utility Creation and Distribution',
  38: 'Vehicle Retail',
  39: 'Wholesale',
};

function mapD365CustomerToCustomer(d365: D365Customer, now: string): Customer {
  return {
    id: d365.accountid,
    name: d365.name,
    accountNumber: d365.accountnumber,
    bcn: null,
    resellerId: null,
    industry: d365.industrycode != null
      ? (d365.industrycode_formattedvalue ?? INDUSTRY_CODE_MAP[d365.industrycode] ?? String(d365.industrycode))
      : null,
    segment: null, // D365 standard schema has no segment field — customize if your org has one
    ownerId: d365._ownerid_value,
    ownerName: d365['ownerid@OData.Community.Display.V1.FormattedValue'] ?? null,
    phone: d365.telephone1,
    email: d365.emailaddress1,
    addressStreet: d365.address1_line1,
    addressCity: d365.address1_city,
    addressCountry: d365.address1_country,
    website: d365.websiteurl,
    cloudCustomer: null,
    language: null,
    arr: null,
    status: d365.statecode === 0 ? 'active' : 'inactive',
    lastActivityAt: null,
    syncedAt: now,
    createdAt: now,
    updatedAt: d365.modifiedon,
  };
}

function mapD365ContactToContact(d365: D365Contact, now: string): Contact {
  return {
    id: d365.contactid,
    customerId: d365._parentcustomerid_value,
    firstName: d365.firstname,
    lastName: d365.lastname,
    jobTitle: d365.jobtitle,
    email: d365.emailaddress1,
    phone: d365.telephone1,
    mobile: d365.mobilephone,
    notes: null,
    contactType: d365.new_contacttype_formattedvalue ?? null,
    syncedAt: now,
    createdAt: now,
    updatedAt: d365.modifiedon,
  };
}

async function fetchAllPages<T>(
  firstUrl: string,
  token: string,
): Promise<T[]> {
  const results: T[] = [];
  let url: string | undefined = firstUrl;

  while (url) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`D365 API error ${res.status}: ${text}`);
    }

    const json: D365ODataResponse<T> = await res.json();
    results.push(...json.value);
    url = json['@odata.nextLink'];
  }

  return results;
}

class RealD365Adapter implements ID365Adapter {
  private baseUrl = (process.env.NEXT_PUBLIC_D365_BASE_URL ?? '').replace(/\/+$/, '');

  async fetchCustomers(token: string): Promise<Customer[]> {
    const select = [
      'accountid', 'name', 'accountnumber', 'industrycode',
      'industrycode_formattedvalue', '_ownerid_value',
      'ownerid@OData.Community.Display.V1.FormattedValue',
      'telephone1', 'emailaddress1', 'address1_line1',
      'address1_city', 'address1_country', 'websiteurl',
      'statecode', 'modifiedon',
    ].join(',');

    const url = `${this.baseUrl}/api/data/v9.2/accounts?$select=${select}&$filter=statecode eq 0`;
    const now = new Date().toISOString();
    const records = await fetchAllPages<D365Customer>(url, token);
    return records.map((r) => mapD365CustomerToCustomer(r, now));
  }

  async fetchContacts(token: string): Promise<Contact[]> {
    const select = [
      'contactid', '_parentcustomerid_value', 'firstname', 'lastname',
      'jobtitle', 'emailaddress1', 'telephone1', 'mobilephone', 'modifiedon',
      // Custom contact type field — update name to match your D365 org schema
      'new_contacttype',
    ].join(',');

    const url = `${this.baseUrl}/api/data/v9.2/contacts?$select=${select}&$filter=_parentcustomerid_value ne null`;
    const now = new Date().toISOString();
    const records = await fetchAllPages<D365Contact>(url, token);
    return records.map((r) => mapD365ContactToContact(r, now));
  }

  async pushActivity(token: string, activity: Activity): Promise<string> {
    const accountBind = `/accounts(${activity.customerId})`;
    let endpoint: string;
    let body: Record<string, string>;

    if (activity.type === 'call') {
      endpoint = `${this.baseUrl}/api/data/v9.2/phonecalls`;
      body = {
        subject: activity.subject,
        description: activity.description ?? '',
        scheduledend: activity.occurredAt,
        'regardingobjectid_account@odata.bind': accountBind,
      };
    } else if (activity.type === 'note') {
      endpoint = `${this.baseUrl}/api/data/v9.2/annotations`;
      body = {
        subject: activity.subject,
        notetext: activity.description ?? '',
        'objectid_account@odata.bind': accountBind,
      };
    } else {
      // 'meeting' and 'visit' both map to appointment
      endpoint = `${this.baseUrl}/api/data/v9.2/appointments`;
      body = {
        subject: activity.subject,
        description: activity.description ?? '',
        scheduledend: activity.occurredAt,
        'regardingobjectid_account@odata.bind': accountBind,
      };
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`D365 push activity failed ${res.status}: ${text}`);
    }

    // D365 returns the new entity URI in OData-EntityId header
    const entityId = res.headers.get('OData-EntityId') ?? '';
    const match = entityId.match(/\(([^)]+)\)$/);
    return match ? match[1] : entityId;
  }

  async pushFollowUp(token: string, followUp: FollowUp): Promise<string> {
    const body = {
      subject: followUp.title,
      description: followUp.description ?? '',
      scheduledend: followUp.dueDate,
      'regardingobjectid_account@odata.bind': `/accounts(${followUp.customerId})`,
    };

    const res = await fetch(`${this.baseUrl}/api/data/v9.2/tasks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`D365 push follow-up failed ${res.status}: ${text}`);
    }

    const entityId = res.headers.get('OData-EntityId') ?? '';
    const match = entityId.match(/\(([^)]+)\)$/);
    return match ? match[1] : entityId;
  }
}

// Mock implementation — returns static data, simulates network delay
class MockD365Adapter implements ID365Adapter {
  async fetchCustomers(_token: string): Promise<Customer[]> {
    await delay(600);
    return mockCustomers.map((c) => ({ ...c, syncedAt: new Date().toISOString() }));
  }

  async fetchContacts(_token: string): Promise<Contact[]> {
    await delay(400);
    return mockContacts.map((c) => ({ ...c, syncedAt: new Date().toISOString() }));
  }

  async pushActivity(_token: string, activity: Activity): Promise<string> {
    await delay(200);
    return `D365-ACT-${activity.id.slice(0, 8).toUpperCase()}`;
  }

  async pushFollowUp(_token: string, followUp: FollowUp): Promise<string> {
    await delay(200);
    return `D365-FU-${followUp.id.slice(0, 8).toUpperCase()}`;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getD365Adapter(): ID365Adapter {
  if (process.env.NEXT_PUBLIC_D365_BASE_URL) {
    return new RealD365Adapter();
  }
  return new MockD365Adapter();
}
