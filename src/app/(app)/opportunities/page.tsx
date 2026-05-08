'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/TablePagination';
import { ListRowsSkeleton, Skeleton } from '@/components/ui/skeleton';
import { OpportunityWizard } from '@/components/opportunities/OpportunityWizard';
import type { WizardFormData } from '@/components/opportunities/OpportunityWizard';
import { CloseOpportunityDialog } from '@/components/opportunities/CloseOpportunityDialog';
import type { CloseFormData } from '@/components/opportunities/CloseOpportunityDialog';
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
import { notifyPush } from '@/lib/sync/pushToast';
import { emitDataEvent, onDataEvent } from '@/lib/dataEvents';
import { useAuthStore } from '@/store/authStore';
import { useOpportunityListStore } from '@/store/opportunityListStore';
import { usePaginationPreference } from '@/hooks/usePaginationPreference';
import { useShortcutListener } from '@/hooks/useShortcuts';
import { useD365UserId } from '@/hooks/useD365UserId';
import type { Opportunity, Contact, Customer } from '@/types/entities';
import { EMPTY_OPP_EXTRA_FIELDS } from '@/lib/opportunityRules';
import { v4 as uuidv4 } from 'uuid';

export default function OpportunitiesPage() {
  const router = useRouter();
  const { account, isAdmin, isLoading: authLoading } = useAuthStore();
  const d365UserId = useD365UserId();

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/dashboard');
  }, [isAdmin, authLoading, router]);
  const {
    opportunities: allOpportunities,
    customerMap,
    page,
    isLoading,
    setOpportunities,
    setCustomerMap,
    setCurrentUserIds,
    setPage,
    setLoading,
    getFilteredOpportunities,
  } = useOpportunityListStore();

  useEffect(() => {
    const ids = [d365UserId, account?.localAccountId].filter((v): v is string => Boolean(v));
    setCurrentUserIds(ids);
  }, [d365UserId, account?.localAccountId, setCurrentUserIds]);

  const { pageSize, setPageSize, pageSizeOptions } = usePaginationPreference('opportunities');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [closeOutcome, setCloseOutcome] = useState<'Won' | 'Lost' | null>(null);
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

  const [wizardCustomerId, setWizardCustomerId] = useState<string | null>(null);
  const activeCustomerId = editing?.customerId ?? wizardCustomerId;
  useEffect(() => {
    if (!activeCustomerId) {
      setContacts([]);
      return;
    }
    const load = async () => {
      try {
        if (isTauriApp()) {
          const c = await queryContactsByCustomer(activeCustomerId);
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
  }, [activeCustomerId]);

  // Reset wizard's tracked customer when the Add dialog closes
  useEffect(() => {
    if (!addOpen) setWizardCustomerId(null);
  }, [addOpen]);

  const buildFromWizard = (data: WizardFormData, base: Opportunity): Opportunity => ({
    ...base,
    customerId: data.customerId,
    contactId: data.contactId,
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
    syncStatus: 'pending',
    updatedAt: new Date().toISOString(),
  });

  const handleCreate = async (data: WizardFormData) => {
    if (!data.customerId) return;
    const now = new Date().toISOString();
    const newOpp: Opportunity = {
      ...EMPTY_OPP_EXTRA_FIELDS,
      id: uuidv4(),
      customerId: data.customerId,
      contactId: data.contactId,
      status: 'Open',
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
      syncStatus: 'pending',
      remoteId: null,
      createdById: d365UserId ?? account?.localAccountId ?? 'unknown',
      createdByName: account?.name ?? 'Unknown User',
      createdAt: now,
      updatedAt: now,
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
    };
    if (isTauriApp()) {
      try {
        await insertOpportunity(newOpp);
        pushAndNotify(newOpp, 'created');
      } catch (err) {
        console.error('[opportunity] DB insert failed:', err);
        toast.error('Could not save opportunity', { description: err instanceof Error ? err.message : String(err) });
      }
    }
    setOpportunities([newOpp, ...allOpportunities]);
    emitDataEvent('opportunity', 'created', newOpp.customerId);
    setAddOpen(false);
  };

  const handleEdit = async (data: WizardFormData) => {
    if (!editing) return;
    const currentOpp = allOpportunities.find((o) => o.id === editing.id) ?? editing;
    const updated = buildFromWizard(data, currentOpp);
    if (isTauriApp()) {
      try {
        await dbUpdateOpportunity(updated);
        pushAndNotify(updated, 'updated');
      } catch (err) {
        console.error('[opportunity] DB update failed:', err);
        toast.error('Could not update opportunity', { description: err instanceof Error ? err.message : String(err) });
      }
    }
    setOpportunities(allOpportunities.map((o) => (o.id === updated.id ? updated : o)));
    emitDataEvent('opportunity', 'updated', editing.customerId);
    setEditing(null);
  };

  const handleClose = async (data: CloseFormData) => {
    if (!editing) return;
    const currentOpp = allOpportunities.find((o) => o.id === editing.id) ?? editing;
    const updated: Opportunity = {
      ...currentOpp,
      status: data.outcome,
      statusReason: data.statusReason,
      actualRevenue: data.actualRevenue,
      closeDate: data.closeDate,
      competitorId: data.competitorId,
      closeDescription: data.closeDescription,
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    };
    if (isTauriApp()) {
      try {
        await dbUpdateOpportunity(updated);
        pushAndNotify(updated, `closed as ${data.outcome.toLowerCase()}`);
      } catch (err) {
        console.error('[opportunity] DB close failed:', err);
        toast.error('Could not close opportunity', { description: err instanceof Error ? err.message : String(err) });
      }
    }
    setOpportunities(allOpportunities.map((o) => (o.id === updated.id ? updated : o)));
    emitDataEvent('opportunity', 'updated', updated.customerId);
    setCloseOutcome(null);
    setEditing(null);
  };

  const pushAndNotify = (opp: Opportunity, action: string): void => {
    notifyPush(() => directPushOpportunity(opp), {
      entity: 'opportunity',
      action,
      label: opp.subject,
      onSuccess: () => emitDataEvent('opportunity', 'updated', opp.customerId),
    });
  };

  const openEdit = (opp: Opportunity) => setEditing(opp);

  const filtered = getFilteredOpportunities();

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div data-tour="page-opportunities" className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Opportunity Overview</h2>
          {isLoading ? (
            <Skeleton className="h-3.5 w-32 mt-1.5" />
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length === allOpportunities.length
                ? `${filtered.length} opportunit${filtered.length !== 1 ? 'ies' : 'y'}`
                : `${filtered.length} of ${allOpportunities.length} opportunities`}
            </p>
          )}
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus size={13} />
          Add Opportunity
        </Button>
      </div>

      <OpportunitiesFilters />

      {isLoading ? (
        <ListRowsSkeleton rows={pageSize} />
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

      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); }}>
        <DialogContent className="sm:max-w-4xl p-0 gap-0 max-h-[90vh] overflow-hidden">
          <DialogTitle className="sr-only">New Opportunity</DialogTitle>
          <OpportunityWizard
            customers={customers}
            contacts={contacts}
            onSave={handleCreate}
            onCustomerChange={setWizardCustomerId}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="sm:max-w-4xl p-0 gap-0 max-h-[90vh] overflow-hidden">
          <DialogTitle className="sr-only">Edit Opportunity</DialogTitle>
          {editing && (
            <OpportunityWizard
              opportunity={editing}
              contacts={contacts}
              customer={customers.find((c) => c.id === editing.customerId)}
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
