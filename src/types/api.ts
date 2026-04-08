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
  im360_bcn: string | null;
  im360_mainsegmentation: number | null;
  'im360_mainsegmentation@OData.Community.Display.V1.FormattedValue'?: string;
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
  im360_contacttype: number | null;
  im360_cloudcontact: boolean | null;
  modifiedon: string;
  'im360_contacttype@OData.Community.Display.V1.FormattedValue'?: string;
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
  directioncode: boolean | null;
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
  jobtitle: string | null;
  isdisabled: boolean;
  '_businessunitid_value': string | null;
  '_businessunitid_value@OData.Community.Display.V1.FormattedValue'?: string;
  modifiedon: string;
}

export interface D365Opportunity {
  opportunityid: string;
  name: string | null;
  statecode: number;
  estimatedvalue: number | null;
  estimatedclosedate: string | null;
  closeprobability: number | null;
  customerneed: string | null;
  im360_bcn: string | null;
  im360_multivendoropportunity: boolean | null;
  im360_oppstage: number | null;
  im360_opptype: number | null;
  im360_drpboxopptype: number | null;
  im360_recordtype: number | null;
  im360_source: number | null;
  im360_primaryvendorname: string | null;
  _parentaccountid_value: string | null;
  _contactid_value: string | null;
  _ownerid_value: string | null;
  'im360_oppstage@OData.Community.Display.V1.FormattedValue'?: string;
  'im360_opptype@OData.Community.Display.V1.FormattedValue'?: string;
  'im360_drpboxopptype@OData.Community.Display.V1.FormattedValue'?: string;
  'im360_recordtype@OData.Community.Display.V1.FormattedValue'?: string;
  'im360_source@OData.Community.Display.V1.FormattedValue'?: string;
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  createdon: string;
  modifiedon: string;
}


