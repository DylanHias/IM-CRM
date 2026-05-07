import type { Customer, Contact, Activity, FollowUp, ActivityType, Opportunity, OpportunityStatus } from '@/types/entities';
import type {
  D365Customer, D365Contact, D365ODataResponse,
  D365PhoneCall, D365Appointment, D365Annotation, D365Task, D365Opportunity,
} from '@/types/api';
import { v4 as uuidv4 } from 'uuid';
import { EMPTY_OPP_EXTRA_FIELDS, getStatusReasonCode as getStatusReasonCodeForPush } from '@/lib/opportunityRules';
import { OPTION_SET_FIELDS, type OptionSetFieldKey } from '@/lib/sync/optionSetConfig';
import type { LookupTableItem, LookupTableKey } from '@/types/lookupTable';
import { mockCustomers } from '@/lib/mock/customers';
import { mockContacts } from '@/lib/mock/contacts';

interface OptionSetData {
  entityName: string;
  attributeName: string;
  options: Array<{ value: number; label: string; displayOrder: number }>;
}

export interface OpportunityOptionValues {
  stage: number | null;
  sellType: number | null;
  opportunityType: number | null;
  recordType: number | null;
  source: number | null;
  singleOrCrossSell: number | null;
  awsPartnerType: number | null;
  awsServiceType: number | null;
  apnTagging: number | null;
  endUserType: number | null;
  supportType: number | null;
  migrationType: number | null;
  publicSectorSegment: number | null;
}

export interface OpportunityLookupValues {
  primaryVendorId: string | null;
  serviceNameId: string | null;
  countryId: string | null;
  currencyId: string | null;
}

export interface LookupTableFetchResult {
  key: LookupTableKey;
  items: LookupTableItem[];
}

export interface ID365Adapter {
  fetchCustomers(token: string, lastSync?: string): Promise<Customer[]>;
  fetchContacts(token: string, customerIds: Set<string>, lastSync?: string): Promise<Contact[]>;
  fetchPhoneCalls(token: string, customerIds: Set<string>, lastSync?: string): Promise<Activity[]>;
  fetchAppointments(token: string, customerIds: Set<string>, lastSync?: string): Promise<Activity[]>;
  fetchAnnotations(token: string, customerIds: Set<string>, lastSync?: string): Promise<Activity[]>;
  fetchTasks(token: string, customerIds: Set<string>, lastSync?: string): Promise<FollowUp[]>;
  fetchOptionSets(token: string): Promise<OptionSetData[]>;
  whoAmI(token: string): Promise<string>;
  pushActivity(token: string, activity: Activity, callerD365Id?: string, contactPhone?: string | null): Promise<string>;
  pushFollowUp(token: string, followUp: FollowUp): Promise<string>;
  deleteActivity(token: string, remoteId: string, type: string): Promise<void>;
  deleteFollowUp(token: string, remoteId: string): Promise<void>;
  fetchOpportunities(token: string, customerIds: Set<string>, ownerIds: Set<string>, lastSync?: string): Promise<Opportunity[]>;
  pushOpportunity(token: string, opportunity: Opportunity, optionValues: OpportunityOptionValues, lookupValues: OpportunityLookupValues): Promise<string>;
  deleteOpportunity(token: string, remoteId: string): Promise<void>;
  fetchLookupTables(token: string): Promise<LookupTableFetchResult[]>;
  pushContact(token: string, contact: Contact): Promise<string>;
  deleteContact(token: string, remoteId: string): Promise<void>;
  setPrimaryContact(token: string, accountId: string, contactRemoteId: string): Promise<void>;
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
    cloudCustomer: null, // derived from contacts after sync (see recomputeCloudCustomerStatus)
    healthScore: null, // derived post-sync (see recomputeCustomerHealthScores)
    arr: null,
    arrCurrency: null,
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
    contactType: d365['im360_contacttype@OData.Community.Display.V1.FormattedValue'] ?? null,
    cloudContact: d365.im360_cloudcontact ?? null,
    isPrimary: false,
    syncStatus: 'synced',
    remoteId: d365.contactid,
    source: 'd365',
    syncedAt: now,
    createdAt: now,
    updatedAt: d365.modifiedon,
  };
}


function activityStatusToD365State(
  status: Activity['activityStatus'],
  type: Activity['type'],
): { statecode: number; statuscode: number } {
  if (status === 'rejected') {
    // Cancelled state — phonecall: 3, appointment: 4
    return type === 'call' ? { statecode: 2, statuscode: 3 } : { statecode: 2, statuscode: 4 };
  }
  // completed + expired both map to Completed — phonecall: 2 (Made), appointment: 3
  return type === 'call' ? { statecode: 1, statuscode: 2 } : { statecode: 1, statuscode: 3 };
}

function mapD365StateToActivityStatus(statecode: number): Activity['activityStatus'] {
  if (statecode === 0) return 'open';
  if (statecode === 2) return 'rejected';
  return 'completed';
}

