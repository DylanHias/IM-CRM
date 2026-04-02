// Dynamics 365 OData response shapes
export interface D365Customer {
  accountid: string;
  name: string;
  accountnumber: string | null;
  industrycode: number | null;
  'industrycode@OData.Community.Display.V1.FormattedValue'?: string;
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  _ownerid_value: string | null;
  telephone1: string | null;
  emailaddress1: string | null;
  address1_line1: string | null;
  address1_city: string | null;
  address1_country: string | null;
  websiteurl: string | null;
  im360_cloudpurchaser: boolean | null;
  im360_mainsegmentation: number | null;
  'im360_mainsegmentation@OData.Community.Display.V1.FormattedValue'?: string;
  primarycontactid?: {
    preferredlanguagecode: number | null;
    'preferredlanguagecode@OData.Community.Display.V1.FormattedValue'?: string;
  } | null;
  statecode: number;
  modifiedon: string;
}

export interface D365Contact {
  contactid: string;
  _parentcustomerid_value: string;
  firstname: string | null;
  lastname: string | null;
  jobtitle: string | null;
  emailaddress1: string | null;
  telephone1: string | null;
  mobilephone: string | null;
  modifiedon: string;
  // Custom field — update schema name to match your D365 org (e.g. new_contacttype)
  'new_contacttype@OData.Community.Display.V1.FormattedValue'?: string;
}

export interface D365ODataResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
}

export interface D365PhoneCall {
  activityid: string;
  subject: string | null;
  description: string | null;
  im360_internalcomments: string | null;
  _im360_account_value: string | null;
  _im360_contact_value: string | null;
  _ownerid_value: string | null;
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  actualend: string | null;
  createdon: string;
  statecode: number;
  modifiedon: string;
}

export interface D365Appointment {
  activityid: string;
  subject: string | null;
  description: string | null;
  im360_appointmenttype: number | null;
  _im360_account_value: string | null;
  _im360_contact_value: string | null;
  _ownerid_value: string | null;
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  scheduledstart: string | null;
  scheduledend: string | null;
  statecode: number;
  createdon: string;
  modifiedon: string;
}

export interface D365Annotation {
  annotationid: string;
  subject: string | null;
  notetext: string | null;
  _objectid_value: string | null;
  objecttypecode: string | null;
  _ownerid_value: string | null;
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  createdon: string;
  modifiedon: string;
}

export interface D365Task {
  activityid: string;
  subject: string | null;
  description: string | null;
  _regardingobjectid_value: string | null;
  _ownerid_value: string | null;
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  scheduledend: string | null;
  statecode: number;
  actualend: string | null;
  im360_completedon: string | null;
  createdon: string;
  modifiedon: string;
}

export interface D365SystemUser {
  systemuserid: string;
  fullname: string;
  internalemailaddress: string | null;
  isdisabled: boolean;
  '_businessunitid_value': string | null;
  '_businessunitid_value@OData.Community.Display.V1.FormattedValue'?: string;
  modifiedon: string;
}

export interface D365AuditRecord {
  auditid: string;
  createdon: string;
  '_userid_value': string;
  '_userid_value@OData.Community.Display.V1.FormattedValue'?: string;
  '_objectid_value': string;
  objecttypecode: string;
  operation: number; // 1=Create, 2=Update, 3=Delete
  changedata: string | null;
}

