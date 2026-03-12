import type { Customer, Contact, Activity, FollowUp } from '@/types/entities';
import { mockCustomers } from '@/lib/mock/customers';
import { mockContacts } from '@/lib/mock/contacts';

export interface ID365Adapter {
  fetchCustomers(token: string): Promise<Customer[]>;
  fetchContacts(token: string): Promise<Contact[]>;
  pushActivity(token: string, activity: Activity): Promise<string>;
  pushFollowUp(token: string, followUp: FollowUp): Promise<string>;
}

// Mock implementation — returns static data, simulates network delay
class MockD365Adapter implements ID365Adapter {
  async fetchCustomers(_token: string): Promise<Customer[]> {
    await delay(600);
    return mockCustomers.map((c) => ({ ...c, syncedAt: new Date().toISOString() }));
  }

  async fetchContacts(_token: string): Promise<Contact[]> {
    await delay(400);
    return mockContacts.map((c) => ({ ...c, syncedAt: new Date().toISOString() }));
  }

  async pushActivity(_token: string, activity: Activity): Promise<string> {
    await delay(200);
    return `D365-ACT-${activity.id.slice(0, 8).toUpperCase()}`;
  }

  async pushFollowUp(_token: string, followUp: FollowUp): Promise<string> {
    await delay(200);
    return `D365-FU-${followUp.id.slice(0, 8).toUpperCase()}`;
  }
}

// Real implementation — uncomment and replace when D365 API details are available
// class RealD365Adapter implements ID365Adapter {
//   private baseUrl = process.env.NEXT_PUBLIC_D365_BASE_URL!;
//
//   async fetchCustomers(token: string): Promise<Customer[]> {
//     const res = await fetch(
//       `${this.baseUrl}/api/data/v9.2/accounts?$select=accountid,name,accountnumber,...`,
//       { headers: { Authorization: `Bearer ${token}` } }
//     );
//     const json: D365ODataResponse<D365Customer> = await res.json();
//     return json.value.map(mapD365CustomerToCustomer);
//   }
//   // ... etc
// }

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getD365Adapter(): ID365Adapter {
  return new MockD365Adapter();
}
