import type { Activity, FollowUp, Opportunity } from '@/types/entities';

export type SearchCategory = 'customer' | 'contact' | 'opportunity' | 'activity' | 'followup';

export interface SearchResult {
  id: string;
  category: SearchCategory;
  primary: string;
  secondary: string;
  href: string;
}

export interface SearchData {
  customers: { id: string; name: string; accountNumber: string | null; bcn: string | null; addressCity: string | null }[];
  contacts: { id: string; customerId: string; firstName: string; lastName: string; email: string | null; jobTitle: string | null }[];
  opportunities: Opportunity[];
  activities: Activity[];
  followUps: FollowUp[];
  customerName: (id: string) => string;
}

const PER_CAT = 5;

function match(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle);
}

export function searchAll(query: string, data: SearchData): Record<SearchCategory, SearchResult[]> {
  const q = query.toLowerCase().trim();

  const customers: SearchResult[] = !q ? [] : data.customers
    .filter((c) =>
      match(c.name, q) ||
      (c.accountNumber ? match(c.accountNumber, q) : false) ||
      (c.bcn ? match(c.bcn, q) : false) ||
      (c.addressCity ? match(c.addressCity, q) : false)
    )
    .slice(0, PER_CAT)
    .map((c) => ({
      id: c.id,
      category: 'customer',
      primary: c.name,
      secondary: [c.accountNumber, c.bcn, c.addressCity].filter(Boolean).join(' · '),
      href: `/customers?id=${c.id}`,
    }));

  const contacts: SearchResult[] = !q ? [] : data.contacts
    .filter((c) => {
      const full = `${c.firstName} ${c.lastName}`;
      return match(full, q) || (c.email ? match(c.email, q) : false) || (c.jobTitle ? match(c.jobTitle, q) : false);
    })
    .slice(0, PER_CAT)
    .map((c) => ({
      id: c.id,
      category: 'contact',
      primary: `${c.firstName} ${c.lastName}`,
      secondary: data.customerName(c.customerId),
      href: `/customers?id=${c.customerId}&tab=contacts`,
    }));

  const opportunities: SearchResult[] = !q ? [] : data.opportunities
    .filter((o) =>
      match(o.subject, q) ||
      match(data.customerName(o.customerId), q) ||
      (o.primaryVendor ? match(o.primaryVendor, q) : false)
    )
    .slice(0, PER_CAT)
    .map((o) => ({
      id: o.id,
      category: 'opportunity',
      primary: o.subject,
      secondary: data.customerName(o.customerId),
      href: `/opportunities?id=${o.id}`,
    }));

  const activities: SearchResult[] = !q ? [] : data.activities
    .filter((a) =>
      match(a.subject, q) ||
      match(data.customerName(a.customerId), q) ||
      (a.description ? match(a.description, q) : false)
    )
    .slice(0, PER_CAT)
    .map((a) => ({
      id: a.id,
      category: 'activity',
      primary: a.subject,
      secondary: data.customerName(a.customerId),
      href: `/customers?id=${a.customerId}&tab=activities`,
    }));

  const followUps: SearchResult[] = !q ? [] : data.followUps
    .filter((f) =>
      match(f.title, q) ||
      (f.description ? match(f.description, q) : false)
    )
    .slice(0, PER_CAT)
    .map((f) => ({
      id: f.id,
      category: 'followup',
      primary: f.title,
      secondary: f.dueDate,
      href: `/followups`,
    }));

  return { customer: customers, contact: contacts, opportunity: opportunities, activity: activities, followup: followUps };
}
