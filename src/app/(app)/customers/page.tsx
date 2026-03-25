'use client';

import { CustomerFilters } from '@/components/customers/CustomerFilters';
import { CustomerList } from '@/components/customers/CustomerList';
import { useCustomers } from '@/hooks/useCustomers';
import { useCustomerStore } from '@/store/customerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CustomersPage() {
  const { customers, allCustomers, isLoading } = useCustomers();
  const { page, setPage } = useCustomerStore();
  const itemsPerPage = useSettingsStore((s) => s.itemsPerPage);

  const totalPages = Math.max(1, Math.ceil(customers.length / itemsPerPage));
  const safePage = Math.min(page, totalPages);
  const pagedCustomers = customers.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

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
            <>
              <CustomerList customers={pagedCustomers} />
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-muted-foreground">
                    {(safePage - 1) * itemsPerPage + 1}–{Math.min(safePage * itemsPerPage, customers.length)} of {customers.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={safePage <= 1}
                      onClick={() => setPage(safePage - 1)}
                    >
                      <ChevronLeft size={14} />
                    </Button>
                    <span className="text-xs text-muted-foreground px-2">
                      {safePage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage(safePage + 1)}
                    >
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
    </div>
  );
}
