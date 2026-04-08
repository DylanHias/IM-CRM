/**
 * D365 Schema Validation Script
 *
 * Fetches actual entity metadata from D365 WebAPI and compares every field,
 * navigation property, and @odata.bind reference used in our sync adapters
 * against the real schema. Flags mismatches and suggests fixes.
 *
 * Usage:
 *   D365_TOKEN="<bearer-token>" npx tsx scripts/validate-d365-schema.ts
 *
 * The token must have access to the D365 org at NEXT_PUBLIC_D365_BASE_URL.
 * Get one from the browser dev tools Network tab or via MSAL.
 */

import * as path from 'path';
import * as fs from 'fs';

// Parse .env.local manually (no dotenv dependency)
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const val = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const BASE_URL = (process.env.NEXT_PUBLIC_D365_BASE_URL ?? '').replace(/\/+$/, '');
const TOKEN = process.env.D365_TOKEN ?? '';

if (!BASE_URL) {
  console.error('ERROR: NEXT_PUBLIC_D365_BASE_URL not set in .env.local');
  process.exit(1);
}
if (!TOKEN) {
  console.error('ERROR: D365_TOKEN env var not set. Pass a valid bearer token.');
  console.error('  D365_TOKEN="eyJ..." npx tsx scripts/validate-d365-schema.ts');
  process.exit(1);
}

// ── Field references extracted from src/lib/sync/d365Adapter.ts ─────────────

interface EntityFieldMap {
  entitySetName: string;
  logicalName: string;
  pullFields: string[];
  pushFields: string[];
  odataBindings: string[];           // e.g. "regardingobjectid_account"
  navPropertyLookups: string[];      // custom lookups resolved via resolveNavProperty
  activityPartyBindings: string[];   // e.g. "partyid_systemuser"
  collectionNavProperties: string[]; // e.g. "phonecall_activity_parties"
}

