import type { Customer, Contact, Activity, FollowUp, ActivityType } from '@/types/entities';
import type {
  D365Customer, D365Contact, D365ODataResponse,
  D365PhoneCall, D365Appointment, D365Annotation, D365Task,
} from '@/types/api';
import { v4 as uuidv4 } from 'uuid';
import { OPTION_SET_FIELDS, type OptionSetFieldKey } from '@/lib/sync/optionSetConfig';
import { mockCustomers } from '@/lib/mock/customers';
import { mockContacts } from '@/lib/mock/contacts';

interface OptionSetData {
  entityName: string;
  attributeName: string;
  options: Array<{ value: number; label: string; displayOrder: number }>;
}

export interface ID365Adapter {
  fetchCustomers(token: string, lastSync?: string): Promise<Customer[]>;
  fetchContacts(token: string, lastSync?: string): Promise<Contact[]>;
  fetchPhoneCalls(token: string, lastSync?: string): Promise<Activity[]>;
  fetchAppointments(token: string, lastSync?: string): Promise<Activity[]>;
  fetchAnnotations(token: string, lastSync?: string): Promise<Activity[]>;
  fetchTasks(token: string, lastSync?: string): Promise<FollowUp[]>;
  fetchOptionSets(token: string): Promise<OptionSetData[]>;
  pushActivity(token: string, activity: Activity): Promise<string>;
  pushFollowUp(token: string, followUp: FollowUp): Promise<string>;
  deleteActivity(token: string, remoteId: string, type: string): Promise<void>;
  deleteFollowUp(token: string, remoteId: string): Promise<void>;
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
    bcn: d365.im360_bcn,
    resellerId: null,
    industry: d365.industrycode != null
      ? (d365['industrycode@OData.Community.Display.V1.FormattedValue'] ?? INDUSTRY_CODE_MAP[d365.industrycode] ?? String(d365.industrycode))
      : null,
    segment: d365['im360_mainsegmentation@OData.Community.Display.V1.FormattedValue'] ?? null,
    ownerId: d365._ownerid_value,
    ownerName: d365['_ownerid_value@OData.Community.Display.V1.FormattedValue'] ?? null,
    phone: d365.telephone1,
    email: d365.emailaddress1,
    addressStreet: d365.address1_line1,
    addressCity: d365.address1_city,
    addressCountry: d365.address1_country,
    website: d365.websiteurl,
    cloudCustomer: d365.im360_cloudpurchaser ?? null,
    language: null, // preferredlanguagecode not available on D365 contact entity in this org
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
    firstName: d365.firstname ?? '',
    lastName: d365.lastname ?? '',
    jobTitle: d365.jobtitle,
    email: d365.emailaddress1,
    phone: d365.telephone1,
    mobile: d365.mobilephone,
    notes: null,
    contactType: d365['new_contacttype@OData.Community.Display.V1.FormattedValue'] ?? null,
    syncedAt: now,
    createdAt: now,
    updatedAt: d365.modifiedon,
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapD365PhoneCallToActivity(d365: D365PhoneCall, now: string): Activity {
  return {
    id: uuidv4(),
    customerId: d365._im360_account_value ?? '',
    contactId: d365._im360_contact_value ?? null,
    type: 'call' as ActivityType,
    subject: d365.subject ?? 'Phone Call',
    description: d365.description ?? d365.im360_internalcomments ?? null,
    occurredAt: d365.actualend ?? d365.createdon,
    startTime: null,
    createdById: d365._ownerid_value ?? '',
    createdByName: d365['_ownerid_value@OData.Community.Display.V1.FormattedValue'] ?? 'Unknown',
    syncStatus: 'synced',
    remoteId: d365.activityid,
    source: 'd365',
    createdAt: d365.createdon,
    updatedAt: d365.modifiedon,
  };
}

function mapD365AppointmentToActivity(d365: D365Appointment, now: string): Activity {
  const type: ActivityType = d365.im360_appointmenttype === 2 ? 'visit' : 'meeting';
  const rawDesc = d365.description ?? '';
  const description = rawDesc.includes('<') ? stripHtml(rawDesc) : rawDesc;

  return {
    id: uuidv4(),
    customerId: d365._im360_account_value ?? '',
    contactId: d365._im360_contact_value ?? null,
    type,
    subject: d365.subject ?? 'Appointment',
    description: description || null,
    occurredAt: d365.scheduledend ?? d365.createdon,
    startTime: d365.scheduledstart ?? null,
    createdById: d365._ownerid_value ?? '',
    createdByName: d365['_ownerid_value@OData.Community.Display.V1.FormattedValue'] ?? 'Unknown',
    syncStatus: 'synced',
    remoteId: d365.activityid,
    source: 'd365',
    createdAt: d365.createdon,
    updatedAt: d365.modifiedon,
  };
}

function mapD365AnnotationToActivity(d365: D365Annotation, now: string): Activity {
  return {
    id: uuidv4(),
    customerId: d365._objectid_value ?? '',
    contactId: null,
    type: 'note' as ActivityType,
    subject: d365.subject ?? 'Note',
    description: d365.notetext ?? null,
    occurredAt: d365.createdon,
    startTime: null,
    createdById: d365._ownerid_value ?? '',
    createdByName: d365['_ownerid_value@OData.Community.Display.V1.FormattedValue'] ?? 'Unknown',
    syncStatus: 'synced',
    remoteId: d365.annotationid,
    source: 'd365',
    createdAt: d365.createdon,
    updatedAt: d365.modifiedon,
  };
}

function mapD365TaskToFollowUp(d365: D365Task, now: string): FollowUp {
  const completed = d365.statecode === 1;
  return {
    id: uuidv4(),
    customerId: d365._regardingobjectid_value ?? '',
    activityId: null,
    title: d365.subject ?? 'Task',
    description: d365.description ?? null,
    dueDate: d365.scheduledend ? d365.scheduledend.split('T')[0] : now.split('T')[0],
    completed,
    completedAt: completed ? (d365.actualend ?? d365.im360_completedon ?? d365.modifiedon) : null,
    createdById: d365._ownerid_value ?? '',
    createdByName: d365['_ownerid_value@OData.Community.Display.V1.FormattedValue'] ?? 'Unknown',
    syncStatus: 'synced',
    remoteId: d365.activityid,
    source: 'd365',
    createdAt: d365.createdon,
    updatedAt: d365.modifiedon,
  };
}

async function fetchAllPages<T>(
  firstUrl: string,
  token: string,
  label?: string,
): Promise<T[]> {
  const results: T[] = [];
  let url: string | undefined = firstUrl;
  let page = 0;

  while (url) {
    page++;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Accept: 'application/json',
        Prefer: 'odata.include-annotations="*",odata.maxpagesize=5000',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`D365 API error ${res.status}: ${text}`);
    }

