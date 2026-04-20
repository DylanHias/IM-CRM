import { recomputeCustomerHealthScore, queryCustomerById } from '@/lib/db/queries/customers';
import { useCustomerStore } from '@/store/customerStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';

export async function refreshCustomerHealth(customerId: string): Promise<void> {
  if (!isTauriApp()) return;
  try {
    await recomputeCustomerHealthScore(customerId);
    const customer = await queryCustomerById(customerId);
    if (!customer) return;
    const { customers } = useCustomerStore.getState();
    useCustomerStore.setState({
      customers: customers.map((c) => (c.id === customerId ? customer : c)),
    });
  } catch (err) {
    console.error('[customer] Failed to refresh health score:', err);
  }
}
