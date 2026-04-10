# D365 Entity Schema Reference

Field names and navigation properties used by the IM-CRM sync adapter (`src/lib/sync/d365Adapter.ts`).

All custom fields use the `im360_` prefix. OData API version: `v9.2`.

---

## Accounts (`/api/data/v9.2/accounts`)

### Pull Fields
| Field | Description |
|---|---|
| `accountid` | Primary key |
| `name` | Account name |
| `accountnumber` | Account number |
| `industrycode` | Industry code (numeric option set) |
| `telephone1` | Phone |
| `emailaddress1` | Email |
| `address1_line1` | Street |
| `address1_city` | City |
| `address1_country` | Country code (`BE`, `NL`, `L`) |
| `websiteurl` | Website |
| `im360_bcn` | BCN (custom) |
| `im360_cloudpurchaser` | Cloud purchaser flag (custom boolean) |
| `im360_mainsegmentation` | Main segmentation (custom option set) |
| `statecode` | Status (0 = active) |
| `modifiedon` | Last modified |
| `_ownerid_value` | Owner system user ID |
| `primarycontactid` | Navigation → primary contact |

### Push: N/A (read-only)

---

## Contacts (`/api/data/v9.2/contacts`)

### Pull Fields
| Field | Description |
|---|---|
| `contactid` | Primary key |
| `_parentcustomerid_value` | Parent account ID |
| `firstname` | First name |
| `lastname` | Last name |
| `jobtitle` | Job title |
| `emailaddress1` | Email |
| `telephone1` | Phone |
| `mobilephone` | Mobile |
| `im360_contacttype` | Contact type (custom option set) |
| `im360_cloudcontact` | Cloud Contact flag (custom boolean) |
| `modifiedon` | Last modified |

### Push: N/A (read-only)

---

## Phone Calls (`/api/data/v9.2/phonecalls`)

### Pull Fields
| Field | Description |
|---|---|
| `activityid` | Primary key |
| `subject` | Subject |
| `description` | Description |
| `im360_internalcomments` | Internal comments (custom) |
| `_im360_account_value` | Custom account lookup ID |
| `_im360_contact_value` | Custom contact lookup ID |
| `_ownerid_value` | Owner system user ID |
| `directioncode` | Direction (`true` = outgoing) |
| `actualend` | Actual end |
| `createdon` | Created |
| `statecode` | State (0=open, 1=completed, 2=cancelled) |
| `modifiedon` | Last modified |

### Push Fields
| Field | Description |
|---|---|
| `subject` | Subject |
| `description` | Description |
| `actualend` | Actual end |
| `scheduledend` | Scheduled end |
| `directioncode` | Direction |
| `phonenumber` | Contact phone (optional) |
| `statecode` | State (separate PATCH) |
| `statuscode` | Status code (separate PATCH) |

### Push OData Bindings
| Binding | Target |
|---|---|
| `regardingobjectid_account@odata.bind` | `/accounts({id})` |
| `{accountNav}@odata.bind` | Resolved via `resolveNavProperty('phonecall', 'im360_account')` |
| `{contactNav}@odata.bind` | Resolved via `resolveNavProperty('phonecall', 'im360_contact')` |

### Activity Parties (`phonecall_activity_parties`)
| Binding | Mask |
|---|---|
| `partyid_systemuser@odata.bind` → `/systemusers({id})` | 1 (organizer) |
| `partyid_contact@odata.bind` → `/contacts({id})` | 2 (attendee) |

---

## Appointments (`/api/data/v9.2/appointments`)

### Pull Fields
| Field | Description |
|---|---|
| `activityid` | Primary key |
| `subject` | Subject |
| `description` | Description (may contain HTML) |
| `im360_appointmenttype` | Type: 0=meeting, 2=visit (custom) |
| `_im360_account_value` | Custom account lookup ID |
| `_im360_contact_value` | Custom contact lookup ID |
| `_ownerid_value` | Owner system user ID |
| `scheduledstart` | Scheduled start |
| `scheduledend` | Scheduled end |
| `statecode` | State |
| `createdon` | Created |
| `modifiedon` | Last modified |

### Push Fields
| Field | Description |
|---|---|
| `subject` | Subject |
| `description` | Description |
| `scheduledstart` | Scheduled start |
| `scheduledend` | Scheduled end |
| `im360_appointmenttype` | Type: 0=meeting, 2=visit |
| `statecode` | State (separate PATCH) |
| `statuscode` | Status code (separate PATCH) |

### Push OData Bindings
| Binding | Target |
|---|---|
| `regardingobjectid_account@odata.bind` | `/accounts({id})` |
| `{accountNav}@odata.bind` | Resolved via `resolveNavProperty('appointment', 'im360_account')` |
| `{contactNav}@odata.bind` | Resolved via `resolveNavProperty('appointment', 'im360_contact')` |

### Activity Parties (`appointment_activity_parties`)
| Binding | Mask |
|---|---|
| `partyid_systemuser@odata.bind` → `/systemusers({id})` | 7 (organizer) |
| `partyid_contact@odata.bind` → `/contacts({id})` | 5 (attendee) |

---

## Annotations / Notes (`/api/data/v9.2/annotations`)

### Pull Fields
| Field | Description |
|---|---|
| `annotationid` | Primary key |
| `subject` | Subject |
| `notetext` | Content |
| `_objectid_value` | Related account ID |
| `objecttypecode` | Object type (filtered: `account`) |
| `_ownerid_value` | Owner system user ID |
| `createdon` | Created |
| `modifiedon` | Last modified |