    const json: D365ODataResponse<T> = await res.json();
    results.push(...json.value);
    console.log(`[sync] ${label ?? 'D365'} page ${page}: ${json.value.length} records (total so far: ${results.length})`);
    url = json['@odata.nextLink'];
  }

  console.log(`[sync] ${label ?? 'D365'} fetch complete: ${results.length} records across ${page} page(s)`);
  return results;
}

class RealD365Adapter implements ID365Adapter {
  private baseUrl = (process.env.NEXT_PUBLIC_D365_BASE_URL ?? '').replace(/\/+$/, '');

  async fetchCustomers(token: string, lastSync?: string): Promise<Customer[]> {
    const select = [
      'accountid', 'name', 'accountnumber', 'industrycode',
      '_ownerid_value',
      'telephone1', 'emailaddress1', 'address1_line1',
      'address1_city', 'address1_country', 'websiteurl',
      'im360_bcn', 'im360_cloudpurchaser', 'im360_mainsegmentation',
      'statecode', 'modifiedon',
    ].join(',');

    let filter = "statecode eq 0 and (address1_country eq 'Belgium' or address1_country eq 'Netherlands' or address1_country eq 'Luxembourg')";
    if (lastSync) filter += ` and modifiedon gt ${lastSync}`;
    const url = `${this.baseUrl}/api/data/v9.2/accounts?$select=${select}&$filter=${encodeURIComponent(filter)}`;
    const now = new Date().toISOString();
    const records = await fetchAllPages<D365Customer>(url, token, 'Accounts');
    return records.map((r) => mapD365CustomerToCustomer(r, now));
  }

