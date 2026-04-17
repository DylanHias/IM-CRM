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

export async function searchContacts(term: string): Promise<ContactSearchRow[]> {
  const db = await getDb();
  return db.select<ContactSearchRow[]>(
    `SELECT c.id, c.first_name, c.last_name, c.job_title, c.email, c.phone, c.mobile,
            cust.name AS customer_name
     FROM contacts c
     LEFT JOIN customers cust ON c.customer_id = cust.id
     WHERE (c.first_name || ' ' || c.last_name) LIKE '%' || $1 || '%' COLLATE NOCASE
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