function mapD365PhoneCallToActivity(d365: D365PhoneCall, now: string): Activity {
  return {
    id: uuidv4(),
    customerId: d365._im360_account_value ?? d365._regardingobjectid_value ?? '',
    contactId: d365._im360_contact_value ?? null,
    type: 'call' as ActivityType,
    subject: d365.subject ?? 'Phone Call',
    description: d365.description ?? d365.im360_internalcomments ?? null,
    occurredAt: d365.actualend ?? d365.createdon,
    startTime: null,
    activityStatus: mapD365StateToActivityStatus(d365.statecode),
    direction: d365.directioncode === true ? 'outgoing' : d365.directioncode === false ? 'incoming' : null,
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

  return {
    id: uuidv4(),
    customerId: d365._im360_account_value ?? d365._regardingobjectid_value ?? '',
    contactId: d365._im360_contact_value ?? null,
    type,
    subject: d365.subject ?? 'Appointment',
    description: d365.description ?? null,
    occurredAt: d365.scheduledend ?? d365.createdon,
    startTime: d365.scheduledstart ?? null,
    activityStatus: mapD365StateToActivityStatus(d365.statecode),
    direction: null,
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
    activityStatus: 'completed',
    direction: null,
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

/** Extract the GUID from D365's OData-EntityId response header and normalize to lowercase.
 *  D365 returns uppercase GUIDs in POST response headers but lowercase in GET responses —
 *  lowercasing everywhere prevents duplicate rows on the next sync (see migration v25). */
function parseEntityIdHeader(header: string | null): string {
  const value = header ?? '';
  const match = value.match(/\(([^)]+)\)$/);
  return (match ? match[1] : value).toLowerCase();
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

/** D365's @OData.Community.Display.V1.FormattedValue for a currency lookup is the
 *  human-readable currencyname (e.g. "US Dollar", "Euro"). The local Opportunity stores
 *  ISO code (USD, EUR) so Intl.NumberFormat works. Map the few names we expect. */
function currencyNameToIso(name: string | undefined): string {
  if (!name) return 'EUR';
  const trimmed = name.trim();
  if (/^[A-Z]{3}$/.test(trimmed)) return trimmed; // already ISO
  const map: Record<string, string> = {
    'us dollar': 'USD',
    'euro': 'EUR',
    'pound sterling': 'GBP',
    'swiss franc': 'CHF',
    'schweizer franken': 'CHF',
    'danish kroner': 'DKK',
    'norwegian kroner': 'NOK',
    'swedish kronor': 'SEK',
    'czech koruna': 'CZK',
    'česká koruna': 'CZK',
    'polish zloty': 'PLN',
    'złoty polski': 'PLN',
    'forint': 'HUF',
    'turkish lira': 'TRY',
    'saudi riyal': 'SAR',
    'qatari riyal': 'QAR',
    'united arab emirates dirham': 'AED',
    'bahraini dinar': 'BHD',
    'kuwaiti dinar': 'KWD',
    'omani rial': 'OMR',
    'egyptian pound': 'EGP',
  };
  return map[trimmed.toLowerCase()] ?? 'EUR';
}

function mapD365OpportunityToOpportunity(r: D365Opportunity, now: string): Opportunity {
  const statusMap: Record<number, OpportunityStatus> = { 0: 'Open', 1: 'Won', 2: 'Lost' };
  const status = statusMap[r.statecode] ?? 'Open';
  const expiration = r.im360_expirydate ?? r.estimatedclosedate;
  // Prefer im360_primaryvendorid (the populated lookup), fallback to legacy im360_primaryvendor
  const primaryVendor =
    r['_im360_primaryvendorid_value@OData.Community.Display.V1.FormattedValue']
    ?? r['_im360_primaryvendor_value@OData.Community.Display.V1.FormattedValue']
    ?? null;
  return {
    ...EMPTY_OPP_EXTRA_FIELDS,
    id: uuidv4(),
    customerId: r._parentaccountid_value ?? '',
    contactId: r._parentcontactid_value ?? null,
    status,
    subject: r.name ?? '',
    bcn: r.im360_bcn ?? null,
    multiVendorOpportunity: r.im360_multivendoropportunity ?? false,
    sellType: r['im360_opptype@OData.Community.Display.V1.FormattedValue'] ?? '',
    primaryVendor,
    opportunityType: r['im360_drpboxopptype@OData.Community.Display.V1.FormattedValue'] ?? null,
    stage: r['im360_oppstage@OData.Community.Display.V1.FormattedValue'] ?? 'Prospecting',
    probability: r.closeprobability ?? 5,
    expirationDate: expiration ? expiration.split('T')[0] : null,
    estimatedRevenue: r.estimatedvalue ?? null,
    currency: currencyNameToIso(r['_transactioncurrencyid_value@OData.Community.Display.V1.FormattedValue']),
    country: r['_im360_country_value@OData.Community.Display.V1.FormattedValue'] ?? 'Belgium',
    source: r['im360_source@OData.Community.Display.V1.FormattedValue'] ?? 'cloud',
    recordType: r['im360_recordtype@OData.Community.Display.V1.FormattedValue'] ?? 'Sales',
    customerNeed: r.customerneed ?? null,
    syncStatus: 'synced',
    remoteId: r.opportunityid,
    createdById: r._ownerid_value ?? '',
    createdByName: r['_ownerid_value@OData.Community.Display.V1.FormattedValue'] ?? 'Unknown',
    createdAt: r.createdon ?? now,
    updatedAt: r.modifiedon ?? now,
    singleOrCrossSell: r['im360_singleorcrosssell@OData.Community.Display.V1.FormattedValue'] ?? null,
    estimatedMRR: r.im360_estimatedmrr ?? null,
    annualRevenue: r.im360_annualrevenue ?? null,
    apnId: r.im360_apnid ?? null,
    awsPartnerType: r['im360_awspartnertype1@OData.Community.Display.V1.FormattedValue'] ?? null,
    awsServiceType: r['im360_awsservicetype@OData.Community.Display.V1.FormattedValue'] ?? null,
    apnTagging: r['im360_apntagging@OData.Community.Display.V1.FormattedValue'] ?? null,
    endUserType: r['im360_endusertype@OData.Community.Display.V1.FormattedValue'] ?? null,
    supportType: r['im360_supporttype@OData.Community.Display.V1.FormattedValue'] ?? null,
    payerAccount: r.im360_payeraccount ?? null,
    existingPayeeAccount: r.im360_existingpayeeaccount ?? null,
    consolidationAcceptanceDate: r.im360_consolidationacceptancedate ? r.im360_consolidationacceptancedate.split('T')[0] : null,
    msCspTenant: r.im360_mscsptenant ?? null,
    mpnId: r.im360_mpnid ?? null,
    migrationType: r['im360_migrationtype@OData.Community.Display.V1.FormattedValue'] ?? null,
    serviceName: r['_im360_servicename1_value@OData.Community.Display.V1.FormattedValue'] ?? null,
    competitiveWinback: r.im360_competitivewinback ?? null,
    publicSectorSegment: r['im360_publicsectorsegment@OData.Community.Display.V1.FormattedValue'] ?? null,
    statusReason: status === 'Open' ? null : (r['statuscode@OData.Community.Display.V1.FormattedValue'] ?? null),
    actualRevenue: r.actualvalue ?? null,
    closeDate: status === 'Open' ? null : (r.actualclosedate ? r.actualclosedate.split('T')[0] : null),
    competitorId: null,
    closeDescription: status === 'Open' ? null : (r.description ?? null),
  };
}

class RealD365Adapter implements ID365Adapter {
  private baseUrl = (process.env.NEXT_PUBLIC_D365_BASE_URL ?? '').replace(/\/+$/, '');
  private navPropertyCache = new Map<string, string | null>();

  /** Resolve the correct navigation property name for a custom lookup via D365 metadata. */
  private async resolveNavProperty(
    token: string,
    entityLogicalName: string,
    attributeLogicalName: string,
  ): Promise<string | null> {
    const cacheKey = `${entityLogicalName}.${attributeLogicalName}`;
    if (this.navPropertyCache.has(cacheKey)) return this.navPropertyCache.get(cacheKey)!;

    try {
      const url =
        `${this.baseUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${entityLogicalName}')` +
        `/ManyToOneRelationships?$filter=ReferencingAttribute eq '${attributeLogicalName}'` +
        `&$select=ReferencingEntityNavigationPropertyName`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
          Accept: 'application/json',
        },
      });
      if (!res.ok) {
        console.error(`[sync] Failed to resolve nav property for ${cacheKey}: ${res.status}`);
        this.navPropertyCache.set(cacheKey, null);
        return null;
      }
      const data = (await res.json()) as { value: Array<{ ReferencingEntityNavigationPropertyName: string }> };
      const navName = data.value[0]?.ReferencingEntityNavigationPropertyName ?? null;
      console.log(`[sync] Resolved nav property for ${cacheKey}: ${navName}`);
      this.navPropertyCache.set(cacheKey, navName);
      return navName;
    } catch (err) {
      console.error(`[sync] Error resolving nav property for ${cacheKey}:`, err);
      this.navPropertyCache.set(cacheKey, null);
      return null;
    }
  }

  async fetchCustomers(token: string, lastSync?: string): Promise<Customer[]> {
    const select = [
      'accountid', 'name', 'accountnumber', 'im360_bcn', 'industrycode',
      '_ownerid_value',
      'telephone1', 'emailaddress1', 'address1_line1',
      'address1_city', 'address1_country', 'websiteurl',
      'im360_mainsegmentation',
      'statecode', 'modifiedon',
    ].join(',');

    let filter = "statecode eq 0 and (address1_country eq 'BE' or address1_country eq 'NL' or address1_country eq 'LU')";
    if (lastSync) filter += ` and modifiedon gt ${lastSync}`;
    const url = `${this.baseUrl}/api/data/v9.2/accounts?$select=${select}&$filter=${encodeURIComponent(filter)}`;
    const now = new Date().toISOString();
    const records = await fetchAllPages<D365Customer>(url, token, 'Accounts');
    const mapped = records.map((r) => mapD365CustomerToCustomer(r, now));
    const valid = mapped.filter((c) => c.name != null && c.name.trim() !== '');
    const dropped = mapped.length - valid.length;
    if (dropped > 0) {
      console.warn(`[sync] Dropped ${dropped} D365 account(s) with missing name`);
    }
    return valid;
  }

  async fetchContacts(token: string, customerIds: Set<string>, lastSync?: string): Promise<Contact[]> {
    const select = [
      'contactid', '_parentcustomerid_value', 'firstname', 'lastname',
      'jobtitle', 'emailaddress1', 'telephone1', 'mobilephone', 'im360_contacttype', 'im360_cloudcontact', 'modifiedon',
    ].join(',');

    let filter = 'statecode eq 0 and _parentcustomerid_value ne null';
    if (lastSync) filter += ` and modifiedon gt ${lastSync}`;
    const url = `${this.baseUrl}/api/data/v9.2/contacts?$select=${select}&$filter=${encodeURIComponent(filter)}`;
    const now = new Date().toISOString();
    const records = await fetchAllPages<D365Contact>(url, token, 'Contacts');
    return records
      .map((r) => mapD365ContactToContact(r, now))
      .filter((c) => customerIds.has(c.customerId));
  }

  async fetchPhoneCalls(token: string, customerIds: Set<string>, lastSync?: string): Promise<Activity[]> {
    const select = [
      'activityid', 'subject', 'description', 'im360_internalcomments',
      '_im360_account_value', '_regardingobjectid_value', '_im360_contact_value', '_ownerid_value',
      'directioncode', 'actualend', 'createdon', 'statecode', 'modifiedon',
    ].join(',');

    let filter = 'statecode ne 2 and (_im360_account_value ne null or _regardingobjectid_value ne null)';
    if (lastSync) filter += ` and modifiedon gt ${lastSync}`;
    const url = `${this.baseUrl}/api/data/v9.2/phonecalls?$select=${select}&$filter=${encodeURIComponent(filter)}`;
    const now = new Date().toISOString();
    const records = await fetchAllPages<D365PhoneCall>(url, token, 'Phone Calls');
    return records
      .map((r) => mapD365PhoneCallToActivity(r, now))
      .filter((a) => customerIds.has(a.customerId));
  }

  async fetchAppointments(token: string, customerIds: Set<string>, lastSync?: string): Promise<Activity[]> {
    const select = [
      'activityid', 'subject', 'description', 'im360_appointmenttype',
      '_im360_account_value', '_regardingobjectid_value', '_im360_contact_value', '_ownerid_value',
      'scheduledstart', 'scheduledend', 'statecode', 'createdon', 'modifiedon',
    ].join(',');

    let filter = 'statecode ne 2 and (_im360_account_value ne null or _regardingobjectid_value ne null) and im360_appointmenttype ne 1';
    if (lastSync) filter += ` and modifiedon gt ${lastSync}`;
    const url = `${this.baseUrl}/api/data/v9.2/appointments?$select=${select}&$filter=${encodeURIComponent(filter)}`;
    const now = new Date().toISOString();
    const records = await fetchAllPages<D365Appointment>(url, token, 'Appointments');
    return records
      .map((r) => mapD365AppointmentToActivity(r, now))
      .filter((a) => customerIds.has(a.customerId));
  }

  async fetchAnnotations(token: string, customerIds: Set<string>, lastSync?: string): Promise<Activity[]> {
    const select = [
      'annotationid', 'subject', 'notetext', '_objectid_value',
      'objecttypecode', '_ownerid_value', 'createdon', 'modifiedon',
    ].join(',');

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const minDate = oneYearAgo.toISOString();

    let filter = `objecttypecode eq 'account' and createdon gt ${minDate}`;
    if (lastSync) filter += ` and modifiedon gt ${lastSync}`;
    const url = `${this.baseUrl}/api/data/v9.2/annotations?$select=${select}&$filter=${encodeURIComponent(filter)}`;
    const now = new Date().toISOString();
    const records = await fetchAllPages<D365Annotation>(url, token, 'Annotations');
    return records
      .map((r) => mapD365AnnotationToActivity(r, now))
      .filter((a) => customerIds.has(a.customerId));
  }

  async fetchTasks(token: string, customerIds: Set<string>, lastSync?: string): Promise<FollowUp[]> {
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
    return records
      .map((r) => mapD365TaskToFollowUp(r, now))
      .filter((t) => customerIds.has(t.customerId));
  }

  async fetchOpportunities(token: string, customerIds: Set<string>, ownerIds: Set<string>, lastSync?: string): Promise<Opportunity[]> {
    if (ownerIds.size === 0) {
      console.warn('[sync] No team owner ids provided — skipping opportunity fetch');
      return [];
    }

    const select = [
      'opportunityid', 'name', 'statecode', 'statuscode',
      'estimatedvalue', 'estimatedclosedate', 'actualvalue', 'actualclosedate',
      'closeprobability', 'customerneed', 'description',
      'im360_bcn', 'im360_multivendoropportunity',
      'im360_oppstage', 'im360_opptype', 'im360_drpboxopptype', 'im360_recordtype',
      'im360_source', 'im360_singleorcrosssell',
      'im360_apnid', 'im360_awspartnertype1', 'im360_awsservicetype', 'im360_apntagging',
      'im360_endusertype', 'im360_supporttype', 'im360_payeraccount',
      'im360_existingpayeeaccount', 'im360_consolidationacceptancedate',
      'im360_mscsptenant', 'im360_mpnid', 'im360_migrationtype',
      'im360_competitivewinback', 'im360_publicsectorsegment',
      'im360_estimatedmrr', 'im360_annualrevenue', 'im360_expirydate',
      '_im360_primaryvendor_value', '_im360_primaryvendorid_value',
      '_im360_servicename1_value', '_im360_country_value', '_transactioncurrencyid_value',
      '_parentaccountid_value', '_parentcontactid_value', '_ownerid_value',
      'createdon', 'modifiedon',
    ].join(',');

    const ownerClause = Array.from(ownerIds).map((id) => `_ownerid_value eq ${id}`).join(' or ');
    let filter = `statecode ne 3 and _parentaccountid_value ne null and (${ownerClause})`;
    if (lastSync) filter += ` and modifiedon gt ${lastSync}`;
    const url = `${this.baseUrl}/api/data/v9.2/opportunities?$select=${select}&$filter=${encodeURIComponent(filter)}`;
    const now = new Date().toISOString();
    const records = await fetchAllPages<D365Opportunity>(url, token, 'Opportunities');
    return records
      .map((r) => mapD365OpportunityToOpportunity(r, now))
      .filter((o) => o.customerId && customerIds.has(o.customerId));
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

  async whoAmI(token: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/data/v9.2/WhoAmI`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`D365 WhoAmI failed ${res.status}: ${text}`);
    }
    const data = await res.json() as { UserId: string };
    return data.UserId;
  }

  async pushActivity(token: string, activity: Activity, callerD365Id?: string, contactPhone?: string | null): Promise<string> {
    const isUpdate = !!activity.remoteId;
    const accountBind = `/accounts(${activity.customerId})`;
    let entitySet: string;
    let body: Record<string, unknown>;

    // Resolve custom lookup nav property names (cached after first call)
    // Annotations use the standard polymorphic objectid lookup, not custom im360_* lookups
    const entityLogical = activity.type === 'call' ? 'phonecall'
      : activity.type === 'note' ? 'annotation' : 'appointment';
    const isAnnotation = entityLogical === 'annotation';
    const [accountNav, contactNav] = await Promise.all([
      isAnnotation ? Promise.resolve(null) : this.resolveNavProperty(token, entityLogical, 'im360_account'),
      !isAnnotation && activity.contactId ? this.resolveNavProperty(token, entityLogical, 'im360_contact') : Promise.resolve(null),
    ]);

    // Build custom lookup bindings using the resolved navigation property names
    const customBindings: Record<string, string> = {};
    if (accountNav) customBindings[`${accountNav}@odata.bind`] = accountBind;
    if (contactNav && activity.contactId) {
      customBindings[`${contactNav}@odata.bind`] = `/contacts(${activity.contactId})`;
    }

    if (activity.type === 'call') {
      if (!callerD365Id) throw new Error('D365 push activity: callerD365Id required for call');
      entitySet = 'phonecalls';
      const parties: Record<string, unknown>[] = [
        { 'partyid_systemuser@odata.bind': `/systemusers(${callerD365Id})`, participationtypemask: 1 },
      ];
      if (activity.contactId) {
        parties.push({ 'partyid_contact@odata.bind': `/contacts(${activity.contactId})`, participationtypemask: 2 });
      }
      body = {
        subject: activity.subject,
        description: activity.description ?? '',
        actualend: activity.occurredAt,
        scheduledend: activity.occurredAt,
        directioncode: activity.direction !== 'incoming',
        ...(contactPhone && { phonenumber: contactPhone }),
        'regardingobjectid_account@odata.bind': accountBind,
        ...customBindings,
        phonecall_activity_parties: parties,
      };
    } else if (activity.type === 'note') {
      entitySet = 'annotations';
      body = {
        subject: activity.subject,
        notetext: activity.description ?? '',
        'objectid_account@odata.bind': accountBind,
        ...customBindings,
      };
    } else {
      // 'meeting' and 'visit' both map to appointment
      if (!callerD365Id) throw new Error('D365 push activity: callerD365Id required for appointment');
      entitySet = 'appointments';
      const apptParties: Record<string, unknown>[] = [
        { 'partyid_systemuser@odata.bind': `/systemusers(${callerD365Id})`, participationtypemask: 7 },
      ];
      if (activity.contactId) {
        apptParties.push({ 'partyid_contact@odata.bind': `/contacts(${activity.contactId})`, participationtypemask: 5 });
      }
      body = {
        subject: activity.subject,
        description: activity.description || activity.subject,
        scheduledstart: activity.startTime ?? activity.occurredAt,
        scheduledend: activity.occurredAt,
        im360_appointmenttype: activity.type === 'visit' ? 2 : 0,
        'regardingobjectid_account@odata.bind': accountBind,
        ...customBindings,
        appointment_activity_parties: apptParties,
      };
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

    const resolvedId = isUpdate
      ? activity.remoteId!
      : parseEntityIdHeader(res.headers.get('OData-EntityId'));

    // D365 won't accept statecode/statuscode in the main body — set state via separate PATCH
    // Skip if open — D365 creates records as Open by default
    if ((activity.type === 'call' || activity.type === 'meeting' || activity.type === 'visit') && activity.activityStatus !== 'open') {
      const stateBody = activityStatusToD365State(activity.activityStatus, activity.type);
      const closeRes = await fetch(
        `${this.baseUrl}/api/data/v9.2/${entitySet}(${resolvedId})`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(stateBody),
        },
      );
      if (!closeRes.ok) {
        console.error(`[sync] Failed to set ${activity.type} status to ${activity.activityStatus} (${resolvedId}):`, await closeRes.text());
      }
    }

    return resolvedId;
  }

  async pushFollowUp(token: string, followUp: FollowUp): Promise<string> {
    const isUpdate = !!followUp.remoteId;
    const accountBind = `/accounts(${followUp.customerId})`;

    // Resolve custom im360_account lookup (same pattern as phone calls / appointments)
    const accountNav = await this.resolveNavProperty(token, 'task', 'im360_account');

    const body: Record<string, unknown> = {
      subject: followUp.title,
      description: followUp.description ?? '',
      scheduledend: followUp.dueDate,
      'regardingobjectid_account@odata.bind': accountBind,
    };
    if (accountNav) body[`${accountNav}@odata.bind`] = accountBind;

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

    const resolvedId = isUpdate
      ? followUp.remoteId!
      : parseEntityIdHeader(res.headers.get('OData-EntityId'));

    // D365 won't accept statecode/statuscode in the main body — set state via separate PATCH
    // Task states: 0=Open/statuscode 3, 1=Completed/statuscode 5
    const currentlyCompleted = followUp.completed;
    const needsStateChange = currentlyCompleted || (isUpdate && !currentlyCompleted);
    if (needsStateChange) {
      const stateBody = currentlyCompleted
        ? { statecode: 1, statuscode: 5 }
        : { statecode: 0, statuscode: 3 };
      const stateRes = await fetch(
        `${this.baseUrl}/api/data/v9.2/tasks(${resolvedId})`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(stateBody),
        },
      );
      if (!stateRes.ok) {
        console.error(`[sync] Failed to set task state to ${currentlyCompleted ? 'completed' : 'open'} (${resolvedId}):`, await stateRes.text());
      }
    }

    return resolvedId;
  }

  async pushOpportunity(
    token: string,
    opportunity: Opportunity,
    optionValues: OpportunityOptionValues,
    lookupValues: OpportunityLookupValues,
  ): Promise<string> {
    const isUpdate = !!opportunity.remoteId;

    const body: Record<string, unknown> = {
      name: opportunity.subject,
      closeprobability: opportunity.probability,
      im360_multivendoropportunity: opportunity.multiVendorOpportunity,
      'parentaccountid@odata.bind': `/accounts(${opportunity.customerId})`,
    };

    if (opportunity.estimatedRevenue != null) body.estimatedvalue = opportunity.estimatedRevenue;
    if (opportunity.expirationDate) {
      body.im360_expirydate = opportunity.expirationDate;
      body.estimatedclosedate = opportunity.expirationDate;
    }
    if (opportunity.customerNeed) body.customerneed = opportunity.customerNeed;
    if (opportunity.bcn) body.im360_bcn = opportunity.bcn;
    if (opportunity.contactId) body['parentcontactid@odata.bind'] = `/contacts(${opportunity.contactId})`;

    // Picklists (numeric option set values)
    if (optionValues.stage != null) body.im360_oppstage = optionValues.stage;
    if (optionValues.sellType != null) body.im360_opptype = optionValues.sellType;
    if (optionValues.opportunityType != null) body.im360_drpboxopptype = optionValues.opportunityType;
    if (optionValues.recordType != null) body.im360_recordtype = optionValues.recordType;
    if (optionValues.source != null) body.im360_source = optionValues.source;
    if (optionValues.singleOrCrossSell != null) body.im360_singleorcrosssell = optionValues.singleOrCrossSell;
    if (optionValues.awsPartnerType != null) body.im360_awspartnertype1 = optionValues.awsPartnerType;
    if (optionValues.awsServiceType != null) body.im360_awsservicetype = optionValues.awsServiceType;
    if (optionValues.apnTagging != null) body.im360_apntagging = optionValues.apnTagging;
    if (optionValues.endUserType != null) body.im360_endusertype = optionValues.endUserType;
    if (optionValues.supportType != null) body.im360_supporttype = optionValues.supportType;
    if (optionValues.migrationType != null) body.im360_migrationtype = optionValues.migrationType;
    if (optionValues.publicSectorSegment != null) body.im360_publicsectorsegment = optionValues.publicSectorSegment;

    // Strings + scalars
    if (opportunity.estimatedMRR != null) body.im360_estimatedmrr = opportunity.estimatedMRR;
    if (opportunity.annualRevenue != null) body.im360_annualrevenue = opportunity.annualRevenue;
    if (opportunity.apnId) body.im360_apnid = opportunity.apnId;
    if (opportunity.payerAccount) body.im360_payeraccount = opportunity.payerAccount;
    if (opportunity.existingPayeeAccount) body.im360_existingpayeeaccount = opportunity.existingPayeeAccount;
    if (opportunity.consolidationAcceptanceDate) body.im360_consolidationacceptancedate = opportunity.consolidationAcceptanceDate;
    if (opportunity.msCspTenant) body.im360_mscsptenant = opportunity.msCspTenant;
    if (opportunity.mpnId) body.im360_mpnid = opportunity.mpnId;
    if (opportunity.competitiveWinback) body.im360_competitivewinback = opportunity.competitiveWinback;

    // Lookups
    if (lookupValues.primaryVendorId) {
      body['im360_primaryvendorid@odata.bind'] = `/im360_vendors(${lookupValues.primaryVendorId})`;
    }
    if (lookupValues.serviceNameId) {
      body['im360_ServiceName1@odata.bind'] = `/im360_servicenames(${lookupValues.serviceNameId})`;
    }
    if (lookupValues.countryId) {
      body['im360_Country@odata.bind'] = `/im360_countries(${lookupValues.countryId})`;
    }
    if (lookupValues.currencyId) {
      body['transactioncurrencyid@odata.bind'] = `/transactioncurrencies(${lookupValues.currencyId})`;
    }

    const endpoint = isUpdate
      ? `${this.baseUrl}/api/data/v9.2/opportunities(${opportunity.remoteId})`
      : `${this.baseUrl}/api/data/v9.2/opportunities`;

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
      throw new Error(`D365 push opportunity failed ${res.status}: ${text}`);
    }

    const resolvedId = isUpdate
      ? opportunity.remoteId!
      : parseEntityIdHeader(res.headers.get('OData-EntityId'));

    // Close-as-won/lost flow: set actualvalue/actualclosedate/description first,
    // then statecode/statuscode in a separate PATCH (D365 rejects statecode in create body).
    if (opportunity.status !== 'Open') {
      const closeBody: Record<string, unknown> = {};
      if (opportunity.actualRevenue != null) closeBody.actualvalue = opportunity.actualRevenue;
      if (opportunity.closeDate) closeBody.actualclosedate = opportunity.closeDate;
      if (opportunity.closeDescription) closeBody.description = opportunity.closeDescription;
      if (Object.keys(closeBody).length > 0) {
        const closeRes = await fetch(
          `${this.baseUrl}/api/data/v9.2/opportunities(${resolvedId})`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'OData-MaxVersion': '4.0',
              'OData-Version': '4.0',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(closeBody),
          },
        );
        if (!closeRes.ok) {
          console.error(`[opportunity] Failed to set close fields for ${resolvedId}:`, await closeRes.text());
        }
      }

      const statusReason = opportunity.statusReason
        ? getStatusReasonCodeForPush(opportunity.statusReason, opportunity.status)
        : null;
      const stateBody = opportunity.status === 'Won'
        ? { statecode: 1, statuscode: statusReason ?? 3 }
        : { statecode: 2, statuscode: statusReason ?? 4 };
      const stateRes = await fetch(
        `${this.baseUrl}/api/data/v9.2/opportunities(${resolvedId})`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(stateBody),
        },
      );
      if (!stateRes.ok) {
        console.error(`[opportunity] Failed to set opportunity status to ${opportunity.status} (${resolvedId}):`, await stateRes.text());
      }
    }

    return resolvedId;
  }

  async fetchLookupTables(token: string): Promise<LookupTableFetchResult[]> {
    const headers = {
      Authorization: `Bearer ${token}`,
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      Accept: 'application/json',
    };

    const fetchOne = async (
      url: string,
      idField: string,
      nameField: string,
    ): Promise<LookupTableItem[]> => {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.error(`[sync] Lookup fetch failed ${res.status}: ${url}`);
        return [];
      }
      const json = (await res.json()) as { value: Array<Record<string, unknown>> };
      return json.value
        .map((r) => ({ remoteId: String(r[idField] ?? ''), label: String(r[nameField] ?? '') }))
        .filter((x) => x.remoteId && x.label);
    };

    // Only fetch cloud vendors whose name STARTS with AWS / MICROSOFT / Azure — full table has hundreds of hardware vendors,
    // and substring matches like "A&C - MICROSOFT SMARTPHONE" leak through `contains`.
    const vendorFilter = encodeURIComponent(
      "startswith(im360_name,'AWS') or startswith(im360_name,'MICROSOFT') or startswith(im360_name,'Microsoft') or startswith(im360_name,'AZURE') or startswith(im360_name,'Azure')",
    );
    const [vendors, serviceNames, countries, currencies] = await Promise.all([
      fetchOne(`${this.baseUrl}/api/data/v9.2/im360_vendors?$select=im360_vendorid,im360_name&$filter=${vendorFilter}`, 'im360_vendorid', 'im360_name'),
      fetchOne(`${this.baseUrl}/api/data/v9.2/im360_servicenames?$select=im360_servicenameid,im360_name`, 'im360_servicenameid', 'im360_name'),
      fetchOne(`${this.baseUrl}/api/data/v9.2/im360_countries?$select=im360_countryid,im360_name`, 'im360_countryid', 'im360_name'),
      fetchOne(`${this.baseUrl}/api/data/v9.2/transactioncurrencies?$select=transactioncurrencyid,isocurrencycode&$filter=isocurrencycode eq 'EUR' or isocurrencycode eq 'USD'`, 'transactioncurrencyid', 'isocurrencycode'),
    ]);

    return [
      { key: 'opportunity.primaryvendor', items: vendors },
      { key: 'opportunity.servicename', items: serviceNames },
      { key: 'opportunity.country', items: countries },
      { key: 'opportunity.currency', items: currencies },
    ];
  }

  async pushContact(token: string, contact: Contact): Promise<string> {
    const isUpdate = !!contact.remoteId;
    const body: Record<string, unknown> = {
      firstname: contact.firstName,
      lastname: contact.lastName,
      'parentcustomerid_account@odata.bind': `/accounts(${contact.customerId})`,
    };
    if (contact.jobTitle) body.jobtitle = contact.jobTitle;
    if (contact.email) body.emailaddress1 = contact.email;
    if (contact.phone) body.telephone1 = contact.phone;
    if (contact.mobile) body.mobilephone = contact.mobile;
    if (contact.cloudContact != null) body.im360_cloudcontact = contact.cloudContact;

    const endpoint = isUpdate
      ? `${this.baseUrl}/api/data/v9.2/contacts(${contact.remoteId})`
      : `${this.baseUrl}/api/data/v9.2/contacts`;

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
      throw new Error(`D365 push contact failed ${res.status}: ${text}`);
    }

    if (isUpdate) return contact.remoteId!;
    return parseEntityIdHeader(res.headers.get('OData-EntityId'));
  }

  async deleteContact(token: string, remoteId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/data/v9.2/contacts(${remoteId})`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ statecode: 1, statuscode: 2 }),
    });
    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      throw new Error(`D365 deactivate contact failed ${res.status}: ${text}`);
    }
  }

  async setPrimaryContact(token: string, accountId: string, contactRemoteId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/data/v9.2/accounts(${accountId})`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ 'primarycontactid@odata.bind': `/contacts(${contactRemoteId})` }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`D365 set primary contact failed ${res.status}: ${text}`);
    }
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

    if (res.status === 403) {
      console.warn(`[sync] Cannot delete ${entitySet}(${remoteId}) — record owned by another user, skipping`);
      return;
    }
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

    if (res.status === 403) {
      console.warn(`[sync] Cannot delete tasks(${remoteId}) — record owned by another user, skipping`);
      return;
    }
    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      throw new Error(`D365 delete follow-up failed ${res.status}: ${text}`);
    }
  }

  async deleteOpportunity(token: string, remoteId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/data/v9.2/opportunities(${remoteId})`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
    });
    if (res.status === 403) {
      console.warn(`[sync] Cannot delete opportunities(${remoteId}) — record owned by another user, skipping`);
      return;
    }
    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      throw new Error(`D365 delete opportunity failed ${res.status}: ${text}`);
    }
  }
}