  async fetchContacts(token: string, lastSync?: string): Promise<Contact[]> {
    const select = [
      'contactid', '_parentcustomerid_value', 'firstname', 'lastname',
      'jobtitle', 'emailaddress1', 'telephone1', 'mobilephone', 'modifiedon',
    ].join(',');

    let filter = '_parentcustomerid_value ne null';
    if (lastSync) filter += ` and modifiedon gt ${lastSync}`;
    const url = `${this.baseUrl}/api/data/v9.2/contacts?$select=${select}&$filter=${encodeURIComponent(filter)}`;
    const now = new Date().toISOString();
    const records = await fetchAllPages<D365Contact>(url, token, 'Contacts');
    return records.map((r) => mapD365ContactToContact(r, now));
  }

  async fetchPhoneCalls(token: string, lastSync?: string): Promise<Activity[]> {
    const select = [
      'activityid', 'subject', 'description', 'im360_internalcomments',
      '_im360_account_value', '_im360_contact_value', '_ownerid_value',
      'actualend', 'createdon', 'statecode', 'modifiedon',
    ].join(',');

    let filter = '_im360_account_value ne null';
    if (lastSync) filter += ` and modifiedon gt ${lastSync}`;
    const url = `${this.baseUrl}/api/data/v9.2/phonecalls?$select=${select}&$filter=${encodeURIComponent(filter)}`;
    const now = new Date().toISOString();
    const records = await fetchAllPages<D365PhoneCall>(url, token, 'Phone Calls');
    return records.map((r) => mapD365PhoneCallToActivity(r, now));
  }

  async fetchAppointments(token: string, lastSync?: string): Promise<Activity[]> {
    const select = [
      'activityid', 'subject', 'description', 'im360_appointmenttype',
      '_im360_account_value', '_im360_contact_value', '_ownerid_value',
      'scheduledstart', 'scheduledend', 'statecode', 'createdon', 'modifiedon',
    ].join(',');

    let filter = '_im360_account_value ne null and im360_appointmenttype ne 1';
    if (lastSync) filter += ` and modifiedon gt ${lastSync}`;
    const url = `${this.baseUrl}/api/data/v9.2/appointments?$select=${select}&$filter=${encodeURIComponent(filter)}`;
    const now = new Date().toISOString();
    const records = await fetchAllPages<D365Appointment>(url, token, 'Appointments');
    return records.map((r) => mapD365AppointmentToActivity(r, now));
  }

  async fetchAnnotations(token: string, lastSync?: string): Promise<Activity[]> {
    const select = [
      'annotationid', 'subject', 'notetext', '_objectid_value',
      'objecttypecode', '_ownerid_value', 'createdon', 'modifiedon',
    ].join(',');

    let filter = "objecttypecode eq 'account'";
    if (lastSync) filter += ` and modifiedon gt ${lastSync}`;
    const url = `${this.baseUrl}/api/data/v9.2/annotations?$select=${select}&$filter=${encodeURIComponent(filter)}`;
    const now = new Date().toISOString();
    const records = await fetchAllPages<D365Annotation>(url, token, 'Annotations');
    return records.map((r) => mapD365AnnotationToActivity(r, now));
  }