### Push Fields
| Field | Description |
|---|---|
| `subject` | Subject |
| `notetext` | Content |

### Push OData Bindings
| Binding | Target |
|---|---|
| `objectid_account@odata.bind` | `/accounts({id})` |

---

## Tasks / Follow-ups (`/api/data/v9.2/tasks`)

### Pull Fields
| Field | Description |
|---|---|
| `activityid` | Primary key |
| `subject` | Subject |
| `description` | Description |
| `_regardingobjectid_value` | Related account ID |
| `_ownerid_value` | Owner system user ID |
| `scheduledend` | Due date |
| `_im360_account_value` | Custom account lookup ID |
| `statecode` | State (0=open, 1=completed) |
| `actualend` | Actual completion |
| `im360_completedon` | Custom completion date |
| `createdon` | Created |
| `modifiedon` | Last modified |

### Push Fields
| Field | Description |
|---|---|
| `subject` | Subject |
| `description` | Description |
| `scheduledend` | Due date |
| `statecode` | State: 0=open, 1=completed (separate PATCH) |
| `statuscode` | Status: 3=open, 5=completed (separate PATCH) |

### Push OData Bindings
| Binding | Target |
|---|---|
| `regardingobjectid_account@odata.bind` | `/accounts({id})` |
| `{accountNav}@odata.bind` | Resolved via `resolveNavProperty('task', 'im360_account')` |

---

## System Users (`/api/data/v9.2/teams/{teamId}/teammembership_association`)

### Pull Fields
| Field | Description |
|---|---|
| `systemuserid` | Primary key |
| `fullname` | Full name |
| `internalemailaddress` | Email |
| `jobtitle` | Job title |
| `isdisabled` | Disabled flag |
| `_businessunitid_value` | Business unit ID |
| `modifiedon` | Last modified |

---

## Opportunities (`/api/data/v9.2/opportunities`)

### Pull Fields
| Field | Description |
|---|---|
| `opportunityid` | Primary key |
| `name` | Subject |
| `statecode` | Status (0=open, 1=won, 2=lost) |
| `estimatedvalue` | Estimated revenue |
| `estimatedclosedate` | Expiration/close date |
| `closeprobability` | Probability % |
| `customerneed` | Customer need |
| `im360_bcn` | BCN (custom) |
| `im360_multivendoropportunity` | Multi-vendor flag (custom) |
| `im360_oppstage` | Stage (custom option set) |
| `im360_opptype` | Sell type (custom option set) |
| `im360_drpboxopptype` | Opportunity type (custom option set) |
| `im360_recordtype` | Record type (custom option set) |
| `im360_source` | Source (custom option set) |
| `_im360_primaryvendor_value` | Primary vendor account ID (custom) |
| `_parentaccountid_value` | Parent account ID |
| `_parentcontactid_value` | Contact ID |
| `_ownerid_value` | Owner system user ID |
| `createdon` | Created |
| `modifiedon` | Last modified |

### Push Fields
| Field | Description |
|---|---|
| `name` | Subject |
| `closeprobability` | Probability % |
| `im360_multivendoropportunity` | Multi-vendor flag |
| `estimatedvalue` | Estimated revenue (if set) |
| `estimatedclosedate` | Expiration date (if set) |
| `customerneed` | Customer need (if set) |
| `im360_bcn` | BCN (if set) |
| `im360_oppstage` | Stage option value |
| `im360_opptype` | Sell type option value |
| `im360_drpboxopptype` | Opportunity type option value |
| `im360_recordtype` | Record type option value |
| `im360_source` | Source option value |

### Push OData Bindings
| Binding | Target |
|---|---|
| `parentaccountid@odata.bind` | `/accounts({id})` |
| `parentcontactid@odata.bind` | `/contacts({id})` |

---

## Option Sets (via metadata API)

Fetched from `EntityDefinitions(LogicalName='{entity}')/Attributes(LogicalName='{attribute}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata`

| Key | Entity | Attribute |
|---|---|---|
| `account.industrycode` | `account` | `industrycode` |
| `opportunity.stage` | `opportunity` | `im360_oppstage` |
| `opportunity.selltype` | `opportunity` | `im360_opptype` |
| `opportunity.opptype` | `opportunity` | `im360_drpboxopptype` |
| `opportunity.recordtype` | `opportunity` | `im360_recordtype` |
| `opportunity.source` | `opportunity` | `im360_source` |

---

## Navigation Property Resolution

Custom lookups (`im360_account`, `im360_contact`) are resolved dynamically via:

```
GET /api/data/v9.2/EntityDefinitions(LogicalName='{entity}')/ManyToOneRelationships
  ?$filter=ReferencingAttribute eq '{attribute}'
  &$select=ReferencingEntityNavigationPropertyName
```

Results are cached in `navPropertyCache`. Used for phone calls, appointments, and annotations.

---

## Common OData Patterns

- **Formatted values**: `{field}@OData.Community.Display.V1.FormattedValue`
- **Lookup IDs**: `_{field}_value` (e.g., `_ownerid_value`)
- **Pagination**: `@odata.nextLink` (max page size: 5000)
- **Headers**: `Prefer: odata.include-annotations="*",odata.maxpagesize=5000`
- **Minimal response**: `Prefer: return=minimal` (for POST/PATCH)
