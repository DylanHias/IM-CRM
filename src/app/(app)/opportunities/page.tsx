'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/TablePagination';
import { OpportunityForm } from '@/components/opportunities/OpportunityForm';
import type { OpportunityFormData } from '@/components/opportunities/OpportunityForm';
import { OpportunitiesFilters } from '@/components/opportunities/OpportunitiesFilters';
import { OpportunitiesTable } from '@/components/opportunities/OpportunitiesTable';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import {
  queryAllOpportunities,
  insertOpportunity,
  updateOpportunity as dbUpdateOpportunity,
} from '@/lib/db/queries/opportunities';
import { queryAllCustomers } from '@/lib/db/queries/customers';
import { queryContactsByCustomer } from '@/lib/db/queries/contacts';
import { directPushOpportunity } from '@/lib/sync/directPushService';
import { emitDataEvent, onDataEvent } from '@/lib/dataEvents';
import { useAuthStore } from '@/store/authStore';
import { useOpportunityListStore } from '@/store/opportunityListStore';
import { usePaginationPreference } from '@/hooks/usePaginationPreference';
import { useShortcutListener } from '@/hooks/useShortcuts';
import { useD365UserId } from '@/hooks/useD365UserId';
import type { Opportunity, Contact, Customer } from '@/types/entities';
import { v4 as uuidv4 } from 'uuid';

export default function OpportunitiesPage() {
  const { account } = useAuthStore();
  const d365UserId = useD365UserId();
  const {
    opportunities: allOpportunities,
    customerMap,
    page,
    isLoading,
    setOpportunities,
    setCustomerMap,
    setPage,
    setLoading,
    getFilteredOpportunities,
  } = useOpportunityListStore();

  const { pageSize, setPageSize, pageSizeOptions } = usePaginationPreference('opportunities');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const loadGenRef = useRef(0);

  useShortcutListener('new-item', useCallback(() => setAddOpen(true), []));

  const loadData = useCallback(async () => {
    setLoading(true);
    const gen = ++loadGenRef.current;
    try {
      if (isTauriApp()) {
        const [opps, custs] = await Promise.all([
          queryAllOpportunities(),
          queryAllCustomers(),
        ]);
        if (gen !== loadGenRef.current) return;
        setOpportunities(opps);
        setCustomers(custs);
        setCustomerMap(new Map(custs.map((c) => [c.id, c.name])));
      } else {
        if (gen !== loadGenRef.current) return;
        setOpportunities([]);
        setCustomers([]);
        setCustomerMap(new Map());
      }
    } catch (err) {
      console.error('[opportunity] Failed to load opportunities:', err);
      if (gen !== loadGenRef.current) return;
      setOpportunities([]);
      setCustomers([]);
      setCustomerMap(new Map());
    } finally {
      setLoading(false);
    }
  }, [setOpportunities, setCustomerMap, setLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return onDataEvent((e) => {
      if (e.entity === 'opportunity') loadData();
    });
  }, [loadData]);

  useEffect(() => {
    if (!selectedCustomerId) return;
    const load = async () => {
      try {
        if (isTauriApp()) {
          const c = await queryContactsByCustomer(selectedCustomerId);
          setContacts(c);
        } else {
          setContacts([]);
        }
      } catch (err) {
        console.error('[opportunity] Failed to load contacts:', err);
        setContacts([]);
      }
    };
    load();
  }, [selectedCustomerId]);

  const handleCreate = async (data: OpportunityFormData) => {
    if (!selectedCustomerId) return;
    const customerId = selectedCustomerId;
    const now = new Date().toISOString();
    const opp: Opportunity = {
      ...data,
      id: uuidv4(),
      customerId,
      createdById: d365UserId ?? account?.localAccountId ?? 'unknown',
      createdByName: account?.name ?? 'Unknown User',
      syncStatus: 'pending',
      remoteId: null,
      createdAt: now,
      updatedAt: now,
    };
    if (isTauriApp()) {
      try {
        await insertOpportunity(opp);
        directPushOpportunity(opp).then((result) => {
          if (result) {
            emitDataEvent('opportunity', 'updated', customerId);
          }
        });
      } catch (err) {
        console.error('[opportunity] DB insert failed:', err);
      }
    }
    setOpportunities([opp, ...allOpportunities]);
    emitDataEvent('opportunity', 'created', customerId);
    setAddOpen(false);
    setSelectedCustomerId(null);
  };

  const handleEdit = async (data: OpportunityFormData) => {
    if (!editing) return;
    const currentOpp = allOpportunities.find((o) => o.id === editing.id) ?? editing;
    const updated: Opportunity = {
      ...currentOpp,
      ...data,
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    };
    if (isTauriApp()) {
      try {
        await dbUpdateOpportunity(updated);
        directPushOpportunity(updated).then((result) => {
          if (result) {
            emitDataEvent('opportunity', 'updated', updated.customerId);
          }
        });
      } catch (err) {
        console.error('[opportunity] DB update failed:', err);
      }
    }
    setOpportunities(allOpportunities.map((o) => (o.id === updated.id ? updated : o)));
    emitDataEvent('opportunity', 'updated', editing.customerId);
    setEditing(null);
    setSelectedCustomerId(null);
  };

  const openEdit = (opp: Opportunity) => {
    setSelectedCustomerId(opp.customerId);
    setEditing(opp);
  };

  const filtered = getFilteredOpportunities();

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div data-tour="page-opportunities" className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Opportunity Overview</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? 'Loading...'
              : filtered.length === allOpportunities.length
                ? `${filtered.length} opportunit${filtered.length !== 1 ? 'ies' : 'y'}`
                : `${filtered.length} of ${allOpportunities.length} opportunities`}
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={13} />
          Add Opportunity
        </Button>
      </div>

      <OpportunitiesFilters />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="text-muted-foreground animate-spin" />
        </div>
      ) : (
        <>
          <OpportunitiesTable
            opportunities={paged}
            customerMap={customerMap}
            onEdit={openEdit}
          />
          <TablePagination
            totalItems={filtered.length}
            page={safePage}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) { setSelectedCustomerId(null); setCustomerSearch(''); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Opportunity</DialogTitle>
          </DialogHeader>
          {!selectedCustomerId ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select a customer:</p>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, BCN, or account number..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto border border-border rounded-lg divide-y divide-border/50">
                {customers
                  .filter((c) => {
                    if (!customerSearch.trim()) return true;
                    const q = customerSearch.toLowerCase();
                    return c.name.toLowerCase().includes(q)
                      || (c.bcn && c.bcn.toLowerCase().includes(q))
                      || (c.accountNumber && c.accountNumber.toLowerCase().includes(q));
                  })
                  .map((c) => (
                    <button
                      key={c.id}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                      onClick={() => { setSelectedCustomerId(c.id); setCustomerSearch(''); }}
                    >
                      <span className="font-medium">{c.name}</span>
                      {c.bcn && <span className="text-xs text-muted-foreground ml-2">BCN: {c.bcn}</span>}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <OpportunityForm
              contacts={contacts}
              customer={customers.find((c) => c.id === selectedCustomerId)}
              onSubmit={handleCreate}
              onCancel={() => { setAddOpen(false); setSelectedCustomerId(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) { setEditing(null); setSelectedCustomerId(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Opportunity</DialogTitle>
          </DialogHeader>
          {editing && (
            <OpportunityForm
              opportunity={editing}
              contacts={contacts}
              customer={customers.find((c) => c.id === editing.customerId)}
              onSubmit={handleEdit}
              onCancel={() => { setEditing(null); setSelectedCustomerId(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