  async fetchTasks(token: string, lastSync?: string): Promise<FollowUp[]> {
    const select = [
      'activityid', 'subject', 'description', '_regardingobjectid_value',
      '_ownerid_value', 'scheduledend', 'statecode', 'actualend',
      'im360_completedon', 'createdon', 'modifiedon',
    ].join(',');

    let filter = '_regardingobjectid_value ne null';
    if (lastSync) filter += ` and modifiedon gt ${lastSync}`;
    const url = `${this.baseUrl}/api/data/v9.2/tasks?$select=${select}&$filter=${encodeURIComponent(filter)}`;
    const now = new Date().toISOString();
    const records = await fetchAllPages<D365Task>(url, token, 'Tasks');
    return records.map((r) => mapD365TaskToFollowUp(r, now));
  }

  async fetchOptionSets(token: string): Promise<OptionSetData[]> {
    const entries = Object.entries(OPTION_SET_FIELDS) as [OptionSetFieldKey, typeof OPTION_SET_FIELDS[OptionSetFieldKey]][];

    const promises = entries.map(async ([, config]): Promise<OptionSetData | null> => {
      try {
        const url = `${this.baseUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${config.entityName}')/Attributes(LogicalName='${config.attributeName}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options)`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            Accept: 'application/json',
          },
        });

        if (!res.ok) {
          console.error(`[sync] Failed to fetch option set ${config.entityName}.${config.attributeName}: ${res.status}`);
          return null;
        }

        const json = await res.json();
        const options = (json.OptionSet?.Options ?? []).map((opt: { Value: number; Label: { UserLocalizedLabel?: { Label: string } | null; LocalizedLabels?: Array<{ Label: string }> } }, idx: number) => ({
          value: opt.Value,
          label: opt.Label?.UserLocalizedLabel?.Label ?? opt.Label?.LocalizedLabels?.[0]?.Label ?? String(opt.Value),
          displayOrder: idx,
        }));

        return { entityName: config.entityName, attributeName: config.attributeName, options };
      } catch (err) {
        console.error(`[sync] Error fetching option set ${config.entityName}.${config.attributeName}:`, err);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter((v): v is OptionSetData => v !== null);
  }

  async pushActivity(token: string, activity: Activity): Promise<string> {
    const isUpdate = !!activity.remoteId;
    const accountBind = `/accounts(${activity.customerId})`;
    let entitySet: string;
    let body: Record<string, unknown>;

    if (activity.type === 'call') {
      entitySet = 'phonecalls';
      const callBody: Record<string, unknown> = {
        subject: activity.subject,
        description: activity.description ?? '',
        scheduledend: activity.occurredAt,
        'regardingobjectid_account@odata.bind': accountBind,
      };
      if (activity.contactId) {
        callBody.phonecall_activity_parties = [
          { 'partyid_systemuser@odata.bind': `/systemusers(${activity.createdById})`, participationtypemask: 1 },
          { 'partyid_contact@odata.bind': `/contacts(${activity.contactId})`, participationtypemask: 2 },
        ];
      }
      body = callBody;
    } else if (activity.type === 'note') {
      entitySet = 'annotations';
      body = {
        subject: activity.subject,
        notetext: activity.description ?? '',
        'objectid_account@odata.bind': accountBind,
      };
    } else {
      // 'meeting' and 'visit' both map to appointment
      entitySet = 'appointments';
      const apptBody: Record<string, unknown> = {
        subject: activity.subject,
        description: activity.description || activity.subject,
        scheduledstart: activity.startTime ?? activity.occurredAt,
        scheduledend: activity.occurredAt,
        im360_appointmenttype: activity.type === 'visit' ? 2 : 0,
        'regardingobjectid_account@odata.bind': accountBind,
      };
      if (activity.contactId) {
        apptBody['regardingobjectid_contact@odata.bind'] = `/contacts(${activity.contactId})`;
      }
      body = apptBody;
    }

    const endpoint = isUpdate
      ? `${this.baseUrl}/api/data/v9.2/${entitySet}(${activity.remoteId})`
      : `${this.baseUrl}/api/data/v9.2/${entitySet}`;

    const res = await fetch(endpoint, {
      method: isUpdate ? 'PATCH' : 'POST',
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

    if (isUpdate) {
      return activity.remoteId!;
    }
    // D365 returns the new entity URI in OData-EntityId header for POST
    const entityId = res.headers.get('OData-EntityId') ?? '';
    const match = entityId.match(/\(([^)]+)\)$/);
    return match ? match[1] : entityId;
  }

  async pushFollowUp(token: string, followUp: FollowUp): Promise<string> {
    const isUpdate = !!followUp.remoteId;
    const body: Record<string, unknown> = {
      subject: followUp.title,
      description: followUp.description ?? '',
      scheduledend: followUp.dueDate,
      'regardingobjectid_account@odata.bind': `/accounts(${followUp.customerId})`,
    };

    if (followUp.completed) {
      body.statecode = 1;
      body.statuscode = 5;
    }

    const endpoint = isUpdate
      ? `${this.baseUrl}/api/data/v9.2/tasks(${followUp.remoteId})`
      : `${this.baseUrl}/api/data/v9.2/tasks`;

    const res = await fetch(endpoint, {
      method: isUpdate ? 'PATCH' : 'POST',
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

    if (isUpdate) {
      return followUp.remoteId!;
    }
    const entityId = res.headers.get('OData-EntityId') ?? '';
    const match = entityId.match(/\(([^)]+)\)$/);
    return match ? match[1] : entityId;
  }

  async deleteActivity(token: string, remoteId: string, type: string): Promise<void> {
    let entitySet: string;
    if (type === 'call') entitySet = 'phonecalls';
    else if (type === 'note') entitySet = 'annotations';
    else entitySet = 'appointments';

    const res = await fetch(`${this.baseUrl}/api/data/v9.2/${entitySet}(${remoteId})`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
    });

    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      throw new Error(`D365 delete activity failed ${res.status}: ${text}`);
    }
  }