const ENTITY_FIELD_MAP: Record<string, EntityFieldMap> = {
  account: {
    entitySetName: 'accounts',
    logicalName: 'account',
    pullFields: [
      'accountid', 'name', 'accountnumber', 'im360_bcn', 'industrycode',
      '_ownerid_value', 'telephone1', 'emailaddress1', 'address1_line1',
      'address1_city', 'address1_country', 'websiteurl',
      'im360_mainsegmentation', 'statecode', 'modifiedon',
    ],
    pushFields: [],
    odataBindings: [],
    navPropertyLookups: [],
    activityPartyBindings: [],
    collectionNavProperties: [],
  },
  contact: {
    entitySetName: 'contacts',
    logicalName: 'contact',
    pullFields: [
      'contactid', '_parentcustomerid_value', 'firstname', 'lastname',
      'jobtitle', 'emailaddress1', 'telephone1', 'mobilephone',
      'im360_contacttype', 'modifiedon',
    ],
    pushFields: [],
    odataBindings: [],
    navPropertyLookups: [],
    activityPartyBindings: [],
    collectionNavProperties: [],
  },
  phonecall: {
    entitySetName: 'phonecalls',
    logicalName: 'phonecall',
    pullFields: [
      'activityid', 'subject', 'description', 'im360_internalcomments',
      '_im360_account_value', '_im360_contact_value', '_ownerid_value',
      'directioncode', 'actualend', 'createdon', 'statecode', 'modifiedon',
    ],
    pushFields: [
      'subject', 'description', 'actualend', 'scheduledend',
      'directioncode', 'phonenumber',
      'statecode', 'statuscode',
    ],
    odataBindings: ['regardingobjectid_account'],
    navPropertyLookups: ['im360_account', 'im360_contact'],
    activityPartyBindings: ['partyid_systemuser', 'partyid_contact'],
    collectionNavProperties: ['phonecall_activity_parties'],
  },
  appointment: {
    entitySetName: 'appointments',
    logicalName: 'appointment',
    pullFields: [
      'activityid', 'subject', 'description', 'im360_appointmenttype',
      '_im360_account_value', '_im360_contact_value', '_ownerid_value',
      'scheduledstart', 'scheduledend', 'statecode', 'createdon', 'modifiedon',
    ],
    pushFields: [
      'subject', 'description', 'scheduledstart', 'scheduledend',
      'im360_appointmenttype',
      'statecode', 'statuscode',
    ],
    odataBindings: ['regardingobjectid_account'],
    navPropertyLookups: ['im360_account', 'im360_contact'],
    activityPartyBindings: ['partyid_systemuser', 'partyid_contact'],
    collectionNavProperties: ['appointment_activity_parties'],
  },
  annotation: {
    entitySetName: 'annotations',
    logicalName: 'annotation',
    pullFields: [
      'annotationid', 'subject', 'notetext', '_objectid_value',
      'objecttypecode', '_ownerid_value', 'createdon', 'modifiedon',
    ],
    pushFields: ['subject', 'notetext'],
    odataBindings: ['objectid_account'],
    navPropertyLookups: ['im360_account', 'im360_contact'],
    activityPartyBindings: [],
    collectionNavProperties: [],
  },
  task: {
    entitySetName: 'tasks',
    logicalName: 'task',
    pullFields: [
      'activityid', 'subject', 'description', '_regardingobjectid_value',
      '_ownerid_value', 'scheduledend', 'statecode', 'actualend',
      'im360_completedon', 'createdon', 'modifiedon',
    ],
    pushFields: [
      'subject', 'description', 'scheduledend',
      'statecode', 'statuscode',
    ],
    odataBindings: ['regardingobjectid_account'],
    navPropertyLookups: [],
    activityPartyBindings: [],
    collectionNavProperties: [],
  },
  systemuser: {
    entitySetName: 'systemusers',
    logicalName: 'systemuser',
    pullFields: [
      'systemuserid', 'fullname', 'internalemailaddress', 'jobtitle',
      'isdisabled', '_businessunitid_value', 'modifiedon',
    ],
    pushFields: [],
    odataBindings: [],
    navPropertyLookups: [],
    activityPartyBindings: [],
    collectionNavProperties: [],
  },
  team: {
    entitySetName: 'teams',
    logicalName: 'team',
    pullFields: ['teamid', 'name'],
    pushFields: [],
    odataBindings: [],
    navPropertyLookups: [],
    activityPartyBindings: [],
    collectionNavProperties: [],
  },
};

// Option set attributes we query via metadata API
const OPTION_SET_REFS: Array<{ entityName: string; attributeName: string; key: string }> = [
  { entityName: 'account', attributeName: 'industrycode', key: 'account.industrycode' },
  { entityName: 'opportunity', attributeName: 'im360_oppstage', key: 'opportunity.stage' },
  { entityName: 'opportunity', attributeName: 'im360_opptype', key: 'opportunity.selltype' },
  { entityName: 'opportunity', attributeName: 'im360_drpboxopptype', key: 'opportunity.opptype' },
  { entityName: 'opportunity', attributeName: 'im360_recordtype', key: 'opportunity.recordtype' },
  { entityName: 'opportunity', attributeName: 'im360_source', key: 'opportunity.source' },
];

// ── D365 Metadata Fetcher ───────────────────────────────────────────────────

interface D365AttributeMeta {
  LogicalName: string;
  AttributeType: string;
  SchemaName: string;
}

interface D365RelationshipMeta {
  SchemaName: string;
  ReferencingAttribute: string;
  ReferencedAttribute: string;
  ReferencedEntity: string;
  ReferencingEntityNavigationPropertyName: string;
}

interface Mismatch {
  entity: string;
  field: string;
  type: 'missing_attribute' | 'missing_nav_property' | 'missing_relationship' | 'wrong_lookup_suffix' | 'missing_option_set' | 'missing_collection_nav';
  detail: string;
  suggestion?: string;
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'OData-MaxVersion': '4.0',
  'OData-Version': '4.0',
  Accept: 'application/json',
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D365 API ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.json() as Promise<T>;
}

