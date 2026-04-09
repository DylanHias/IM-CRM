# Opportunity Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full bidirectional D365 sync for opportunities — pull, push creates/edits, push deletes, and Win/Lost status transitions.

**Architecture:** Inline extension of existing files. No new modules. Every pattern mirrors activities exactly: direct push on mutation, pending queue as fallback, pull via batchedUpsert in syncD365.

**Tech Stack:** TypeScript, Zustand, Tauri SQL (SQLite), D365 OData v9.2, Vitest + RTL

---

## File Map

| File | Change |
|---|---|
| `src/lib/db/queries/opportunities.ts` | Update `deleteOpportunity` to return remoteId; add 4 sync helpers |
| `src/lib/db/queries/optionSets.ts` | Add `queryOptionSetValue` |
| `src/types/api.ts` | Add `D365Opportunity` interface |
| `src/lib/sync/d365Adapter.ts` | Add `OpportunityOptionValues`, 3 new methods, update `ID365Adapter`, update `MockD365Adapter` |
| `src/lib/sync/directPushService.ts` | Add `directPushOpportunity`, `directDeleteOpportunity` |
| `src/hooks/useOpportunities.ts` | Wire direct push + pending delete (matches useActivities pattern) |
| `src/lib/sync/syncService.ts` | Pull phase, push phase, delete phase |
| `src/hooks/__tests__/useOpportunities.test.ts` | Create — hook behavior tests |

---

## Task 1: DB query helpers

**Files:**
- Modify: `src/lib/db/queries/opportunities.ts`
- Modify: `src/lib/db/queries/optionSets.ts`

- [ ] **Step 1: Update `deleteOpportunity` to return remoteId before deleting**

In `src/lib/db/queries/opportunities.ts`, replace lines 104–107:

```typescript
export async function deleteOpportunity(id: string): Promise<{ remoteId: string | null } | null> {
  const db = await getDb();
  const rows = await db.select<OpportunityRow[]>(`SELECT * FROM opportunities WHERE id=$1`, [id]);
  await db.execute(`DELETE FROM opportunities WHERE id=$1`, [id]);
  if (rows[0]) return { remoteId: rows[0].remote_id };
  return null;
}
```

- [ ] **Step 2: Add `queryPendingOpportunities` at the end of `src/lib/db/queries/opportunities.ts`**

```typescript
export async function queryPendingOpportunities(): Promise<Opportunity[]> {
  const db = await getDb();
  const rows = await db.select<OpportunityRow[]>(
    `SELECT * FROM opportunities WHERE sync_status = 'pending' ORDER BY created_at`
  );
  return rows.map(rowToOpportunity);
}
```

- [ ] **Step 3: Add `markOpportunitySynced` and `markOpportunitySyncError`**

```typescript
export async function markOpportunitySynced(id: string, remoteId: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE opportunities SET sync_status = 'synced', remote_id = $1, updated_at = $2 WHERE id = $3`,
    [remoteId, new Date().toISOString(), id]
  );
}