  async deleteFollowUp(token: string, remoteId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/data/v9.2/tasks(${remoteId})`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
    });

    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      throw new Error(`D365 delete follow-up failed ${res.status}: ${text}`);
    }
  }
}

// Mock implementation — returns static data, simulates network delay
class MockD365Adapter implements ID365Adapter {
  async fetchCustomers(_token: string, _lastSync?: string): Promise<Customer[]> {
    await delay(600);
    return mockCustomers.map((c) => ({ ...c, syncedAt: new Date().toISOString() }));
  }

  async fetchContacts(_token: string, _lastSync?: string): Promise<Contact[]> {
    await delay(400);
    return mockContacts.map((c) => ({ ...c, syncedAt: new Date().toISOString() }));
  }

  async fetchPhoneCalls(_token: string, _lastSync?: string): Promise<Activity[]> {
    await delay(200);
    return [];
  }

  async fetchAppointments(_token: string, _lastSync?: string): Promise<Activity[]> {
    await delay(200);
    return [];
  }

  async fetchAnnotations(_token: string, _lastSync?: string): Promise<Activity[]> {
    await delay(200);
    return [];
  }

  async fetchTasks(_token: string, _lastSync?: string): Promise<FollowUp[]> {
    await delay(200);
    return [];
  }

  async fetchOptionSets(_token: string): Promise<OptionSetData[]> {
    await delay(200);
    return Object.entries(OPTION_SET_FIELDS).map(([, config]) => ({
      entityName: config.entityName,
      attributeName: config.attributeName,
      options: config.fallbackOptions.map((opt, idx) => ({ ...opt, displayOrder: idx })),
    }));
  }

  async pushActivity(_token: string, activity: Activity): Promise<string> {
    await delay(200);
    return `D365-ACT-${activity.id.slice(0, 8).toUpperCase()}`;
  }

  async pushFollowUp(_token: string, followUp: FollowUp): Promise<string> {
    await delay(200);
    return `D365-FU-${followUp.id.slice(0, 8).toUpperCase()}`;
  }

  async deleteActivity(_token: string, _remoteId: string, _type: string): Promise<void> {
    await delay(200);
  }

  async deleteFollowUp(_token: string, _remoteId: string): Promise<void> {
    await delay(200);
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
