// Dynamics 365 OData response shapes
export interface D365Customer {
  accountid: string;
  name: string;
  accountnumber: string | null;
  industrycode: number | null;
  industrycode_formattedvalue: string | null;
  'ownerid@OData.Community.Display.V1.FormattedValue': string | null;
  _ownerid_value: string | null;
  telephone1: string | null;
  emailaddress1: string | null;
  address1_line1: string | null;
  address1_city: string | null;
  address1_country: string | null;
  websiteurl: string | null;
  statecode: number;
  modifiedon: string;
}

export interface D365Contact {
  contactid: string;
  _parentcustomerid_value: string;
  firstname: string;
  lastname: string;
  jobtitle: string | null;
  emailaddress1: string | null;
  telephone1: string | null;
  mobilephone: string | null;
  modifiedon: string;
  // Custom field — update schema name to match your D365 org (e.g. new_contacttype)
  new_contacttype_formattedvalue: string | null;
}

export interface D365ODataResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
}

// Training API response shapes
export interface TrainingApiRecord {
  id: string;
  customerId: string;
  courseName: string;
  courseDate: string;
  participantName: string | null;
  providerName: string | null;
  enrollmentStatus: 'completed' | 'registered' | 'cancelled';
}

export interface TrainingApiResponse {
  data: TrainingApiRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// SharePoint list item shapes (used by PowerAutomateAdapter)
export interface SpCustomerItem {
  fields: {
    AccountId: string;
    Title: string; // Name
    AccountNumber: string | null;
    Industry: string | null;
    OwnerId: string | null;
    OwnerName: string | null;
    Phone: string | null;
    Email: string | null;
    Street: string | null;
    City: string | null;
    Country: string | null;
    Website: string | null;
    StateCode: number;
    ModifiedOn: string;
  };
}

export interface SpContactItem {
  fields: {
    ContactId: string;
    CustomerId: string;
    FirstName: string;
    LastName: string;
    JobTitle: string | null;
    Email: string | null;
    Phone: string | null;
    Mobile: string | null;
    ContactType: string | null;
    ModifiedOn: string;
  };
}

export interface SpListResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
}

// D365 push entity shapes
export interface D365PhoneCall {
  subject: string;
  description: string;
  scheduledend: string;
  'regardingobjectid_account@odata.bind': string;
}

export interface D365Appointment {
  subject: string;
  description: string;
  scheduledend: string;
  'regardingobjectid_account@odata.bind': string;
}

export interface D365Annotation {
  subject: string;
  notetext: string;
  'objectid_account@odata.bind': string;
}

export interface D365Task {
  subject: string;
  description: string;
  scheduledend: string;
  'regardingobjectid_account@odata.bind': string;
}
