'use client';

import { useSearchParams } from 'next/navigation';
import { CustomerFilters } from '@/components/customers/CustomerFilters';
import { CustomerList } from '@/components/customers/CustomerList';
import CustomerDetailClient from './CustomerDetailClient';
import { useCustomers } from '@/hooks/useCustomers';
import { useCustomerStore } from '@/store/customerStore';
import { usePaginationPreference } from '@/hooks/usePaginationPreference';
import { TablePagination } from '@/components/ui/TablePagination';
import { RefreshCw } from 'lucide-react';

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('id');

  if (customerId) {
    return <CustomerDetailClient customerId={customerId} />;
  }

  return <CustomerListView />;
}

function CustomerListView() {
  const { customers, allCustomers, isLoading } = useCustomers();
  const { page, setPage } = useCustomerStore();
  const { pageSize, setPageSize, pageSizeOptions } = usePaginationPreference('customers');

  const totalPages = Math.max(1, Math.ceil(customers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedCustomers = customers.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
          <div data-tour="page-customers" className="flex items-center justify-between">
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
            <>
              <CustomerList customers={pagedCustomers} />
              <TablePagination
                totalItems={customers.length}
                page={safePage}
                pageSize={pageSize}
                pageSizeOptions={pageSizeOptions}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
    </div>
  );
}
