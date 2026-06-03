import { getDb } from '@/lib/db/client';

interface CustomerSearchRow {
  id: string;
  name: string;
  account_number: string | null;
  industry: string | null;
  segment: string | null;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  arr: number | null;
  status: string;
  address_city: string | null;
  address_country: string | null;
}

interface ContactSearchRow {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  customer_name: string | null;
}

export async function searchCustomers(term: string): Promise<CustomerSearchRow[]> {
  const db = await getDb();
  return db.select<CustomerSearchRow[]>(
    `SELECT id, name, account_number, industry, segment, owner_name, phone, email, arr, status, address_city, address_country
     FROM customers
     WHERE name LIKE '%' || $1 || '%' COLLATE NOCASE
     ORDER BY name COLLATE NOCASE
     LIMIT 5`,
    [term]
  );
}

// Match by person name OR company name, so "who works for <company>" resolves
// the contacts attached to that account — not just people literally named the term.
export async function searchContacts(term: string): Promise<ContactSearchRow[]> {
  const db = await getDb();
  return db.select<ContactSearchRow[]>(
    `SELECT c.id, c.first_name, c.last_name, c.job_title, c.email, c.phone, c.mobile,
            cust.name AS customer_name
     FROM contacts c
     LEFT JOIN customers cust ON c.customer_id = cust.id
     WHERE (c.first_name || ' ' || c.last_name) LIKE '%' || $1 || '%' COLLATE NOCASE
        OR cust.name LIKE '%' || $1 || '%' COLLATE NOCASE
     ORDER BY c.last_name COLLATE NOCASE, c.first_name COLLATE NOCASE
     LIMIT 5`,
    [term]
  );
}

