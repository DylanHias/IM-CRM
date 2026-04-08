import { getDb } from '@/lib/db/client';
import type { OptionSetItem, OptionSetRow } from '@/types/optionSet';

export async function upsertOptionSet(
  entityName: string,
  attributeName: string,
  options: Array<{ value: number; label: string; displayOrder: number }>,
  syncedAt: string,
): Promise<void> {
  const db = await getDb();
  for (const opt of options) {
    await db.execute(
      `INSERT INTO option_sets (entity_name, attribute_name, option_value, option_label, display_order, synced_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT(entity_name, attribute_name, option_value) DO UPDATE SET
         option_label=excluded.option_label, display_order=excluded.display_order, synced_at=excluded.synced_at`,
      [entityName, attributeName, opt.value, opt.label, opt.displayOrder, syncedAt],
    );
  }
}

export async function queryOptionSet(
  entityName: string,
  attributeName: string,
): Promise<OptionSetItem[]> {
  const db = await getDb();
  const rows = await db.select<OptionSetRow[]>(
    `SELECT * FROM option_sets WHERE entity_name = $1 AND attribute_name = $2 ORDER BY display_order`,
    [entityName, attributeName],
  );
  return rows.map((r) => ({ value: r.option_value, label: r.option_label }));
}

export async function queryOptionSetValue(
  entityName: string,
  attributeName: string,
  label: string,
): Promise<number | null> {
  const db = await getDb();
  const rows = await db.select<{ option_value: number }[]>(
    `SELECT option_value FROM option_sets WHERE entity_name=$1 AND attribute_name=$2 AND option_label=$3 LIMIT 1`,
    [entityName, attributeName, label],
  );
  return rows[0]?.option_value ?? null;
}

export async function queryAllOptionSets(): Promise<Record<string, OptionSetItem[]>> {
  const db = await getDb();
  const rows = await db.select<OptionSetRow[]>(
    `SELECT * FROM option_sets ORDER BY entity_name, attribute_name, display_order`,
  );
  const result: Record<string, OptionSetItem[]> = {};
  for (const row of rows) {
    const key = `${row.entity_name}.${row.attribute_name}`;
    if (!result[key]) result[key] = [];
    result[key].push({ value: row.option_value, label: row.option_label });
  }
  return result;
}
