export interface OptionSetItem {
  value: number;
  label: string;
}

export interface OptionSetRow {
  entity_name: string;
  attribute_name: string;
  option_value: number;
  option_label: string;
  display_order: number;
  synced_at: string;
}
