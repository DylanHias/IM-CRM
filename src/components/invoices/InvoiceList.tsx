'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Loader2, ChevronLeft, ChevronRight, Search, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { InvoiceDetailPanel } from './InvoiceDetailPanel';
import { useInvoices } from '@/hooks/useInvoices';
import { formatDate } from '@/lib/utils/dateUtils';
import type { InvoiceSearchParams } from '@/types/invoice';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(amount);
}

interface InvoiceListProps {
  resellerId: string | null;
  countryCode: string;
}

export function InvoiceList({ resellerId, countryCode }: InvoiceListProps) {
  const {
    invoices, selectedDetail, isLoading, isLoadingDetail,
    totalRecords, currentPage, pageSize, error,
    loadInvoiceDetail, goToPage, applyFilters, closeDetail,
  } = useInvoices(resellerId, countryCode);

  const [filterNumber, setFilterNumber] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  if (!resellerId) {
    return (
      <div className="text-center py-10">
        <AlertTriangle size={28} className="mx-auto text-warning mb-2" />
        <p className="text-sm text-muted-foreground">This customer does not have a Reseller ID configured.</p>
        <p className="text-xs text-muted-foreground mt-1">A Reseller ID is required to retrieve invoices from Xvantage.</p>
      </div>
    );
  }

  const handleSearch = () => {
    const filters: InvoiceSearchParams = {};
    if (filterNumber.trim()) filters.invoiceNumber = filterNumber.trim();
    if (filterStatus !== 'all') filters.invoiceStatus = filterStatus;
    applyFilters(filters);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  // Show detail panel if selected
  if (selectedDetail || isLoadingDetail) {
    return (
      <InvoiceDetailPanel
        detail={selectedDetail}
        isLoading={isLoadingDetail}
        onClose={closeDetail}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoice number..."
            value={filterNumber}
            onChange={(e) => setFilterNumber(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 h-9 bg-card shadow-sm border-border/70 rounded-lg"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[148px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Past Due">Past Due</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-muted-foreground animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-10">
          <FileText size={28} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No invoices found.</p>
        </div>
      ) : (
        <>
          {/* Invoice Table */}
          <div className="bg-card border border-border/70 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Invoice #</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Due Date</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Order #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  <AnimatePresence>
                    {invoices.map((inv, i) => (
                      <motion.tr
                        key={inv.invoiceNumber}
                        className="hover:bg-muted/20 transition-colors cursor-pointer"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                        onClick={() => loadInvoiceDetail(inv.invoiceNumber)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-primary hover:underline">{inv.invoiceNumber}</span>
                        </td>
                        <td className="px-4 py-3 text-foreground">{formatDate(inv.invoiceDate)}</td>
                        <td className="px-4 py-3 text-foreground">{formatDate(inv.invoiceDueDate)}</td>
                        <td className="px-4 py-3"><InvoiceStatusBadge status={inv.invoiceStatus} /></td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(inv.invoiceAmountInclTax)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{inv.customerOrderNumber ?? '—'}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {totalRecords} record{totalRecords !== 1 ? 's' : ''} · Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                <ChevronLeft size={14} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
