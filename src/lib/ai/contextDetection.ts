import { searchCustomers, searchContacts, formatCustomerContext, formatContactContext } from '@/lib/db/queries/aiSearch';

// Patterns that suggest the user is asking about a specific customer or contact
const CUSTOMER_PATTERNS = [
  /\bcustomer\s+([a-z][a-z0-9\s\-&'.]+)/gi,
  /\bcompany\s+([a-z][a-z0-9\s\-&'.]+)/gi,
  /\baccount\s+([a-z][a-z0-9\s\-&'.]+)/gi,
  /\babout\s+([a-z][a-z0-9\s\-&'.]+)/gi,
  /\binfo\s+(?:on|about|for)\s+([a-z][a-z0-9\s\-&'.]+)/gi,
];

const CONTACT_PATTERNS = [
  /\bcontact\s+([a-z][a-z\s\-'.]+)/gi,
  /\bperson\s+([a-z][a-z\s\-'.]+)/gi,
];

function extractTerms(message: string, patterns: RegExp[]): string[] {
  const terms: string[] = [];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(message)) !== null) {
      const term = match[1].trim().replace(/\s{2,}/g, ' ');
      if (term.length >= 2) terms.push(term);
    }
  }
  return Array.from(new Set(terms));
}

export async function detectAndFetchContext(userMessage: string): Promise<string | null> {
  const customerTerms = extractTerms(userMessage, CUSTOMER_PATTERNS);
  const contactTerms = extractTerms(userMessage, CONTACT_PATTERNS);

  if (customerTerms.length === 0 && contactTerms.length === 0) return null;

  const [customerResults, contactResults] = await Promise.all([
    customerTerms.length > 0
      ? Promise.all(customerTerms.map((t) => searchCustomers(t))).then((results) =>
          results.flat().filter((r, i, arr) => arr.findIndex((x) => x.id === r.id) === i)
        )
      : Promise.resolve([]),
    contactTerms.length > 0
      ? Promise.all(contactTerms.map((t) => searchContacts(t))).then((results) =>
          results.flat().filter((r, i, arr) => arr.findIndex((x) => x.id === r.id) === i)
        )
      : Promise.resolve([]),
  ]);

  const parts: string[] = [];
  if (customerResults.length > 0) parts.push(formatCustomerContext(customerResults));
  if (contactResults.length > 0) parts.push(formatContactContext(contactResults));

  return parts.length > 0 ? parts.join('\n\n') : null;
}
