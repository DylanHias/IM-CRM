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
