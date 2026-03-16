'use client';

import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { formatDate } from '@/lib/utils/dateUtils';
import type { InvoiceDetail, AddressInfo } from '@/types/invoice';

interface InvoiceDetailPanelProps {
  detail: InvoiceDetail | null;
  isLoading: boolean;
  onClose: () => void;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function AddressBlock({ label, address }: { label: string; address: AddressInfo }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      <div className="text-[13px] text-foreground space-y-0.5">
        {address.companyName && <p className="font-medium">{address.companyName}</p>}
        {address.addressLine1 && <p>{address.addressLine1}</p>}
        {address.addressLine2 && <p>{address.addressLine2}</p>}
        <p>{[address.postalCode, address.city].filter(Boolean).join(' ')}{address.countryCode ? `, ${address.countryCode}` : ''}</p>
      </div>
    </div>
  );
}

export function InvoiceDetailPanel({ detail, isLoading, onClose }: InvoiceDetailPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-muted-foreground">Invoice detail not available.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onClose}>Back to List</Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-foreground">{detail.invoiceNumber}</h3>
            <InvoiceStatusBadge status={detail.invoiceStatus} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Invoice Date: {formatDate(detail.invoiceDate)} · Due: {formatDate(detail.invoiceDueDate)}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      {/* Order Info */}
      <div className="bg-card border border-border/70 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
          {detail.customerOrderNumber && (
            <div><span className="text-muted-foreground">Customer PO:</span> <span className="font-medium">{detail.customerOrderNumber}</span></div>
          )}
          {detail.erpOrderNumber && (
            <div><span className="text-muted-foreground">ERP Order:</span> <span className="font-medium">{detail.erpOrderNumber}</span></div>
          )}
          {detail.endCustomerOrderNumber && (
            <div><span className="text-muted-foreground">End Customer PO:</span> <span className="font-medium">{detail.endCustomerOrderNumber}</span></div>
          )}
          {detail.orderCreateDate && (
            <div><span className="text-muted-foreground">Order Date:</span> <span className="font-medium">{formatDate(detail.orderCreateDate)}</span></div>
          )}
        </div>
      </div>

      {/* Addresses & Payment Terms */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border/70 rounded-xl p-4 shadow-sm">
          <AddressBlock label="Bill To" address={detail.billToInfo} />
        </div>
        <div className="bg-card border border-border/70 rounded-xl p-4 shadow-sm">
          <AddressBlock label="Ship To" address={detail.shipToInfo} />
        </div>
        <div className="bg-card border border-border/70 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Payment Terms</p>
          <div className="text-[13px] text-foreground space-y-0.5">
            {detail.paymentTermsInfo.paymentTermsDescription && <p className="font-medium">{detail.paymentTermsInfo.paymentTermsDescription}</p>}
            {detail.paymentTermsInfo.paymentTermsDueDate && <p>Due: {formatDate(detail.paymentTermsInfo.paymentTermsDueDate)}</p>}
            {detail.paymentTermsInfo.paymentTermsNetDays != null && <p>Net days: {detail.paymentTermsInfo.paymentTermsNetDays}</p>}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-card border border-border/70 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50">
          <span className="text-sm font-semibold text-foreground">Line Items ({detail.lines.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Part #</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Description</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Vendor</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Qty</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Unit Price</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Extended</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {detail.lines.map((line, i) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-foreground">{line.ingramPartNumber}</div>
                    {line.vendorPartNumber && <div className="text-muted-foreground text-[11px]">{line.vendorPartNumber}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-foreground max-w-[200px] truncate">{line.productDescription}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{line.vendorName}</td>
                  <td className="px-4 py-2.5 text-right text-foreground">{line.quantity}</td>
                  <td className="px-4 py-2.5 text-right text-foreground">{formatCurrency(line.unitPrice, line.currencyCode)}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-foreground">{formatCurrency(line.extendedPrice, line.currencyCode)}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{formatCurrency(line.taxAmount, line.currencyCode)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-card border border-border/70 rounded-xl p-4 shadow-sm">
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5 text-[13px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(detail.summary.totalAmount, detail.summary.currencyCode)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">{formatCurrency(detail.summary.totalTax, detail.summary.currencyCode)}</span>
            </div>
            <div className="flex justify-between border-t border-border/50 pt-1.5">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-foreground">{formatCurrency(detail.summary.totalAmountInclTax, detail.summary.currencyCode)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
