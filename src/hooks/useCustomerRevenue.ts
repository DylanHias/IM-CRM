import { useRevenueStore, type CustomerRevenueRow } from '@/store/revenueStore';

export function useCustomerRevenue(
  bcn: string | null | undefined,
  accountNumber?: string | null | undefined,
): CustomerRevenueRow | null {
  return useRevenueStore((s) => {
    if (bcn) {
      const byBcn = s.byBcn.get(bcn);
      if (byBcn) return byBcn;
    }
    if (accountNumber) {
      return s.byResellerAccount.get(accountNumber) ?? null;
    }
    return null;
  });
}
