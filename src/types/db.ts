// Raw SQLite row types (snake_case, as returned by @tauri-apps/plugin-sql)
export interface CustomerRow {
  id: string;
  name: string;
  account_number: string | null;
  industry: string | null;
  segment: string | null;
  owner_id: string | null;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  address_street: string | null;
  address_city: string | null;
  address_country: string | null;
  website: string | null;
  status: string;
  last_activity_at: string | null;
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
  created_by_id: string;
  created_by_name: string;
  sync_status: string;
  remote_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingRow {
  id: string;
  customer_id: string;
  title: string;
  training_date: string;
  participant: string | null;
  provider: string | null;
  status: string | null;
  synced_at: string;
  created_at: string;
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
  created_at: string;
  updated_at: string;
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

export interface AppSettingRow {
  key: string;
  value: string;
  updated_at: string;
}
