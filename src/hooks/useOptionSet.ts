'use client';

import { useOptionSetStore } from '@/store/optionSetStore';
import { OPTION_SET_FIELDS, type OptionSetFieldKey } from '@/lib/sync/optionSetConfig';
import type { OptionSetItem } from '@/types/optionSet';

/**
 * Returns option set items for a given field key.
 * Falls back to hardcoded values from optionSetConfig when the store hasn't been hydrated yet.
 */
export function useOptionSet(key: OptionSetFieldKey): {
  options: OptionSetItem[];
  labels: string[];
  isLoaded: boolean;
} {
  const { optionSets, isLoaded } = useOptionSetStore();
  const config = OPTION_SET_FIELDS[key];
  const storeKey = `${config.entityName}.${config.attributeName}`;
  const storeOptions = optionSets[storeKey];

  const options = storeOptions && storeOptions.length > 0
    ? storeOptions
    : config.fallbackOptions;

  return {
    options,
    labels: options.map((o) => o.label),
    isLoaded,
  };
}