export async function markOpportunitySyncError(id: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE opportunities SET sync_status = 'error', updated_at = $1 WHERE id = $2`,
    [new Date().toISOString(), id]
  );
}
```

- [ ] **Step 4: Add `upsertPulledOpportunity`**

```typescript
export async function upsertPulledOpportunity(opp: Opportunity): Promise<boolean> {
  const db = await getDb();

  const existing = await db.select<OpportunityRow[]>(
    `SELECT id, sync_status FROM opportunities WHERE remote_id = $1`,
    [opp.remoteId]
  );
  if (existing.length > 0 && existing[0].sync_status === 'pending') return false;

  const customerExists = await db.select<{ id: string }[]>(
    `SELECT id FROM customers WHERE id = $1`,
    [opp.customerId]
  );
  if (customerExists.length === 0) return false;

  let contactId = opp.contactId;
  if (contactId) {
    const contactExists = await db.select<{ id: string }[]>(
      `SELECT id FROM contacts WHERE id = $1`,
      [contactId]
    );
    if (contactExists.length === 0) contactId = null;
  }

  if (existing.length > 0) {
    await db.execute(
      `UPDATE opportunities SET
        customer_id=$1, contact_id=$2, status=$3, subject=$4, bcn=$5,
        multi_vendor_opportunity=$6, sell_type=$7, primary_vendor=$8,
        opportunity_type=$9, stage=$10, probability=$11, expiration_date=$12,
        estimated_revenue=$13, source=$14, record_type=$15, customer_need=$16,
        sync_status='synced', updated_at=$17
       WHERE remote_id=$18`,
      [
        opp.customerId, contactId, opp.status, opp.subject, opp.bcn,
        opp.multiVendorOpportunity ? 1 : 0, opp.sellType, opp.primaryVendor,
        opp.opportunityType, opp.stage, opp.probability, opp.expirationDate,
        opp.estimatedRevenue, opp.source, opp.recordType, opp.customerNeed,
        opp.updatedAt, opp.remoteId,
      ]
    );
  } else {
    await db.execute(
      `INSERT INTO opportunities (
        id, customer_id, contact_id, status, subject, bcn, multi_vendor_opportunity,
        sell_type, primary_vendor, opportunity_type, stage, probability,
        expiration_date, estimated_revenue, currency, country, source, record_type,
        customer_need, sync_status, remote_id, created_by_id, created_by_name,
        created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
      [
        opp.id, opp.customerId, contactId, opp.status, opp.subject, opp.bcn,
        opp.multiVendorOpportunity ? 1 : 0, opp.sellType, opp.primaryVendor,
        opp.opportunityType, opp.stage, opp.probability, opp.expirationDate,
        opp.estimatedRevenue, opp.currency, opp.country, opp.source, opp.recordType,
        opp.customerNeed, 'synced', opp.remoteId, opp.createdById, opp.createdByName,
        opp.createdAt, opp.updatedAt,
      ]
    );
  }
  return true;
}
```

- [ ] **Step 5: Add `queryOptionSetValue` to `src/lib/db/queries/optionSets.ts`**

```typescript
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
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/queries/opportunities.ts src/lib/db/queries/optionSets.ts
git commit -m "feat: add opportunity sync DB helpers and option set value lookup"
```

---

## Task 2: Write failing hook test (TDD)

**Files:**
- Create: `src/hooks/__tests__/useOpportunities.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

vi.mock('@/lib/sync/directPushService', () => ({
  directPushOpportunity: vi.fn().mockResolvedValue(null),
  directDeleteOpportunity: vi.fn().mockResolvedValue(false),
}));

import { useOpportunities } from '@/hooks/useOpportunities';
import { useOpportunityStore } from '@/store/opportunityStore';
import { useAuthStore } from '@/store/authStore';
import { mockOpportunities } from '@/lib/mock/opportunities';
import type { AccountInfo } from '@azure/msal-browser';

const CUSTOMER_ID = 'cust-001';

const mockAccount: AccountInfo = {
  homeAccountId: 'home-1',
  localAccountId: 'local-1',
  environment: 'login.microsoftonline.com',
  tenantId: 'tenant-1',
  username: 'dylan@test.com',
  name: 'Dylan Test',
};

