import { useRevenueStore, type CustomerRevenueRow } from '@/store/revenueStore';

export function useCustomerRevenue(bcn: string | null | undefined): CustomerRevenueRow | null {
  return useRevenueStore((s) => (bcn ? s.byBcn.get(bcn) ?? null : null));
}
