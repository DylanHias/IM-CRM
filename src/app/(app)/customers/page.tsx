'use client';

import { CustomerFilters } from '@/components/customers/CustomerFilters';
import { CustomerList } from '@/components/customers/CustomerList';
import { useCustomers } from '@/hooks/useCustomers';
import { RefreshCw } from 'lucide-react';

export default function CustomersPage() {
  const { customers, allCustomers, isLoading } = useCustomers();

  return (
    <div className="max-w-5xl mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Customer Overview</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isLoading
                  ? 'Loading...'
                  : customers.length === allCustomers.length
                    ? `${customers.length} customer${customers.length !== 1 ? 's' : ''}`
                    : `${customers.length} of ${allCustomers.length} customers`}
              </p>
            </div>
          </div>

          <CustomerFilters />

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={24} className="text-muted-foreground animate-spin" />
            </div>
          ) : (
            <CustomerList customers={customers} />
          )}
    </div>
  );
}