describe('useOpportunities', () => {
  beforeEach(() => {
    useOpportunityStore.setState({
      opportunities: mockOpportunities.filter((o) => o.customerId === CUSTOMER_ID),
      currentCustomerId: CUSTOMER_ID,
      isLoading: false,
    });
    useAuthStore.setState({
      account: mockAccount,
      accessToken: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      isAdmin: false,
    });
  });

  it('returns opportunities for customerId', () => {
    const { result } = renderHook(() => useOpportunities(CUSTOMER_ID));

    expect(result.current.opportunities.length).toBeGreaterThan(0);
    result.current.opportunities.forEach((o) => {
      expect(o.customerId).toBe(CUSTOMER_ID);
    });
  });

  it('createOpportunity creates with UUID, auth info, pending syncStatus', async () => {
    const { result } = renderHook(() => useOpportunities(CUSTOMER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let created: Awaited<ReturnType<typeof result.current.createOpportunity>> | undefined;

    await act(async () => {
      created = await result.current.createOpportunity({
        customerId: CUSTOMER_ID,
        contactId: null,
        status: 'Open',
        subject: 'Test opportunity',
        bcn: null,
        multiVendorOpportunity: false,
        sellType: 'New',
        primaryVendor: null,
        opportunityType: null,
        stage: 'Prospecting',
        probability: 5,
        expirationDate: null,
        estimatedRevenue: null,
        currency: 'EUR',
        country: 'Belgium',
        source: 'cloud',
        recordType: 'Sales',
        customerNeed: null,
      });
    });

    expect(created).toBeDefined();
    expect(created!.id).toBeTruthy();
    expect(created!.createdById).toBe('local-1');
    expect(created!.createdByName).toBe('Dylan Test');
    expect(created!.syncStatus).toBe('pending');
  });

  it('editOpportunity updates opportunity in store', async () => {
    const { result } = renderHook(() => useOpportunities(CUSTOMER_ID));

    const original = result.current.opportunities[0];
    const updated = { ...original, subject: 'Updated subject' };

    await act(async () => {
      await result.current.editOpportunity(updated);
    });

    const found = result.current.opportunities.find((o) => o.id === original.id);
    expect(found?.subject).toBe('Updated subject');
  });

  it('deleteOpportunity removes from store', async () => {
    const { result } = renderHook(() => useOpportunities(CUSTOMER_ID));

    const target = result.current.opportunities[0];
    const countBefore = result.current.opportunities.length;

    await act(async () => {
      await result.current.deleteOpportunity(target.id);
    });

    expect(result.current.opportunities.length).toBe(countBefore - 1);
    expect(result.current.opportunities.find((o) => o.id === target.id)).toBeUndefined();
  });

  it('filters opportunities by customerId in return value', () => {
    const { result } = renderHook(() => useOpportunities(CUSTOMER_ID));

    result.current.opportunities.forEach((o) => {
      expect(o.customerId).toBe(CUSTOMER_ID);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail for the right reason**

```bash
pnpm vitest run src/hooks/__tests__/useOpportunities.test.ts
```

Expected: Tests may pass partially (store behavior already works) but the mock import of `directPushOpportunity` / `directDeleteOpportunity` from `directPushService` will error since those exports don't exist yet. That's the expected failure.

---

## Task 3: D365Opportunity type + OpportunityOptionValues

**Files:**
- Modify: `src/types/api.ts`

- [ ] **Step 1: Add `D365Opportunity` interface at the end of `src/types/api.ts`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types/api.ts
git commit -m "feat: add D365Opportunity type"
```

---

## Task 4: D365 adapter — fetchOpportunities

**Files:**
- Modify: `src/lib/sync/d365Adapter.ts`

- [ ] **Step 1: Add `D365Opportunity` to the import at line 4**

Change:
```typescript
import type {
  D365Customer, D365Contact, D365ODataResponse,
  D365PhoneCall, D365Appointment, D365Annotation, D365Task,
} from '@/types/api';
```
To:
```typescript
import type {
  D365Customer, D365Contact, D365ODataResponse,
  D365PhoneCall, D365Appointment, D365Annotation, D365Task, D365Opportunity,
} from '@/types/api';
```

Also add `Opportunity` to the entities import at line 1:
```typescript
import type { Customer, Contact, Activity, FollowUp, ActivityType, Opportunity } from '@/types/entities';
```

And add `OpportunityStatus` import (it's used in the mapper):
```typescript
import type { Customer, Contact, Activity, FollowUp, ActivityType, Opportunity, OpportunityStatus } from '@/types/entities';
```

- [ ] **Step 2: Add `OpportunityOptionValues` export interface after `OptionSetData` (after line 15)**

```typescript
export interface OpportunityOptionValues {
  stage: number | null;
  sellType: number | null;
  opportunityType: number | null;
  recordType: number | null;
  source: number | null;
}
```

- [ ] **Step 3: Add `fetchOpportunities`, `pushOpportunity`, `deleteOpportunity` to `ID365Adapter` interface (after line 29)**

```typescript
  fetchOpportunities(token: string, customerIds: Set<string>, lastSync?: string): Promise<Opportunity[]>;
  pushOpportunity(token: string, opportunity: Opportunity, optionValues: OpportunityOptionValues): Promise<string>;
  deleteOpportunity(token: string, remoteId: string): Promise<void>;
```

- [ ] **Step 4: Add mapper function before `class RealD365Adapter` (before line 280)**

```typescript
function mapD365OpportunityToOpportunity(r: D365Opportunity, now: string): Opportunity {
  const statusMap: Record<number, OpportunityStatus> = { 0: 'Open', 1: 'Won', 2: 'Lost' };
  return {
    id: uuidv4(),
    customerId: r._parentaccountid_value ?? '',
    contactId: r._contactid_value ?? null,
    status: statusMap[r.statecode] ?? 'Open',
    subject: r.name ?? '',
    bcn: r.im360_bcn ?? null,
    multiVendorOpportunity: r.im360_multivendoropportunity ?? false,
    sellType: r['im360_opptype@OData.Community.Display.V1.FormattedValue'] ?? '',
    primaryVendor: r.im360_primaryvendorname ?? null,
    opportunityType: r['im360_drpboxopptype@OData.Community.Display.V1.FormattedValue'] ?? null,
    stage: r['im360_oppstage@OData.Community.Display.V1.FormattedValue'] ?? 'Prospecting',
    probability: r.closeprobability ?? 5,
    expirationDate: r.estimatedclosedate ? r.estimatedclosedate.split('T')[0] : null,
    estimatedRevenue: r.estimatedvalue ?? null,
    currency: 'EUR',
    country: 'Belgium',
    source: r['im360_source@OData.Community.Display.V1.FormattedValue'] ?? 'cloud',
    recordType: r['im360_recordtype@OData.Community.Display.V1.FormattedValue'] ?? 'Sales',
    customerNeed: r.customerneed ?? null,
    syncStatus: 'synced',
    remoteId: r.opportunityid,
    createdById: r._ownerid_value ?? '',
    createdByName: r['_ownerid_value@OData.Community.Display.V1.FormattedValue'] ?? 'Unknown',
    createdAt: r.createdon ?? now,
    updatedAt: r.modifiedon ?? now,
  };
}
```

- [ ] **Step 5: Add `fetchOpportunities` method to `RealD365Adapter` (after `fetchTasks`, before `fetchOptionSets`)**

```typescript
  async fetchOpportunities(token: string, customerIds: Set<string>, lastSync?: string): Promise<Opportunity[]> {
    const select = [
      'opportunityid', 'name', 'statecode', 'estimatedvalue', 'estimatedclosedate',
      'closeprobability', 'customerneed', 'im360_bcn', 'im360_multivendoropportunity',
      'im360_oppstage', 'im360_opptype', 'im360_drpboxopptype', 'im360_recordtype',
      'im360_source', 'im360_primaryvendorname',
      '_parentaccountid_value', '_contactid_value', '_ownerid_value',
      'createdon', 'modifiedon',
    ].join(',');

    let filter = 'statecode ne 3 and _parentaccountid_value ne null';
    if (lastSync) filter += ` and modifiedon gt ${lastSync}`;
    const url = `${this.baseUrl}/api/data/v9.2/opportunities?$select=${select}&$filter=${encodeURIComponent(filter)}`;
    const now = new Date().toISOString();
    const records = await fetchAllPages<D365Opportunity>(url, token, 'Opportunities');
    return records
      .map((r) => mapD365OpportunityToOpportunity(r, now))
      .filter((o) => o.customerId && customerIds.has(o.customerId));
  }
```

- [ ] **Step 6: Add `pushOpportunity` method to `RealD365Adapter` (after `pushFollowUp`)**

```typescript
  async pushOpportunity(token: string, opportunity: Opportunity, optionValues: OpportunityOptionValues): Promise<string> {
    const isUpdate = !!opportunity.remoteId;

    const body: Record<string, unknown> = {
      name: opportunity.subject,
      closeprobability: opportunity.probability,
      im360_multivendoropportunity: opportunity.multiVendorOpportunity,
      'parentaccountid@odata.bind': `/accounts(${opportunity.customerId})`,
    };

    if (opportunity.estimatedRevenue != null) body.estimatedvalue = opportunity.estimatedRevenue;
    if (opportunity.expirationDate) body.estimatedclosedate = opportunity.expirationDate;
    if (opportunity.customerNeed) body.customerneed = opportunity.customerNeed;
    if (opportunity.bcn) body.im360_bcn = opportunity.bcn;
    if (opportunity.primaryVendor) body.im360_primaryvendorname = opportunity.primaryVendor;
    if (opportunity.contactId) body['contactid@odata.bind'] = `/contacts(${opportunity.contactId})`;
    if (optionValues.stage != null) body.im360_oppstage = optionValues.stage;
    if (optionValues.sellType != null) body.im360_opptype = optionValues.sellType;
    if (optionValues.opportunityType != null) body.im360_drpboxopptype = optionValues.opportunityType;
    if (optionValues.recordType != null) body.im360_recordtype = optionValues.recordType;
    if (optionValues.source != null) body.im360_source = optionValues.source;

    const endpoint = isUpdate
      ? `${this.baseUrl}/api/data/v9.2/opportunities(${opportunity.remoteId})`
      : `${this.baseUrl}/api/data/v9.2/opportunities`;

    const res = await fetch(endpoint, {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`D365 push opportunity failed ${res.status}: ${text}`);
    }

    const resolvedId = isUpdate
      ? opportunity.remoteId!
      : (() => {
          const entityId = res.headers.get('OData-EntityId') ?? '';
          const match = entityId.match(/\(([^)]+)\)$/);
          return match ? match[1] : entityId;
        })();

    // D365 won't accept statecode in the main body for opportunities — set via separate PATCH
    // Open is the default; only patch if Won or Lost
    if (opportunity.status !== 'Open') {
      const stateBody = opportunity.status === 'Won'
        ? { statecode: 1, statuscode: 3 }
        : { statecode: 2, statuscode: 4 };
      const stateRes = await fetch(
        `${this.baseUrl}/api/data/v9.2/opportunities(${resolvedId})`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(stateBody),
        },
      );
      if (!stateRes.ok) {
        console.error(`[opportunity] Failed to set opportunity status to ${opportunity.status} (${resolvedId}):`, await stateRes.text());
      }
    }

    return resolvedId;
  }
```

- [ ] **Step 7: Add `deleteOpportunity` method to `RealD365Adapter` (after `deleteFollowUp`, before closing `}`)**

```typescript
  async deleteOpportunity(token: string, remoteId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/data/v9.2/opportunities(${remoteId})`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
    });
    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      throw new Error(`D365 delete opportunity failed ${res.status}: ${text}`);
    }
  }
```

- [ ] **Step 8: Add stub methods to `MockD365Adapter` (after `deleteFollowUp`)**

```typescript
  async fetchOpportunities(_token: string, _customerIds: Set<string>, _lastSync?: string): Promise<Opportunity[]> {
    await delay(200);
    return [];
  }

  async pushOpportunity(_token: string, opportunity: Opportunity, _optionValues: OpportunityOptionValues): Promise<string> {
    await delay(200);
    return `D365-OPP-${opportunity.id.slice(0, 8).toUpperCase()}`;
  }

  async deleteOpportunity(_token: string, _remoteId: string): Promise<void> {
    await delay(200);
  }
```

- [ ] **Step 9: Run build to catch type errors**

```bash
pnpm lint
```

Expected: No errors. Fix any type errors before continuing.

- [ ] **Step 10: Commit**

```bash
git add src/lib/sync/d365Adapter.ts src/types/api.ts
git commit -m "feat: add opportunity fetch/push/delete to D365 adapter"
```

---

## Task 5: directPushService additions

**Files:**
- Modify: `src/lib/sync/directPushService.ts`

- [ ] **Step 1: Add imports at the top of `src/lib/sync/directPushService.ts`**

Add to existing imports:
```typescript
import { markOpportunitySynced } from '@/lib/db/queries/opportunities';
import { queryOptionSetValue } from '@/lib/db/queries/optionSets';
import type { Opportunity } from '@/types/entities';
import type { OpportunityOptionValues } from '@/lib/sync/d365Adapter';
```

- [ ] **Step 2: Add `resolveOpportunityOptionValues` helper and `directPushOpportunity` + `directDeleteOpportunity` at the end of the file**

```typescript
async function resolveOpportunityOptionValues(opportunity: Opportunity): Promise<OpportunityOptionValues> {
  const [stage, sellType, opportunityType, recordType, source] = await Promise.all([
    opportunity.stage ? queryOptionSetValue('opportunity', 'im360_oppstage', opportunity.stage) : Promise.resolve(null),
    opportunity.sellType ? queryOptionSetValue('opportunity', 'im360_opptype', opportunity.sellType) : Promise.resolve(null),
    opportunity.opportunityType ? queryOptionSetValue('opportunity', 'im360_drpboxopptype', opportunity.opportunityType) : Promise.resolve(null),
    opportunity.recordType ? queryOptionSetValue('opportunity', 'im360_recordtype', opportunity.recordType) : Promise.resolve(null),
    opportunity.source ? queryOptionSetValue('opportunity', 'im360_source', opportunity.source) : Promise.resolve(null),
  ]);
  return { stage, sellType, opportunityType, recordType, source };
}

export async function directPushOpportunity(
  opportunity: Opportunity,
): Promise<{ remoteId: string } | null> {
  const result = await tryDirectPush(async (token) => {
    const adapter = getD365Adapter();
    const optionValues = await resolveOpportunityOptionValues(opportunity);
    return adapter.pushOpportunity(token, opportunity, optionValues);
  });

  if (result.success) {
    await markOpportunitySynced(opportunity.id, result.result);
    return { remoteId: result.result };
  }
  return null;
}

export async function directDeleteOpportunity(remoteId: string): Promise<boolean> {
  const result = await tryDirectPush(async (token) => {
    const adapter = getD365Adapter();
    await adapter.deleteOpportunity(token, remoteId);
  });
  return result.success;
}
```

- [ ] **Step 3: Run lint**

```bash
pnpm lint
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/sync/directPushService.ts src/lib/db/queries/opportunities.ts src/lib/db/queries/optionSets.ts
git commit -m "feat: add directPushOpportunity and directDeleteOpportunity"
```

---

## Task 6: Update useOpportunities hook

**Files:**
- Modify: `src/hooks/useOpportunities.ts`

- [ ] **Step 1: Update imports**

Replace the current imports with:
```typescript
'use client';

import { useEffect, useCallback } from 'react';
import { useOpportunityStore } from '@/store/opportunityStore';
import {
  queryOpportunitiesByCustomer,
  insertOpportunity,
  updateOpportunity as dbUpdateOpportunity,
  deleteOpportunity as dbDeleteOpportunity,
} from '@/lib/db/queries/opportunities';
import { insertPendingDelete } from '@/lib/db/queries/pendingDeletes';
import { updateCustomerLastActivity } from '@/lib/db/queries/customers';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { emitDataEvent } from '@/lib/dataEvents';
import { directPushOpportunity, directDeleteOpportunity } from '@/lib/sync/directPushService';
import type { Opportunity, OpportunityStage } from '@/types/entities';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '@/store/authStore';
import { useD365UserId } from '@/hooks/useD365UserId';
```

- [ ] **Step 2: Replace `createOpportunity` callback**

Replace the `createOpportunity` useCallback (lines 57–84) with:
```typescript
  const createOpportunity = useCallback(
    async (input: Omit<Opportunity, 'id' | 'createdById' | 'createdByName' | 'syncStatus' | 'remoteId' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const opportunity: Opportunity = {
        ...input,
        id: uuidv4(),
        createdById: d365UserId ?? account?.localAccountId ?? 'unknown',
        createdByName: account?.name ?? 'Unknown User',
        syncStatus: 'pending',
        remoteId: null,
        createdAt: now,
        updatedAt: now,
      };

      if (isTauriApp()) {
        await insertOpportunity(opportunity);
        await updateCustomerLastActivity(customerId, now);
        directPushOpportunity(opportunity).then((result) => {
          if (result) {
            updateOpportunity({ ...opportunity, syncStatus: 'synced', remoteId: result.remoteId });
            emitDataEvent('opportunity', 'updated', customerId);
          }
        });
      }
      addOpportunity(opportunity);
      emitDataEvent('opportunity', 'created', customerId);
      return opportunity;
    },
    [account, d365UserId, customerId, addOpportunity, updateOpportunity]
  );
```

- [ ] **Step 3: Replace `editOpportunity` callback**

Replace the `editOpportunity` useCallback (lines 86–99) with:
```typescript
  const editOpportunity = useCallback(
    async (opportunity: Opportunity) => {
      if (isTauriApp()) {
        await dbUpdateOpportunity(opportunity);
        directPushOpportunity(opportunity).then((result) => {
          if (result) {
            updateOpportunity({ ...opportunity, syncStatus: 'synced', remoteId: result.remoteId });
            emitDataEvent('opportunity', 'updated', customerId);
          }
        });
      }
      updateOpportunity({ ...opportunity, syncStatus: 'pending' });
      emitDataEvent('opportunity', 'updated', customerId);
    },
    [customerId, updateOpportunity]
  );
```

- [ ] **Step 4: Replace `removeOpp` callback**

Replace the `removeOpp` useCallback (lines 101–114) with:
```typescript
  const removeOpp = useCallback(
    async (id: string) => {
      removeOpportunity(id);
      emitDataEvent('opportunity', 'deleted', customerId);
      if (isTauriApp()) {
        const deleted = await dbDeleteOpportunity(id);
        if (deleted?.remoteId) {
          console.log(`[opportunity] Deleting from D365: remoteId=${deleted.remoteId}`);
          const directDeleted = await directDeleteOpportunity(deleted.remoteId);
          if (!directDeleted) {
            console.log(`[opportunity] Direct D365 delete failed, queuing pending delete: opportunity/${deleted.remoteId}`);
            await insertPendingDelete('opportunity', deleted.remoteId);
          } else {
            console.log(`[opportunity] D365 delete succeeded for ${deleted.remoteId}`);
          }
        }
      }
    },
    [customerId, removeOpportunity]
  );
```

- [ ] **Step 5: Run the hook tests**

```bash
pnpm vitest run src/hooks/__tests__/useOpportunities.test.ts
```

Expected: All 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useOpportunities.ts src/hooks/__tests__/useOpportunities.test.ts
git commit -m "feat: wire direct push and pending delete into useOpportunities hook"
```

---

## Task 7: Sync service — pull, push, delete

**Files:**
- Modify: `src/lib/sync/syncService.ts`

- [ ] **Step 1: Add imports**

Add to the existing imports at the top of `src/lib/sync/syncService.ts`:
```typescript
import {
  queryPendingOpportunities,
  markOpportunitySynced,
  markOpportunitySyncError,
  upsertPulledOpportunity,
} from '@/lib/db/queries/opportunities';
import { queryOptionSetValue } from '@/lib/db/queries/optionSets';
import type { Opportunity } from '@/types/entities';
import type { OpportunityOptionValues } from '@/lib/sync/d365Adapter';
```

- [ ] **Step 2: Add `resolveOpportunityOptionValues` helper at the top of the file (after `batchedUpsert`)**

```typescript
async function resolveOpportunityOptionValues(opportunity: Opportunity): Promise<OpportunityOptionValues> {
  const [stage, sellType, opportunityType, recordType, source] = await Promise.all([
    opportunity.stage ? queryOptionSetValue('opportunity', 'im360_oppstage', opportunity.stage) : Promise.resolve(null),
    opportunity.sellType ? queryOptionSetValue('opportunity', 'im360_opptype', opportunity.sellType) : Promise.resolve(null),
    opportunity.opportunityType ? queryOptionSetValue('opportunity', 'im360_drpboxopptype', opportunity.opportunityType) : Promise.resolve(null),
    opportunity.recordType ? queryOptionSetValue('opportunity', 'im360_recordtype', opportunity.recordType) : Promise.resolve(null),
    opportunity.source ? queryOptionSetValue('opportunity', 'im360_source', opportunity.source) : Promise.resolve(null),
  ]);
  return { stage, sellType, opportunityType, recordType, source };
}
```

- [ ] **Step 3: Add `fetchOpportunities` pull call inside `syncD365` — after the tasks try/catch block (after line 232)**

```typescript
    // Pull opportunities from D365 (filtered to local customers)
    try {
      console.log('[sync] Fetching opportunities from D365...');
      const opportunities = await adapter.fetchOpportunities(token, localCustomerIds, lastSyncTs);
      total += opportunities.length;
      emitProgress('Syncing opportunities...');
      const opportunityResult = await batchedUpsert(
        opportunities,
        (opportunity) => upsertPulledOpportunity(opportunity),
        () => { pulled++; processed++; emitProgress('Syncing opportunities...'); },
        (opportunity, err) => console.error(`[sync] Failed to upsert opportunity ${opportunity.remoteId}:`, err instanceof Error ? err.message : err),
      );
      errors += opportunityResult.errors;
      console.log(`[sync] Opportunities: ${opportunities.length} scoped, ${opportunityResult.successes} upserted, ${opportunities.length - opportunityResult.successes - opportunityResult.errors} skipped, ${opportunityResult.errors} errors`);
    } catch (err) {
      console.error('[sync] Failed to fetch opportunities:', err instanceof Error ? err.message : err);
    }
```

- [ ] **Step 4: Add `pushPendingOpportunities` function — after `pushPendingFollowUps`**

```typescript
async function pushPendingOpportunities(token: string): Promise<void> {
  const store = useSyncStore.getState();
  const pending = await queryPendingOpportunities();
  if (pending.length === 0) return;

  console.log(`[sync] Pushing ${pending.length} pending opportunities to D365`);
  const startedAt = new Date().toISOString();
  const recordId = await insertSyncRecord('push_opportunities', 'running', startedAt);
  let pushed = 0;

  const adapter = getD365Adapter();
  for (const opportunity of pending) {
    try {
      const optionValues = await resolveOpportunityOptionValues(opportunity);
      const remoteId = await adapter.pushOpportunity(token, opportunity, optionValues);
      await markOpportunitySynced(opportunity.id, remoteId);
      pushed++;
    } catch (err) {
      console.error(`[sync] Failed to push opportunity "${opportunity.subject}" (${opportunity.id}):`, err instanceof Error ? err.message : err);
      await markOpportunitySyncError(opportunity.id);
      store.addSyncError({
        id: uuidv4(),
        syncType: 'push_opportunities',
        message: `Failed to push opportunity: ${opportunity.subject}`,
        occurredAt: new Date().toISOString(),
      });
    }
  }

  const errors = pending.length - pushed;
  console.log(`[sync] Pushed ${pushed}/${pending.length} opportunities`);
  await updateSyncRecord(recordId, pushed === pending.length ? 'success' : 'partial', 0, pushed, errors > 0 ? `${errors} push errors` : null);
}
```

- [ ] **Step 5: Add opportunity case to `pushPendingDeletes` — inside the for loop**

Find `pushPendingDeletes`. In the for loop, before the existing `if (item.entityType === 'task')` block, add:
```typescript
      if (item.entityType === 'opportunity') {
        await adapter.deleteOpportunity(token, item.remoteId);
      } else if (item.entityType === 'task') {
```

And remove the old `if (item.entityType === 'task')` line so the chain reads:
```typescript
      if (item.entityType === 'opportunity') {
        await adapter.deleteOpportunity(token, item.remoteId);
      } else if (item.entityType === 'task') {
        await adapter.deleteFollowUp(token, item.remoteId);
      } else {
        const activityType = item.entityType === 'phonecall' ? 'call' : item.entityType === 'annotation' ? 'note' : 'meeting';
        await adapter.deleteActivity(token, item.remoteId, activityType);
      }
```

- [ ] **Step 6: Wire `pushPendingOpportunities` into `pushPendingChanges` and `runFullSync`**

In `pushPendingChanges` (around line 68), add after `await pushPendingFollowUps(token);`:
```typescript
    await pushPendingOpportunities(token);
```

In `runFullSync` (around line 98), add after `await pushPendingFollowUps(token);`:
```typescript
    await pushPendingOpportunities(token);
```

- [ ] **Step 7: Run lint**

```bash
pnpm lint
```

Expected: No errors. Fix any import or type issues.

- [ ] **Step 8: Commit**

```bash
git add src/lib/sync/syncService.ts
git commit -m "feat: wire opportunity pull, push, and delete into sync service"
```

---

## Task 8: Final verification

- [ ] **Step 1: Run all affected tests**

```bash
pnpm vitest run src/hooks/__tests__/useOpportunities.test.ts src/hooks/__tests__/useActivities.test.ts src/hooks/__tests__/useFollowUps.test.ts
```

Expected: All tests pass.

- [ ] **Step 2: Run lint one more time**

```bash
pnpm lint
```

Expected: No errors.

- [ ] **Step 3: Version bump + changelog**

Bump `version` in `package.json` (patch increment), then:

```bash
pnpm sync-version
```

Create `.changelog/v{version}.md`:
```markdown
# v{version}

## Opportunities now sync with D365

Opportunities are now fully synced with Dynamics 365. When you create, edit, or delete an opportunity it pushes to D365 immediately. During the next sync, opportunities created or changed in D365 are pulled in automatically. Marking an opportunity as Won or Lost also updates the status in D365.
```

- [ ] **Step 4: Final commit**

```bash
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml .changelog/
git commit -m "feat: full D365 sync for opportunities (v{version})"
```
