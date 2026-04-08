# Opportunity Sync Design

**Date:** 2026-04-08  
**Status:** Approved

## Overview

Full bidirectional sync for opportunities with D365, matching the behavior of activities: pull from D365 on sync, push local creates/edits/deletes, handle Won/Lost status transitions as separate D365 state changes.

## Scope

- Pull opportunities from D365 scoped to Benelux customers already in local DB
- Push pending creates, edits, deletes to D365
- Won/Lost status changes trigger a separate statecode PATCH (same pattern as activity completion)
- Stage changes are standard field updates (im360_oppstage picklist)
- No new UI — existing OpportunityList, OpportunityForm, and useOpportunities hook are already in place

## Field Mapping

| Local field | D365 field | Notes |
|---|---|---|
| `remoteId` | `opportunityid` | Uniqueidentifier |
| `subject` | `name` | String |
| `status` (Open/Won/Lost) | `statecode` (0/1/2) | State — requires separate PATCH |
| `estimatedRevenue` | `estimatedvalue` | Money |
| `expirationDate` | `estimatedclosedate` | DateTime |
| `probability` | `closeprobability` | Integer |
| `customerNeed` | `customerneed` | Memo |
| `bcn` | `im360_bcn` | String |
| `multiVendorOpportunity` | `im360_multivendoropportunity` | Boolean |
| `stage` | `im360_oppstage` | Picklist |
| `sellType` | `im360_opptype` | Picklist |
| `opportunityType` | `im360_drpboxopptype` | Picklist |
| `recordType` | `im360_recordtype` | Picklist |
| `source` | `im360_source` | Picklist |
| `primaryVendor` | `im360_primaryvendorname` | String (name only, no lookup binding) |
| `customerId` | `parentaccountid` | Lookup — `parentaccountid@odata.bind` → `/accounts({remoteId})` |
| `contactId` | `contactid` | Lookup — `contactid@odata.bind` → `/contacts({remoteId})` (optional) |

**Status codes:**
- Open: statecode 0, statuscode 1
- Won: statecode 1, statuscode 3
- Lost: statecode 2, statuscode 4

## Architecture

Option A — inline extension of existing files. No new modules. Follows exact activity pattern.

### 1. Data Layer — `src/lib/db/queries/opportunities.ts`

Add four functions:

- `queryPendingOpportunities()` — fetch rows where `sync_status = 'pending'`
- `upsertPulledOpportunity(opp)` — insert or update on `remote_id` conflict; preserves local pending changes (skip overwrite if local `sync_status = 'pending'`)
- `markOpportunitySynced(id, remoteId)` — set `sync_status = 'synced'`, write `remote_id`
- `markOpportunitySyncError(id)` — set `sync_status = 'error'`

Deletes reuse existing `pending_deletes` table with `entity_type = 'opportunity'`. No schema changes needed.

### 2. Types — `src/types/api.ts`

Add `D365Opportunity` interface with all pull fields listed in the mapping table above.

### 3. D365 Adapter — `src/lib/sync/d365Adapter.ts`

Add to `ID365Adapter` interface and implement three methods:

**`fetchOpportunities(token, customerRemoteIds, lastSync?)`**
- OData filter: `statecode ne 3 and _parentaccountid_value ne null and modifiedon gt {lastSync}`
- Post-filter: keep only records whose `_parentaccountid_value` is in `customerRemoteIds`
- Map D365Opportunity → Opportunity with `syncStatus: 'synced'`, `source: 'cloud'`
- Uses `fetchAllPages()` for pagination

**`pushOpportunity(token, opportunity)`**
- New record (no `remoteId`): POST `/opportunities`
- Existing record: PATCH `/opportunities({remoteId})`
- Account binding: `parentaccountid@odata.bind` → `/accounts({customer.remoteId})`
- Contact binding: `contactid@odata.bind` → `/contacts({contact.remoteId})` (only if contactId present and contact has remoteId)
- If `status` is `Won` or `Lost`: follow-up PATCH to set statecode/statuscode
- Returns resolved `opportunityid` from `OData-EntityId` header on POST

**`deleteOpportunity(token, remoteId)`**
- DELETE `/opportunities({remoteId})`

### 4. Sync Service — `src/lib/sync/syncService.ts`

**Pull phase** (inside `syncD365()`):
- After contacts: call `adapter.fetchOpportunities(token, customerRemoteIds, lastSync)`
- Batch upsert via `upsertPulledOpportunity()`

**Push phase** (new `pushPendingOpportunities()` function):
- `queryPendingOpportunities()` → for each opportunity:
  - Resolve customer remoteId from local DB
  - Resolve contact remoteId if contactId set
  - Call `adapter.pushOpportunity()`
  - On success: `markOpportunitySynced()`
  - On failure: `markOpportunitySyncError()`, log with `[opportunity]` tag
- Add call to `pushPendingChanges()` alongside activities/followups

**Delete phase** (extend `pushPendingDeletes()`):
- Add `'opportunity'` case: call `adapter.deleteOpportunity(token, remoteId)`

## Error Handling

- Never silent catch — always `console.error('[opportunity] description:', err)`
- Push errors set `sync_status = 'error'` — visible in existing sync status UI
- Pull errors are non-fatal — logged, sync continues with other entity types

## Out of Scope

- Currency/country fields (always EUR/Belgium for Benelux)
- `primaryVendor` lookup binding (name string only)
- Opportunity win/loss reason fields