async function fetchEntityAttributes(logicalName: string): Promise<Map<string, D365AttributeMeta>> {
  const url = `${BASE_URL}/api/data/v9.2/EntityDefinitions(LogicalName='${logicalName}')/Attributes?$select=LogicalName,AttributeType,SchemaName`;
  const data = await fetchJson<{ value: D365AttributeMeta[] }>(url);
  const map = new Map<string, D365AttributeMeta>();
  for (const attr of data.value) {
    map.set(attr.LogicalName, attr);
  }
  return map;
}

async function fetchManyToOneRelationships(logicalName: string): Promise<D365RelationshipMeta[]> {
  const url = `${BASE_URL}/api/data/v9.2/EntityDefinitions(LogicalName='${logicalName}')/ManyToOneRelationships?$select=SchemaName,ReferencingAttribute,ReferencedAttribute,ReferencedEntity,ReferencingEntityNavigationPropertyName`;
  const data = await fetchJson<{ value: D365RelationshipMeta[] }>(url);
  return data.value;
}

async function fetchOneToManyRelationships(logicalName: string): Promise<Array<{ SchemaName: string; ReferencingEntityNavigationPropertyName: string; ReferencedEntityNavigationPropertyName: string }>> {
  const url = `${BASE_URL}/api/data/v9.2/EntityDefinitions(LogicalName='${logicalName}')/OneToManyRelationships?$select=SchemaName,ReferencingEntityNavigationPropertyName,ReferencedEntityNavigationPropertyName`;
  const data = await fetchJson<{ value: Array<{ SchemaName: string; ReferencingEntityNavigationPropertyName: string; ReferencedEntityNavigationPropertyName: string }> }>(url);
  return data.value;
}