export function formatCustomerContext(rows: CustomerSearchRow[]): string {
  if (rows.length === 0) return '';
  return rows
    .map((r) => {
      const lines = [`Customer: ${r.name}`];
      if (r.account_number) lines.push(`  Account #: ${r.account_number}`);
      if (r.industry) lines.push(`  Industry: ${r.industry}`);
      if (r.segment) lines.push(`  Segment: ${r.segment}`);
      if (r.owner_name) lines.push(`  Owner: ${r.owner_name}`);
      if (r.email) lines.push(`  Email: ${r.email}`);
      if (r.phone) lines.push(`  Phone: ${r.phone}`);
      if (r.address_city || r.address_country)
        lines.push(`  Location: ${[r.address_city, r.address_country].filter(Boolean).join(', ')}`);
      if (r.arr != null) lines.push(`  ARR: €${r.arr.toLocaleString()}`);
      lines.push(`  Status: ${r.status}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

export function formatContactContext(rows: ContactSearchRow[]): string {
  if (rows.length === 0) return '';
  return rows
    .map((r) => {
      const lines = [`Contact: ${r.first_name} ${r.last_name}`];
      if (r.job_title) lines.push(`  Title: ${r.job_title}`);
      if (r.customer_name) lines.push(`  Company: ${r.customer_name}`);
      if (r.email) lines.push(`  Email: ${r.email}`);
      if (r.phone) lines.push(`  Phone: ${r.phone}`);
      if (r.mobile) lines.push(`  Mobile: ${r.mobile}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

interface OpportunitySearchRow {
  subject: string;
  status: string | null;
  stage: string | null;
  probability: number | null;
  primary_vendor: string | null;
  estimated_revenue: number | null;
  expiration_date: string | null;
  customer_name: string | null;
}

interface RevenueSearchRow {
  name: string;
  arr: number | null;
  cloud_customer: number | null;
  active_end_customers: number | null;
  as_of_month: string | null;
}

// Search by deal subject OR company name. Only the columns needed for a useful
// summary are selected, and results are capped tightly to keep tool output small.
export async function searchOpportunities(term: string): Promise<OpportunitySearchRow[]> {
  const db = await getDb();
  return db.select<OpportunitySearchRow[]>(
    `SELECT o.subject, o.status, o.stage, o.probability, o.primary_vendor,
            o.estimated_revenue, o.expiration_date, cust.name AS customer_name
     FROM opportunities o
     LEFT JOIN customers cust ON o.customer_id = cust.id
     WHERE o.subject LIKE '%' || $1 || '%' COLLATE NOCASE
        OR cust.name LIKE '%' || $1 || '%' COLLATE NOCASE
     ORDER BY o.estimated_revenue DESC
     LIMIT 5`,
    [term]
  );
}

// Revenue/ARR lookup for a specific customer, joining the Power BI revenue cache
// by BCN. Capped to the top few matches by ARR.
export async function searchRevenue(term: string): Promise<RevenueSearchRow[]> {
  const db = await getDb();
  return db.select<RevenueSearchRow[]>(
    `SELECT c.name, c.arr, c.cloud_customer,
            r.active_end_customers, r.as_of_month
     FROM customers c
     LEFT JOIN customer_revenue r ON c.bcn = r.bcn
     WHERE c.name LIKE '%' || $1 || '%' COLLATE NOCASE
     ORDER BY c.arr DESC
     LIMIT 3`,
    [term]
  );
}

export function formatOpportunityContext(rows: OpportunitySearchRow[]): string {
  if (rows.length === 0) return '';
  return rows
    .map((r) => {
      const lines = [`Opportunity: ${r.subject}`];
      if (r.customer_name) lines.push(`  Company: ${r.customer_name}`);
      if (r.status) lines.push(`  Status: ${r.status}`);
      if (r.stage) lines.push(`  Stage: ${r.stage}${r.probability != null ? ` (${r.probability}%)` : ''}`);
      if (r.primary_vendor) lines.push(`  Vendor: ${r.primary_vendor}`);
      if (r.estimated_revenue != null)
        lines.push(`  Revenue: €${r.estimated_revenue.toLocaleString()}`);
      if (r.expiration_date) lines.push(`  Expires: ${r.expiration_date.slice(0, 10)}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

export function formatRevenueContext(rows: RevenueSearchRow[]): string {
  if (rows.length === 0) return '';
  return rows
    .map((r) => {
      const lines = [`Customer: ${r.name}`];
      lines.push(`  Cloud customer: ${r.cloud_customer ? 'Yes' : 'No'}`);
      if (r.arr != null) lines.push(`  ARR: €${r.arr.toLocaleString()}`);
      if (r.active_end_customers != null) lines.push(`  Active end customers: ${r.active_end_customers}`);
      if (r.as_of_month) lines.push(`  As of: ${r.as_of_month}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

interface ActivitySearchRow {
  subject: string;
  type: string | null;
  activity_status: string | null;
  occurred_at: string | null;
  created_by_name: string | null;
  customer_name: string | null;
}

interface FollowUpSearchRow {
  title: string;
  due_date: string | null;
  completed: number | null;
  created_by_name: string | null;
  customer_name: string | null;
}

// Recent activities for the accounts matching the term, most recent first.
export async function searchActivities(term: string): Promise<ActivitySearchRow[]> {
  const db = await getDb();
  return db.select<ActivitySearchRow[]>(
    `SELECT a.subject, a.type, a.activity_status, a.occurred_at, a.created_by_name,
            cust.name AS customer_name
     FROM activities a
     LEFT JOIN customers cust ON a.customer_id = cust.id
     WHERE cust.name LIKE '%' || $1 || '%' COLLATE NOCASE
     ORDER BY a.occurred_at DESC
     LIMIT 8`,
    [term]
  );
}

// Follow-ups for the accounts matching the term; open ones first, by due date.
export async function searchFollowUps(term: string): Promise<FollowUpSearchRow[]> {
  const db = await getDb();
  return db.select<FollowUpSearchRow[]>(
    `SELECT f.title, f.due_date, f.completed, f.created_by_name,
            cust.name AS customer_name
     FROM follow_ups f
     LEFT JOIN customers cust ON f.customer_id = cust.id
     WHERE cust.name LIKE '%' || $1 || '%' COLLATE NOCASE
     ORDER BY f.completed ASC, f.due_date ASC
     LIMIT 8`,
    [term]
  );
}

export function formatActivityContext(rows: ActivitySearchRow[]): string {
  if (rows.length === 0) return '';
  return rows
    .map((r) => {
      const lines = [`Activity: ${r.subject}`];
      if (r.type) lines.push(`  Type: ${r.type}`);
      if (r.activity_status) lines.push(`  Status: ${r.activity_status}`);
      if (r.occurred_at) lines.push(`  Date: ${r.occurred_at.slice(0, 10)}`);
      if (r.created_by_name) lines.push(`  By: ${r.created_by_name}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

export function formatFollowUpContext(rows: FollowUpSearchRow[]): string {
  if (rows.length === 0) return '';
  return rows
    .map((r) => {
      const lines = [`Follow-up: ${r.title}`];
      lines.push(`  Status: ${r.completed ? 'Completed' : 'Open'}`);
      if (r.due_date) lines.push(`  Due: ${r.due_date.slice(0, 10)}`);
      if (r.created_by_name) lines.push(`  By: ${r.created_by_name}`);
      return lines.join('\n');
    })
    .join('\n\n');
}
