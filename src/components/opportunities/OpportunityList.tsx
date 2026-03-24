'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OpportunityForm } from './OpportunityForm';
import type { OpportunityFormData } from './OpportunityForm';
import { useOpportunities } from '@/hooks/useOpportunities';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { queryContactsByCustomer } from '@/lib/db/queries/contacts';
import { mockContacts } from '@/lib/mock/contacts';
import { useCustomerStore } from '@/store/customerStore';
import type { Opportunity, Contact } from '@/types/entities';

interface OpportunityListProps {
  customerId: string;
}

export function OpportunityList({ customerId }: OpportunityListProps) {
  const { opportunities, createOpportunity, editOpportunity, deleteOpportunity } = useOpportunities(customerId);
  const { customers } = useCustomerStore();
  const customer = customers.find((c) => c.id === customerId);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (isTauriApp()) {
          const c = await queryContactsByCustomer(customerId);
          setContacts(c.length > 0 ? c : mockContacts.filter((c) => c.customerId === customerId));
        } else {
          setContacts(mockContacts.filter((c) => c.customerId === customerId));
        }
      } catch {
        setContacts(mockContacts.filter((c) => c.customerId === customerId));
      }
    };
    load();
  }, [customerId]);

  const handleCreate = async (data: OpportunityFormData) => {
    await createOpportunity({ ...data, customerId });
    setAddOpen(false);
  };

  const handleEdit = async (data: OpportunityFormData) => {
    if (!editing) return;
    await editOpportunity({
      ...editing,
      ...data,
      updatedAt: new Date().toISOString(),
    });
    setEditing(null);
  };

  const handleDelete = async (opp: Opportunity) => {
    if (!confirm(`Delete "${opp.subject}"?`)) return;
    await deleteOpportunity(opp.id);
  };

  const statusVariant = (status: Opportunity['status']) => {
    switch (status) {
      case 'Open': return 'default' as const;
      case 'Won': return 'success' as const;
      case 'Lost': return 'destructive' as const;
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={13} />
          Add Opportunity
        </Button>
      </div>

      {opportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Target size={28} className="text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No opportunities yet</p>
        </div>
      ) : (
        <div className="bg-card border border-border/70 rounded-xl overflow-hidden shadow-sm divide-y divide-border/40">
          {opportunities.map((opp, i) => (
            <motion.div
              key={opp.id}
              className="px-5 py-3.5 flex items-start justify-between gap-3 group"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4), ease: 'easeOut' }}
            >
              <div className="flex-1 min-w-0">
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
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(opp)}>
                  <Pencil size={13} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(opp)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Opportunity</DialogTitle>
          </DialogHeader>
          <OpportunityForm
            contacts={contacts}
            customer={customer}
            onSubmit={handleCreate}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Opportunity</DialogTitle>
          </DialogHeader>
          {editing && (
            <OpportunityForm
              opportunity={editing}
              contacts={contacts}
              customer={customer}
              onSubmit={handleEdit}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
