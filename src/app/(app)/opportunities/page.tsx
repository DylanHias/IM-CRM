'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Target, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OpportunityForm } from '@/components/opportunities/OpportunityForm';
import type { OpportunityFormData } from '@/components/opportunities/OpportunityForm';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { queryAllOpportunities, insertOpportunity, updateOpportunity as dbUpdateOpportunity, deleteOpportunity as dbDeleteOpportunity } from '@/lib/db/queries/opportunities';
import { queryAllCustomers } from '@/lib/db/queries/customers';
import { queryContactsByCustomer } from '@/lib/db/queries/contacts';
import { mockOpportunities } from '@/lib/mock/opportunities';
import { mockCustomers } from '@/lib/mock/customers';
import { mockContacts } from '@/lib/mock/contacts';
import { emitDataEvent, onDataEvent } from '@/lib/dataEvents';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { Opportunity, Contact, Customer } from '@/types/entities';
import { v4 as uuidv4 } from 'uuid';

export default function OpportunitiesPage() {
  const router = useRouter();
  const { account } = useAuthStore();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerMap, setCustomerMap] = useState<Map<string, string>>(new Map());
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const useMock = useSettingsStore.getState().mockDataEnabled;
      if (!useMock && isTauriApp()) {
        const [opps, custs] = await Promise.all([
          queryAllOpportunities(),
          queryAllCustomers(),
        ]);
        setOpportunities(opps);
        setCustomers(custs);
        setCustomerMap(new Map(custs.map((c) => [c.id, c.name])));
      } else {
        setOpportunities(mockOpportunities);
        setCustomers(mockCustomers as Customer[]);
        setCustomerMap(new Map(mockCustomers.map((c) => [c.id, c.name])));
      }
    } catch (err) {
      console.error('[opportunity] Failed to load opportunities:', err);
      setOpportunities(mockOpportunities);
      setCustomers(mockCustomers as Customer[]);
      setCustomerMap(new Map(mockCustomers.map((c) => [c.id, c.name])));
    }
  }, []);

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
        const useMock = useSettingsStore.getState().mockDataEnabled;
        if (!useMock && isTauriApp()) {
          const c = await queryContactsByCustomer(selectedCustomerId);
          setContacts(c);
        } else {
          setContacts(mockContacts.filter((c) => c.customerId === selectedCustomerId));
        }
      } catch (err) {
        console.error('[opportunity] Failed to load contacts:', err);
        setContacts(mockContacts.filter((c) => c.customerId === selectedCustomerId));
      }
    };
    load();
  }, [selectedCustomerId]);

  const handleCreate = async (data: OpportunityFormData) => {
    if (!selectedCustomerId) return;
    const now = new Date().toISOString();
    const opp: Opportunity = {
      ...data,
      id: uuidv4(),
      customerId: selectedCustomerId,
      createdById: account?.localAccountId ?? 'unknown',
      createdByName: account?.name ?? 'Unknown User',
      syncStatus: 'pending',
      remoteId: null,
      createdAt: now,
      updatedAt: now,
    };
    if (isTauriApp()) {
      try {
        await insertOpportunity(opp);
      } catch (err) {
        console.error('[opportunity] DB insert failed:', err);
      }
    }
    setOpportunities((prev) => [opp, ...prev]);
    emitDataEvent('opportunity', 'created', selectedCustomerId);
    setAddOpen(false);
    setSelectedCustomerId(null);
  };

  const handleEdit = async (data: OpportunityFormData) => {
    if (!editing) return;
    const updated: Opportunity = {
      ...editing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    if (isTauriApp()) {
      try {
        await dbUpdateOpportunity(updated);
      } catch (err) {
        console.error('[opportunity] DB update failed:', err);
      }
    }
    setOpportunities((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    emitDataEvent('opportunity', 'updated', editing.customerId);
    setEditing(null);
    setSelectedCustomerId(null);
  };

  const handleDelete = async (opp: Opportunity) => {
    if (!confirm(`Delete "${opp.subject}"?`)) return;
    if (isTauriApp()) {
      try {
        await dbDeleteOpportunity(opp.id);
      } catch (err) {
        console.error('[opportunity] DB delete failed:', err);
      }
    }
    setOpportunities((prev) => prev.filter((o) => o.id !== opp.id));
    emitDataEvent('opportunity', 'deleted', opp.customerId);
  };

  const openEdit = (opp: Opportunity) => {
    setSelectedCustomerId(opp.customerId);
    setEditing(opp);
  };

  const statusVariant = (status: Opportunity['status']) => {
    switch (status) {
      case 'Open': return 'default' as const;
      case 'Won': return 'success' as const;
      case 'Lost': return 'destructive' as const;
    }
  };

  const open = opportunities.filter((o) => o.status === 'Open');
  const won = opportunities.filter((o) => o.status === 'Won');
  const lost = opportunities.filter((o) => o.status === 'Lost');

  const renderOpportunity = (opp: Opportunity, i: number) => (
    <motion.div
      key={opp.id}
      className="px-5 py-3.5 flex items-start justify-between gap-3 group"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4), ease: 'easeOut' }}
    >
      <div className="flex-1 min-w-0">
        <p
          className="text-xs text-muted-foreground mb-0.5 cursor-pointer hover:underline"
          onClick={() => router.push(`/customers/${opp.customerId}`)}
        >
          {customerMap.get(opp.customerId) ?? opp.customerId}
        </p>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px] font-medium text-foreground truncate">{opp.subject}</span>
          <Badge variant={statusVariant(opp.status)} className="text-[10px] shrink-0">{opp.status}</Badge>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          <span>{opp.stage} ({opp.probability}%)</span>
          {opp.primaryVendor && <span>{opp.primaryVendor}</span>}
          {opp.opportunityType && <span>{opp.opportunityType}</span>}
          {opp.estimatedRevenue != null && (
            <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: opp.currency, maximumFractionDigits: 0 }).format(opp.estimatedRevenue)}</span>
          )}
          {opp.expirationDate && <span>Exp: {opp.expirationDate}</span>}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(opp)}>
          <Pencil size={13} />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(opp)}>
          <Trash2 size={13} />
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">All Opportunities</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track sales opportunities across all customers.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={13} />
          Add Opportunity
        </Button>
      </div>

      {open.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-3">Open ({open.length})</h3>
          <div className="bg-card rounded-xl divide-y divide-border/70 shadow-sm border border-border/60">
            {open.map((o, i) => renderOpportunity(o, i))}
          </div>
        </section>
      )}

      {won.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-3">Won ({won.length})</h3>
          <div className="bg-card rounded-xl divide-y divide-border/70 shadow-sm border border-border/60">
            {won.map((o, i) => renderOpportunity(o, i))}
          </div>
        </section>
      )}

      {lost.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Lost ({lost.length})</h3>
          <div className="bg-card rounded-xl divide-y divide-border/70 shadow-sm border border-border/60">
            {lost.map((o, i) => renderOpportunity(o, i))}
          </div>
        </section>
      )}

      {opportunities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Target size={40} className="text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No opportunities yet</p>
        </div>
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
              onSubmit={handleEdit}
              onCancel={() => { setEditing(null); setSelectedCustomerId(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
