'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Target, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OpportunityForm } from '@/components/opportunities/OpportunityForm';
import type { OpportunityFormData } from '@/components/opportunities/OpportunityForm';
import { useOpportunityStore } from '@/store/opportunityStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { queryAllOpportunities, insertOpportunity, updateOpportunity as dbUpdateOpportunity, deleteOpportunity as dbDeleteOpportunity } from '@/lib/db/queries/opportunities';
import { queryAllCustomers } from '@/lib/db/queries/customers';
import { queryContactsByCustomer } from '@/lib/db/queries/contacts';
import { mockOpportunities } from '@/lib/mock/opportunities';
import { mockCustomers } from '@/lib/mock/customers';
import { mockContacts } from '@/lib/mock/contacts';
import { useAuthStore } from '@/store/authStore';
import type { Opportunity, Contact } from '@/types/entities';
import { v4 as uuidv4 } from 'uuid';

export default function OpportunitiesPage() {
  const router = useRouter();
  const { account } = useAuthStore();
  const { opportunities, setOpportunities, addOpportunity, updateOpportunity, removeOpportunity } = useOpportunityStore();
  const [customerMap, setCustomerMap] = useState<Map<string, string>>(new Map());
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (isTauriApp()) {
          const [opps, customers] = await Promise.all([
            queryAllOpportunities(),
            queryAllCustomers(),
          ]);
          setOpportunities(opps.length > 0 ? opps : mockOpportunities, null);
          setCustomerMap(new Map((customers.length > 0 ? customers : mockCustomers).map((c) => [c.id, c.name])));
        } else {
          setOpportunities(mockOpportunities, null);
          setCustomerMap(new Map(mockCustomers.map((c) => [c.id, c.name])));
        }
      } catch {
        setOpportunities(mockOpportunities, null);
        setCustomerMap(new Map(mockCustomers.map((c) => [c.id, c.name])));
      }
    };
    load();
  }, [setOpportunities]);

  useEffect(() => {
    if (!selectedCustomerId) return;
    const load = async () => {
      try {
        if (isTauriApp()) {
          const c = await queryContactsByCustomer(selectedCustomerId);
          setContacts(c.length > 0 ? c : mockContacts.filter((c) => c.customerId === selectedCustomerId));
        } else {
          setContacts(mockContacts.filter((c) => c.customerId === selectedCustomerId));
        }
      } catch {
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
      await insertOpportunity(opp);
    }
    addOpportunity(opp);
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
      await dbUpdateOpportunity(updated);
    }
    updateOpportunity(updated);
    setEditing(null);
    setSelectedCustomerId(null);
  };

  const handleDelete = async (opp: Opportunity) => {
    if (!confirm(`Delete "${opp.subject}"?`)) return;
    if (isTauriApp()) {
      await dbDeleteOpportunity(opp.id);
    }
    removeOpportunity(opp.id);
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

      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) setSelectedCustomerId(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Opportunity</DialogTitle>
          </DialogHeader>
          {!selectedCustomerId ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select a customer:</p>
              <div className="max-h-60 overflow-y-auto border border-border rounded-lg divide-y divide-border/50">
                {Array.from(customerMap.entries()).map(([id, name]) => (
                  <button
                    key={id}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                    onClick={() => setSelectedCustomerId(id)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <OpportunityForm
              contacts={contacts}
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