// Mock implementation — returns static data, simulates network delay
class MockD365Adapter implements ID365Adapter {
  async fetchCustomers(_token: string, _lastSync?: string): Promise<Customer[]> {
    await delay(600);
    return mockCustomers.map((c) => ({ ...c, syncedAt: new Date().toISOString() }));
  }

  async fetchContacts(_token: string, customerIds: Set<string>, _lastSync?: string): Promise<Contact[]> {
    await delay(400);
    return mockContacts
      .map((c) => ({ ...c, syncedAt: new Date().toISOString() }))
      .filter((c) => customerIds.has(c.customerId));
  }

  async fetchPhoneCalls(_token: string, _customerIds: Set<string>, _lastSync?: string): Promise<Activity[]> {
    await delay(200);
    return [];
  }

  async fetchAppointments(_token: string, _customerIds: Set<string>, _lastSync?: string): Promise<Activity[]> {
    await delay(200);
    return [];
  }

  async fetchAnnotations(_token: string, _customerIds: Set<string>, _lastSync?: string): Promise<Activity[]> {
    await delay(200);
    return [];
  }

  async fetchTasks(_token: string, _customerIds: Set<string>, _lastSync?: string): Promise<FollowUp[]> {
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

  async whoAmI(_token: string): Promise<string> {
    await delay(100);
    return 'mock-system-user-id';
  }

  async pushActivity(_token: string, activity: Activity, _callerD365Id?: string, _contactPhone?: string | null): Promise<string> {
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

  async fetchOpportunities(_token: string, _customerIds: Set<string>, _ownerIds: Set<string>, _lastSync?: string): Promise<Opportunity[]> {
    await delay(200);
    return [];
  }

  async pushOpportunity(_token: string, opportunity: Opportunity, _optionValues: OpportunityOptionValues, _lookupValues: OpportunityLookupValues): Promise<string> {
    await delay(200);
    return `D365-OPP-${opportunity.id.slice(0, 8).toUpperCase()}`;
  }

  async fetchLookupTables(_token: string): Promise<LookupTableFetchResult[]> {
    await delay(100);
    return [
      { key: 'opportunity.primaryvendor', items: [] },
      { key: 'opportunity.servicename', items: [] },
      { key: 'opportunity.country', items: [
        { remoteId: '49b13989-71a5-e911-a97c-000d3a38c0ab', label: 'Belgium' },
        { remoteId: 'f3c312b9-71a5-e911-a97c-000d3a38c0ab', label: 'Netherlands' },
      ] },
      { key: 'opportunity.currency', items: [
        { remoteId: '364a4125-d95d-e811-a956-000d3a38c01d', label: 'EUR' },
        { remoteId: '0fd21096-6859-e811-a95f-000d3a2760f2', label: 'USD' },
      ] },
    ];
  }

  async deleteOpportunity(_token: string, _remoteId: string): Promise<void> {
    await delay(200);
  }

  async pushContact(_token: string, contact: Contact): Promise<string> {
    await delay(200);
    return `D365-CON-${contact.id.slice(0, 8).toUpperCase()}`;
  }

  async deleteContact(_token: string, _remoteId: string): Promise<void> {
    await delay(200);
  }

  async setPrimaryContact(_token: string, _accountId: string, _contactRemoteId: string): Promise<void> {
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
