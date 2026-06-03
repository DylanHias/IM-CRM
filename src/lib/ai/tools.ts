import {
  searchCustomers,
  searchContacts,
  searchOpportunities,
  searchRevenue,
  formatCustomerContext,
  formatContactContext,
  formatOpportunityContext,
  formatRevenueContext,
} from '@/lib/db/queries/aiSearch';

/** Ollama function-calling tool definition. */
export interface OllamaTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: string; description: string }>;
      required: string[];
    };
  };
}

/**
 * Tools the assistant can call to read accurate, live data from the local
 * SQLite database. Kept narrow and read-only — the model gets facts, never
 * the ability to mutate anything.
 */
export const AI_TOOLS: OllamaTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_customers',
      description:
        'Search the local CRM database for customers/accounts by name. Use this whenever the user asks about a specific company, its owner, ARR, industry, location, or status. Returns up to 5 matches with their details.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Full or partial customer/company name to search for.' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_contacts',
      description:
        'Search the local CRM database for contacts (people) by name. Use this whenever the user asks about a specific person, their job title, email, phone, or which company they belong to. Returns up to 5 matches with their details.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Full or partial person name to search for.' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_opportunities',
      description:
        'Search the local CRM database for sales opportunities/deals by deal subject or company name. Use this when the user asks about a specific opportunity, deal stage, vendor, expected revenue, or expiration. Returns up to 5 matches.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Deal subject or company name to search for.' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_revenue',
      description:
        "Look up a specific customer's revenue/ARR figures (annual recurring revenue, cloud status, active end customers) from the local database. Use this when the user asks about a company's revenue, ARR, or cloud numbers. Returns up to 3 matches.",
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Customer/company name to look up revenue for.' },
        },
        required: ['query'],
      },
    },
  },
];

type ToolArgs = Record<string, unknown>;

function readQuery(args: ToolArgs): string {
  const q = args.query;
  return typeof q === 'string' ? q.trim() : '';
}

/**
 * Execute a tool call by name and return a human/LLM-readable result string.
 * Arguments arrive as an object from Ollama, but tolerate a JSON string too.
 */
export async function executeTool(name: string, rawArgs: unknown): Promise<string> {
  let args: ToolArgs = {};
  if (typeof rawArgs === 'string') {
    try {
      args = JSON.parse(rawArgs) as ToolArgs;
    } catch {
      args = {};
    }
  } else if (rawArgs && typeof rawArgs === 'object') {
    args = rawArgs as ToolArgs;
  }

  try {
    switch (name) {
      case 'search_customers': {
        const query = readQuery(args);
        if (!query) return 'No search term was provided.';
        const rows = await searchCustomers(query);
        return rows.length > 0
          ? formatCustomerContext(rows)
          : `No customers found matching "${query}".`;
      }
      case 'search_contacts': {
        const query = readQuery(args);
        if (!query) return 'No search term was provided.';
        const rows = await searchContacts(query);
        return rows.length > 0
          ? formatContactContext(rows)
          : `No contacts found matching "${query}".`;
      }
      case 'search_opportunities': {
        const query = readQuery(args);
        if (!query) return 'No search term was provided.';
        const rows = await searchOpportunities(query);
        return rows.length > 0
          ? formatOpportunityContext(rows)
          : `No opportunities found matching "${query}".`;
      }
      case 'get_revenue': {
        const query = readQuery(args);
        if (!query) return 'No search term was provided.';
        const rows = await searchRevenue(query);
        return rows.length > 0
          ? formatRevenueContext(rows)
          : `No revenue data found for "${query}".`;
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    console.error(`[ai] tool "${name}" failed:`, err);
    return `The "${name}" lookup failed.`;
  }
}
