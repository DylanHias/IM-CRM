'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { OpportunitiesTable } from './OpportunitiesTable';
import { OpportunityWizard } from './OpportunityWizard';
import type { WizardFormData } from './OpportunityWizard';
import { CloseOpportunityDialog } from './CloseOpportunityDialog';
import type { CloseFormData } from './CloseOpportunityDialog';
import { useOpportunities } from '@/hooks/useOpportunities';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { queryContactsByCustomer } from '@/lib/db/queries/contacts';
import { useCustomerStore } from '@/store/customerStore';
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

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [closeOutcome, setCloseOutcome] = useState<'Won' | 'Lost' | null>(null);

  const customerMap = useMemo(
    () => new Map(customer ? [[customer.id, customer.name]] : []),
    [customer]
  );

  useEffect(() => {
    if (triggerAdd && triggerAdd > 0) setAddOpen(true);
  }, [triggerAdd]);

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
        <OpportunitiesTable
          opportunities={opportunities}
          customerMap={customerMap}
          onEdit={setEditing}
        />
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
