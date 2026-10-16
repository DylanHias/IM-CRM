'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { OpportunityRow } from './OpportunityRow';
import { OpportunityContextMenu } from './OpportunityContextMenu';
import { Panel } from '@/components/ui/panel';
import { EmptyState } from '@/components/ui/empty-state';
import { compactMoney } from '@/lib/opportunities/display';
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
  /** Deal being closed straight from the row's right-click menu (no wizard open). */
  const [closing, setClosing] = useState<Opportunity | null>(null);
  const closeTarget = closing ?? editing;

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
    estimatedMargin: data.estimatedMargin,
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
    secondaryOwnerId: data.secondaryOwnerId,
    secondaryOwnerName: data.secondaryOwnerName,
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
    if (!closeTarget) return;
    try {
      const currentOpp = opportunities.find((o) => o.id === closeTarget.id) ?? closeTarget;
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
      setClosing(null);
      setEditing(null);
    } catch (err) {
      console.error('[opportunity] Failed to close:', err);
    }
  };

  const openOpps = opportunities.filter((o) => o.status === 'Open');
  const openCount = openOpps.length;
  const openValue = openOpps.reduce((a, o) => a + (o.estimatedRevenue ?? 0), 0);

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {openCount} open · {compactMoney(openValue)}
        </span>
        <span className="flex-1" />
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={13} />
          New opportunity
        </Button>
      </div>

      <Panel>
        {opportunities.length === 0 ? (
          <EmptyState icon={Target} title="No opportunities yet" />
        ) : (
          <div role="listbox" aria-label="Opportunities" className="stagger-in grid">
            {opportunities.map((o) => (
              <OpportunityContextMenu
                key={o.id}
                opportunity={o}
                onOpen={() => setEditing(o)}
                onCloseAs={(outcome) => {
                  setClosing(o);
                  setCloseOutcome(outcome);
                }}
              >
                <OpportunityRow
                  opportunity={o}
                  companyName={customerMap.get(o.customerId) ?? ''}
                  hideCompany
                  onClick={() => setEditing(o)}
                />
              </OpportunityContextMenu>
            ))}
          </div>
        )}
      </Panel>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[1000px] h-[min(760px,90vh)] p-0 gap-0 overflow-hidden">
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
        <DialogContent className="sm:max-w-[1000px] h-[min(760px,90vh)] p-0 gap-0 overflow-hidden">
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
        currency={closeTarget?.currency ?? 'USD'}
        onClose={() => {
          setCloseOutcome(null);
          setClosing(null);
        }}
        onConfirm={handleClose}
      />
    </div>
  );
}