async function checkOptionSetAttribute(entityName: string, attributeName: string): Promise<boolean> {
  const url = `${BASE_URL}/api/data/v9.2/EntityDefinitions(LogicalName='${entityName}')/Attributes(LogicalName='${attributeName}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName`;
  try {
    const res = await fetch(url, { headers });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Lookup field normalization ──────────────────────────────────────────────

function normalizeLookupField(field: string): string | null {
  // _foo_value → foo (the actual lookup attribute logical name)
  const m = field.match(/^_(.+)_value$/);
  return m ? m[1] : null;
}

// ── Validation ──────────────────────────────────────────────────────────────

async function validateEntity(key: string, config: EntityFieldMap): Promise<Mismatch[]> {
  const mismatches: Mismatch[] = [];
  console.log(`\n── Validating ${config.logicalName} (${config.entitySetName}) ──`);

  let attributes: Map<string, D365AttributeMeta>;
  let relationships: D365RelationshipMeta[];
  let oneToMany: Array<{ SchemaName: string; ReferencingEntityNavigationPropertyName: string; ReferencedEntityNavigationPropertyName: string }>;

  try {
    [attributes, relationships, oneToMany] = await Promise.all([
      fetchEntityAttributes(config.logicalName),
      fetchManyToOneRelationships(config.logicalName),
      fetchOneToManyRelationships(config.logicalName),
    ]);
  } catch (err) {
    console.error(`  FAILED to fetch metadata for ${config.logicalName}:`, (err as Error).message);
    mismatches.push({
      entity: config.logicalName,
      field: '*',
      type: 'missing_attribute',
      detail: `Could not fetch entity metadata: ${(err as Error).message}`,
    });
    return mismatches;
  }

  console.log(`  ${attributes.size} attributes, ${relationships.length} ManyToOne, ${oneToMany.length} OneToMany`);

  // Build a nav property map from relationships
  const navByAttribute = new Map<string, D365RelationshipMeta>();
  for (const rel of relationships) {
    navByAttribute.set(rel.ReferencingAttribute, rel);
  }

  const oneToManyNavNames = new Set<string>();
  for (const rel of oneToMany) {
    oneToManyNavNames.add(rel.ReferencedEntityNavigationPropertyName);
  }

  // ── Check pull fields ──
  const allFields = [...config.pullFields, ...config.pushFields];
  const uniqueFields = [...new Set(allFields)];

  for (const field of uniqueFields) {
    // Skip OData-computed fields
    if (field === 'statecode' || field === 'statuscode') {
      // These are always present on all entities
      if (!attributes.has(field)) {
        mismatches.push({
          entity: config.logicalName,
          field,
          type: 'missing_attribute',
          detail: `Standard field "${field}" not found — entity may not support it`,
        });
      }
      continue;
    }

    // Lookup value fields: _foo_value
    const lookupAttr = normalizeLookupField(field);
    if (lookupAttr) {
      if (!attributes.has(lookupAttr)) {
        // Check if it's an aliased system field (e.g., _ownerid_value → ownerid)
        if (!attributes.has(lookupAttr.replace(/id$/, ''))) {
          mismatches.push({
            entity: config.logicalName,
            field,
            type: 'wrong_lookup_suffix',
            detail: `Lookup attribute "${lookupAttr}" not found. Available custom lookups: ${
              [...attributes.values()].filter(a => a.AttributeType === 'Lookup' && a.LogicalName.startsWith('im360_')).map(a => a.LogicalName).join(', ') || '(none)'
            }`,
            suggestion: `Check if the field was renamed — grep for similar attributes`,
          });
        }
      }
      continue;
    }

    // Regular fields
    if (!attributes.has(field)) {
      // Try common alternatives
      const similar = [...attributes.keys()].filter(a =>
        a.includes(field.replace('im360_', '')) || field.includes(a.replace('im360_', ''))
      );
      mismatches.push({
        entity: config.logicalName,
        field,
        type: 'missing_attribute',
        detail: `Attribute "${field}" not found on ${config.logicalName}. ${similar.length > 0 ? `Similar: ${similar.join(', ')}` : ''}`,
        suggestion: similar.length > 0 ? `Did you mean: ${similar[0]}?` : undefined,
      });
    }
  }

  // ── Check @odata.bind navigation properties ──
  for (const binding of config.odataBindings) {
    // e.g. "regardingobjectid_account" — the nav property name used in "@odata.bind"
    // This is a single-valued navigation property
    const found = relationships.some(
      r => r.ReferencingEntityNavigationPropertyName === binding
    );
    if (!found) {
      const allNavNames = relationships.map(r => r.ReferencingEntityNavigationPropertyName);
      const similar = allNavNames.filter(n =>
        n.toLowerCase().includes('regarding') || n.toLowerCase().includes('account') || n.toLowerCase().includes('object')
      );
      mismatches.push({
        entity: config.logicalName,
        field: `${binding}@odata.bind`,
        type: 'missing_nav_property',
        detail: `Navigation property "${binding}" not found on ${config.logicalName}. ${similar.length > 0 ? `Similar: ${similar.join(', ')}` : ''}`,
        suggestion: similar.length > 0 ? `Did you mean: ${similar[0]}?` : undefined,
      });
    }
  }

  // ── Check custom lookup nav property resolution ──
  for (const lookupAttr of config.navPropertyLookups) {
    const rel = navByAttribute.get(lookupAttr);
    if (!rel) {
      // The lookup attribute itself might not exist
      if (!attributes.has(lookupAttr)) {
        mismatches.push({
          entity: config.logicalName,
          field: lookupAttr,
          type: 'missing_relationship',
          detail: `Custom lookup attribute "${lookupAttr}" not found on ${config.logicalName} — resolveNavProperty() will fail`,
        });
      } else {
        mismatches.push({
          entity: config.logicalName,
          field: lookupAttr,
          type: 'missing_relationship',
          detail: `No ManyToOne relationship found for attribute "${lookupAttr}" on ${config.logicalName}`,
        });
      }
    } else {
      console.log(`  ✓ Nav property for ${lookupAttr}: ${rel.ReferencingEntityNavigationPropertyName} → ${rel.ReferencedEntity}`);
    }
  }

  // ── Check activity party collection nav properties ──
  for (const collNav of config.collectionNavProperties) {
    if (!oneToManyNavNames.has(collNav)) {
      // Also check in the attributes (sometimes it's a relationship, not an attribute)
      const allOneToManyNames = [...oneToManyNavNames];
      const similar = allOneToManyNames.filter(n => n.toLowerCase().includes('activity_part'));
      mismatches.push({
        entity: config.logicalName,
        field: collNav,
        type: 'missing_collection_nav',
        detail: `Collection navigation property "${collNav}" not found. ${similar.length > 0 ? `Similar: ${similar.join(', ')}` : ''}`,
        suggestion: similar.length > 0 ? `Did you mean: ${similar[0]}?` : undefined,
      });
    }
  }

  // ── Check activity party bindings are valid nav property names ──
  if (config.activityPartyBindings.length > 0) {
    // Activity party bindings like "partyid_systemuser" are nav properties on the activityparty entity
    // We validate them separately since they're nested objects
    try {
      const partyRels = await fetchManyToOneRelationships('activityparty');
      const partyNavNames = new Set(partyRels.map(r => r.ReferencingEntityNavigationPropertyName));
      for (const partyBinding of config.activityPartyBindings) {
        if (!partyNavNames.has(partyBinding)) {
          const similar = [...partyNavNames].filter(n => n.includes('partyid'));
          mismatches.push({
            entity: `${config.logicalName}/activityparty`,
            field: `${partyBinding}@odata.bind`,
            type: 'missing_nav_property',
            detail: `Activity party binding "${partyBinding}" not found. ${similar.length > 0 ? `Available partyid bindings: ${similar.join(', ')}` : ''}`,
          });
        }
      }
    } catch (err) {
      console.error(`  Could not validate activity party bindings: ${(err as Error).message}`);
    }
  }

  return mismatches;
}

async function validateOptionSets(): Promise<Mismatch[]> {
  const mismatches: Mismatch[] = [];
  console.log('\n── Validating Option Set Attributes ──');

  for (const ref of OPTION_SET_REFS) {
    const exists = await checkOptionSetAttribute(ref.entityName, ref.attributeName);
    if (exists) {
      console.log(`  ✓ ${ref.key}: ${ref.entityName}.${ref.attributeName}`);
    } else {
      mismatches.push({
        entity: ref.entityName,
        field: ref.attributeName,
        type: 'missing_option_set',
        detail: `Option set attribute "${ref.attributeName}" not found on entity "${ref.entityName}" (key: ${ref.key})`,
      });
    }
  }

  return mismatches;
}

// ── Report Generator ────────────────────────────────────────────────────────

function generateReport(mismatches: Mismatch[]): string {
  const lines: string[] = [
    '# D365 Schema Validation Report',
    `Generated: ${new Date().toISOString()}`,
    `D365 Org: ${BASE_URL}`,
    '',
  ];

  if (mismatches.length === 0) {
    lines.push('## Result: ALL FIELDS VALID ✓');
    lines.push('', 'Every OData field, navigation property, and binding referenced in the sync adapters exists in the D365 schema.');
    return lines.join('\n');
  }

  lines.push(`## Result: ${mismatches.length} MISMATCH(ES) FOUND`);
  lines.push('');

  // Group by entity
  const byEntity = new Map<string, Mismatch[]>();
  for (const m of mismatches) {
    const list = byEntity.get(m.entity) ?? [];
    list.push(m);
    byEntity.set(m.entity, list);
  }

  for (const [entity, items] of byEntity) {
    lines.push(`### ${entity}`);
    lines.push('');
    for (const m of items) {
      lines.push(`- **${m.field}** (${m.type})`);
      lines.push(`  ${m.detail}`);
      if (m.suggestion) lines.push(`  → Suggestion: ${m.suggestion}`);
    }
    lines.push('');
  }

  // Auto-fix section
  const fixable = mismatches.filter(m => m.suggestion);
  if (fixable.length > 0) {
    lines.push('## Suggested Fixes');
    lines.push('');
    for (const m of fixable) {
      lines.push(`- \`${m.entity}.${m.field}\`: ${m.suggestion}`);
    }
  }

  return lines.join('\n');
}

// ── Fix Generator ───────────────────────────────────────────────────────────

interface Fix {
  file: string;
  oldText: string;
  newText: string;
  description: string;
}

function generateFixes(mismatches: Mismatch[]): Fix[] {
  const fixes: Fix[] = [];

  for (const m of mismatches) {
    if (!m.suggestion) continue;

    // Extract the suggested replacement from "Did you mean: X?"
    const didYouMean = m.suggestion.match(/Did you mean: (.+)\?/);
    if (!didYouMean) continue;

    const correctName = didYouMean[1];
    const adapterFile = 'src/lib/sync/d365Adapter.ts';
    const typesFile = 'src/types/api.ts';

    if (m.type === 'missing_attribute') {
      // Fix the field name in $select arrays and type definitions
      fixes.push({
        file: adapterFile,
        oldText: `'${m.field}'`,
        newText: `'${correctName}'`,
        description: `Replace "${m.field}" with "${correctName}" in ${m.entity} $select`,
      });
      fixes.push({
        file: typesFile,
        oldText: m.field,
        newText: correctName,
        description: `Update type definition: "${m.field}" → "${correctName}"`,
      });
    }

    if (m.type === 'missing_nav_property') {
      const bindingName = m.field.replace('@odata.bind', '');
      fixes.push({
        file: adapterFile,
        oldText: `'${bindingName}@odata.bind'`,
        newText: `'${correctName}@odata.bind'`,
        description: `Fix binding: "${bindingName}" → "${correctName}" on ${m.entity}`,
      });
    }
  }

  return fixes;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('D365 Schema Validation');
  console.log(`Org: ${BASE_URL}`);
  console.log('Fetching entity metadata...\n');

  const allMismatches: Mismatch[] = [];

  // Validate all entities
  for (const [key, config] of Object.entries(ENTITY_FIELD_MAP)) {
    try {
      const mismatches = await validateEntity(key, config);
      allMismatches.push(...mismatches);
    } catch (err) {
      console.error(`Failed to validate ${key}:`, (err as Error).message);
    }
  }

  // Validate option sets
  try {
    const optMismatches = await validateOptionSets();
    allMismatches.push(...optMismatches);
  } catch (err) {
    console.error('Failed to validate option sets:', (err as Error).message);
  }

  // Generate report
  const report = generateReport(allMismatches);
  const reportPath = path.resolve(__dirname, '../docs/d365-validation-report.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`\n${'='.repeat(60)}`);
  console.log(report);
  console.log(`\nReport saved to: ${reportPath}`);

  // Generate fixes
  if (allMismatches.length > 0) {
    const fixes = generateFixes(allMismatches);
    if (fixes.length > 0) {
      const fixPath = path.resolve(__dirname, '../docs/d365-suggested-fixes.json');
      fs.writeFileSync(fixPath, JSON.stringify(fixes, null, 2), 'utf-8');
      console.log(`\nSuggested fixes saved to: ${fixPath}`);
      console.log(`${fixes.length} auto-fixable issue(s) found.`);
    } else {
      console.log('\nNo auto-fixable issues — manual review needed for all mismatches.');
    }
  }

  // Exit with error code if mismatches found
  process.exit(allMismatches.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(2);
});
