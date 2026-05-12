// Raw SQLite row types (snake_case, as returned by @tauri-apps/plugin-sql)
export interface CustomerRow {
  id: string;
  name: string;
  account_number: string | null;
  industry: string | null;
  segment: string | null;
  owner_id: string | null;
  owner_name: string | null;
  customer_success_manager_id: string | null;
  customer_success_manager_name: string | null;
  aws_owner_id: string | null;
  aws_owner_name: string | null;
  azure_owner_id: string | null;
  azure_owner_name: string | null;
  mpn_id: string | null;
  apn_id: string | null;
  phone: string | null;
  email: string | null;
  address_street: string | null;
  address_city: string | null;
  address_country: string | null;
  website: string | null;
  reseller_id: string | null;
  bcn: string | null;
  cloud_customer: number | null;
  arr: number | null;
  arr_currency: string | null;
  status: string;
  last_activity_at: string | null;
  health_score: number | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface ContactRow {
  id: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  notes: string | null;
  contact_type: string | null;
  contact_type_id: string | null;
  country_id: string | null;
  country_name: string | null;
  cloud_contact: number | null;
  is_primary: number;
  sync_status: string;
  remote_id: string | null;
  source: string | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityRow {
  id: string;
  customer_id: string;
  contact_id: string | null;
  type: string;
  subject: string;
  description: string | null;
  occurred_at: string;
  start_time: string | null;
  activity_status: string;
  direction: string | null;
  created_by_id: string;
  created_by_name: string;
  sync_status: string;
  remote_id: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface FollowUpRow {
  id: string;
  customer_id: string;
  activity_id: string | null;
  title: string;
  description: string | null;
  due_date: string;
  completed: number;
  completed_at: string | null;
  created_by_id: string;
  created_by_name: string;
  sync_status: string;
  remote_id: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface OpportunityRow {
  id: string;
  customer_id: string;
  contact_id: string | null;
  status: string;
  subject: string;
  bcn: string | null;
  multi_vendor_opportunity: number;
  sell_type: string;
  primary_vendor: string | null;
  opportunity_type: string | null;
  stage: string;
  probability: number;
  expiration_date: string | null;
  estimated_revenue: number | null;
  currency: string;
  country: string;
  source: string;
  record_type: string;
  customer_need: string | null;
  sync_status: string;
  remote_id: string | null;
  opportunity_number: string | null;
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  single_or_cross_sell: string | null;
  estimated_mrr: number | null;
  annual_revenue: number | null;
  apn_id: string | null;
  aws_partner_type: string | null;
  aws_service_type: string | null;
  apn_tagging: string | null;
  end_user_type: string | null;
  support_type: string | null;
  payer_account: string | null;
  existing_payee_account: string | null;
  consolidation_acceptance_date: string | null;
  ms_csp_tenant: string | null;
  mpn_id: string | null;
  migration_type: string | null;
  service_name: string | null;
  competitive_winback: number | string | null;
  public_sector_segment: string | null;
  status_reason: string | null;
  actual_revenue: number | null;
  close_date: string | null;
  competitor_id: string | null;
  close_description: string | null;
}

export interface SyncRecordRow {
  id: number;
  sync_type: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  records_pulled: number;
  records_pushed: number;
  error_message: string | null;
  created_at: string;
}

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  business_unit: string | null;
  title: string | null;
  last_active_at: string | null;
  profile_photo: string | null;
  analytics_tracked: number;
  created_at: string;
  updated_at: string;
}

export interface CloudBeluxUserRow {
  id: string;
  name: string;
  email: string | null;
  job_title: string | null;
  synced_at: string;
}

