'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { rowSlideIn } from '@/lib/motion';
import { Plus, Target, Pencil, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { OpportunityWizard } from './OpportunityWizard';
import type { WizardFormData } from './OpportunityWizard';
import { CloseOpportunityDialog } from './CloseOpportunityDialog';
import type { CloseFormData } from './CloseOpportunityDialog';
import { useOpportunities } from '@/hooks/useOpportunities';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { queryContactsByCustomer } from '@/lib/db/queries/contacts';
import { useCustomerStore } from '@/store/customerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { EMPTY_OPP_EXTRA_FIELDS } from '@/lib/opportunityRules';
import type { Opportunity, Contact } from '@/types/entities';

interface OpportunityListProps {
  customerId: string;
  triggerAdd?: number;
}

export function OpportunityList({ customerId, triggerAdd }: OpportunityListProps) {
  const { opportunities, createOpportunity, editOpportunity } = useOpportunities(customerId);
  const { customers } = useCustomerStore();
  const customer = customers.find((c) => c.id === customerId);

  const staleDays = useSettingsStore((s) => s.opportunityStaleReminderDays);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [closeOutcome, setCloseOutcome] = useState<'Won' | 'Lost' | null>(null);

  useEffect(() => {
    if (triggerAdd && triggerAdd > 0) setAddOpen(true);
  }, [triggerAdd]);

  const isStale = (opp: Opportunity) =>
    opp.status === 'Open' &&
    (Date.now() - new Date(opp.updatedAt).getTime()) > staleDays * 86400000;

  useEffect(() => {
    const load = async () => {
      try {
        if (isTauriApp()) {
          const c = await queryContactsByCustomer(customerId);
          setContacts(c);
        }
      } catch (err) {
        console.error('[opportunity] Failed to load contacts:', err);
      }
    };
    load();
  }, [customerId]);

  const wizardToInsertInput = (data: WizardFormData) => ({
    ...EMPTY_OPP_EXTRA_FIELDS,
    customerId: data.customerId,
    contactId: data.contactId,
    status: 'Open' as const,
    subject: data.subject,
    bcn: data.bcn,
    multiVendorOpportunity: false,
    sellType: data.sellType,
    primaryVendor: data.primaryVendor,
    opportunityType: data.opportunityType,
    stage: data.stage,
    probability: data.probability,
    expirationDate: data.expirationDate,
    estimatedRevenue: data.estimatedRevenue,
    currency: data.currency,
    country: data.country,
    source: 'cloud',
    recordType: 'Sales',
    customerNeed: data.customerNeed,
    singleOrCrossSell: data.singleOrCrossSell,
    estimatedMRR: data.estimatedMRR,
    annualRevenue: data.annualRevenue,
    apnId: data.apnId,
    awsPartnerType: data.awsPartnerType,
    awsServiceType: data.awsServiceType,
    apnTagging: data.apnTagging,
    endUserType: data.endUserType,
    supportType: data.supportType,
    payerAccount: data.payerAccount,
    existingPayeeAccount: data.existingPayeeAccount,
    consolidationAcceptanceDate: data.consolidationAcceptanceDate,
    msCspTenant: data.msCspTenant,
    mpnId: data.mpnId,
    migrationType: data.migrationType,
    serviceName: data.serviceName,
    competitiveWinback: data.competitiveWinback,
    publicSectorSegment: data.publicSectorSegment,
    statusReason: null,
    actualRevenue: null,
    closeDate: null,
    competitorId: null,
    closeDescription: null,
  });

  const handleCreate = async (data: WizardFormData) => {
    try {
      await createOpportunity(wizardToInsertInput(data));
      setAddOpen(false);
    } catch (err) {
      console.error('[opportunity] Failed to create:', err);
    }
  };

  const handleEdit = async (data: WizardFormData) => {
    if (!editing) return;
    try {
      const currentOpp = opportunities.find((o) => o.id === editing.id) ?? editing;
      await editOpportunity({
        ...currentOpp,
        ...wizardToInsertInput(data),
        id: currentOpp.id,
        createdById: currentOpp.createdById,
        createdByName: currentOpp.createdByName,
        syncStatus: 'pending',
        remoteId: currentOpp.remoteId,
        createdAt: currentOpp.createdAt,
        updatedAt: new Date().toISOString(),
        status: currentOpp.status,
      });
      setEditing(null);
    } catch (err) {
      console.error('[opportunity] Failed to edit:', err);
    }
  };

  const handleClose = async (data: CloseFormData) => {
    if (!editing) return;
    try {
      const currentOpp = opportunities.find((o) => o.id === editing.id) ?? editing;
      await editOpportunity({
        ...currentOpp,
        status: data.outcome,
        statusReason: data.statusReason,
        actualRevenue: data.actualRevenue,
        closeDate: data.closeDate,
        competitorId: data.competitorId,
        closeDescription: data.closeDescription,
        syncStatus: 'pending',
        updatedAt: new Date().toISOString(),
      });
      setCloseOutcome(null);
      setEditing(null);
    } catch (err) {
      console.error('[opportunity] Failed to close:', err);
    }
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
              {...rowSlideIn(i)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-medium text-foreground truncate">{opp.subject}</span>
                  <Badge variant={statusVariant(opp.status)} className="text-[10px] shrink-0">{opp.status}</Badge>
                  {isStale(opp) && (
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 shrink-0" title={`No updates in ${staleDays}+ days`}>
                      <AlertTriangle size={11} />
                      Stale
                    </span>
                  )}
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
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-4xl p-0 gap-0 max-h-[90vh] overflow-hidden">
          <DialogTitle className="sr-only">New Opportunity</DialogTitle>
          <OpportunityWizard
            customer={customer}
            contacts={contacts}
            onSave={handleCreate}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-4xl p-0 gap-0 max-h-[90vh] overflow-hidden">
          <DialogTitle className="sr-only">Edit Opportunity</DialogTitle>
          {editing && (
            <OpportunityWizard
              opportunity={editing}
              contacts={contacts}
              customer={customer}
              onSave={handleEdit}
              onCloseWon={() => setCloseOutcome('Won')}
              onCloseLost={() => setCloseOutcome('Lost')}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <CloseOpportunityDialog
        open={!!closeOutcome}
        outcome={closeOutcome ?? 'Won'}
        currency={editing?.currency ?? 'USD'}
        onClose={() => setCloseOutcome(null)}
        onConfirm={handleClose}
      />
    </div>
  );
}
