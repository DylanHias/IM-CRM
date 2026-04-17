'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { FileText, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { tabPanelMotion } from '@/lib/motion';
import { Input } from '@/components/ui/input';
import { InvoiceList } from '@/components/invoices/InvoiceList';
import { useCustomerStore } from '@/store/customerStore';
import { useShortcutListener } from '@/hooks/useShortcuts';
import { getCountryCode } from '@/lib/utils/countryUtils';
import type { Customer } from '@/types/entities';

export default function InvoicesPage() {
  const { customers } = useCustomerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useShortcutListener('focus-search', useCallback(() => searchInputRef.current?.focus(), []));

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.accountNumber?.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [searchQuery, customers]);

  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.name);
    setDropdownOpen(false);
  };

  const countryCode = selectedCustomer ? getCountryCode(selectedCustomer.addressCountry) : 'BE';

  return (
    <div className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Invoices</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Search invoices from Xvantage CLS
            </p>
          </div>

          {/* Customer Search */}
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              ref={searchInputRef}
              placeholder="Search customer by name or account number..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDropdownOpen(true);
                if (!e.target.value.trim()) setSelectedCustomer(null);
              }}
              onFocus={() => setDropdownOpen(true)}
              className="pl-9 h-9 bg-card shadow-sm border-border/70 rounded-lg"
            />
            {dropdownOpen && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border/70 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between"
                    onClick={() => handleSelect(c)}
                  >
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.accountNumber}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {!selectedCustomer ? (
              <motion.div key="empty" {...tabPanelMotion} className="text-center py-20">
                <FileText size={40} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Select a customer to view their invoices</p>
              </motion.div>
            ) : (
              <motion.div key={selectedCustomer.id} {...tabPanelMotion}>
                <InvoiceList
                  resellerId={selectedCustomer.resellerId}
                  countryCode={countryCode}
                />
              </motion.div>
            )}
          </AnimatePresence>
    </div>
  );
}
