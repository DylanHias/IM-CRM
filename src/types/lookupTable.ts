export interface LookupTableItem {
  remoteId: string;
  label: string;
}

export interface LookupTableRow {
  table_key: string;
  remote_id: string;
  label: string;
  synced_at: string;
}

export type LookupTableKey =
  | 'opportunity.primaryvendor'
  | 'opportunity.servicename'
  | 'opportunity.country'
  | 'opportunity.currency'
  | 'contact.contacttype';
