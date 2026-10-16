'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { LayoutList, Columns3, Plus, Search, Target, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewBar, ViewBarSeparator, ViewBarSpacer } from '@/components/ui/view-bar';
import { FullBleed } from '@/components/ui/full-bleed';
import { CompactPager } from '@/components/ui/compact-pager';
import { Segmented } from '@/components/ui/segmented';
import { SortMenu } from '@/components/ui/sort-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { OpportunityWizard } from '@/components/opportunities/OpportunityWizard';
import type { WizardFormData } from '@/components/opportunities/OpportunityWizard';
import { CloseOpportunityDialog } from '@/components/opportunities/CloseOpportunityDialog';
import type { CloseFormData } from '@/components/opportunities/CloseOpportunityDialog';
import { OpportunityFilterPopover } from '@/components/opportunities/OpportunityFilterPopover';
import { OpportunityRow } from '@/components/opportunities/OpportunityRow';
import { OpportunityContextMenu } from '@/components/opportunities/OpportunityContextMenu';
import { OpportunityDetail } from '@/components/opportunities/OpportunityDetail';
import { PipelineBoard } from '@/components/opportunities/PipelineBoard';
import { compactMoney, oppArr, weightedValue } from '@/lib/opportunities/display';
import { cn } from '@/lib/utils';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import {
  queryAllOpportunities,
  insertOpportunity,
  updateOpportunity as dbUpdateOpportunity,
} from '@/lib/db/queries/opportunities';
import { queryAllCustomers, queryCustomerIdNameMap } from '@/lib/db/queries/customers';
import { queryContactsByCustomer } from '@/lib/db/queries/contacts';
import { directPushOpportunity } from '@/lib/sync/directPushService';
import { notifyPush } from '@/lib/sync/pushToast';
import {
  isWhaleDeal,
  whaleCelebration,
  isFirstWinOfDay,
  realisticConfetti,
  isSalesModeArmed,
  salesModeBurst,
} from '@/lib/easterEggs';
import { emitDataEvent, onDataEvent } from '@/lib/dataEvents';
import { useAuthStore } from '@/store/authStore';
import { useOpportunityListStore, type OppSortBy, type PipelineView } from '@/store/opportunityListStore';
import { usePaginationPreference } from '@/hooks/usePaginationPreference';
import { useShortcutListener } from '@/hooks/useShortcuts';
import { useUIStore } from '@/store/uiStore';
import { useD365UserId } from '@/hooks/useD365UserId';
import type { Opportunity, Contact, Customer } from '@/types/entities';
import { EMPTY_OPP_EXTRA_FIELDS } from '@/lib/opportunityRules';
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
    setCurrentUserIds,
    setPage,
    setLoading,
    getFilteredOpportunities,
    view,
    setView,
    selectedId,
    setSelectedId,
    searchQuery,
    setSearchQuery,
    sortBy,
    sortDir,
    setSortBy,
    setSortDir,
    filterMineOnly,
    toggleMineOnly,
    filterStage,
    currentUserIds,
  } = useOpportunityListStore();

  useEffect(() => {
    const ids = [d365UserId, account?.localAccountId].filter((v): v is string => Boolean(v));
    setCurrentUserIds(ids);
  }, [d365UserId, account?.localAccountId, setCurrentUserIds]);

  const { pageSize } = usePaginationPreference('opportunities', 15);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [closeOutcome, setCloseOutcome] = useState<'Won' | 'Lost' | null>(null);
  // Deal being closed from the detail pane, board or right-click menu (without the edit wizard).
  const [closing, setClosing] = useState<Opportunity | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useShortcutListener('focus-search', useCallback(() => searchRef.current?.focus(), []));
  const loadGenRef = useRef(0);

  useShortcutListener('new-item', useCallback(() => setAddOpen(true), []));

  // "New opportunity" from the quick-add menu lands here with a pending request.
  useEffect(() => {
    if (useUIStore.getState().consumeNewOpportunityRequest()) setAddOpen(true);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const gen = ++loadGenRef.current;
    try {
      if (isTauriApp()) {
        const [opps, custMap] = await Promise.all([
          queryAllOpportunities(),
          queryCustomerIdNameMap(),
        ]);
        if (gen !== loadGenRef.current) return;
        setOpportunities(opps);
        setCustomerMap(custMap);
      } else {
        if (gen !== loadGenRef.current) return;
        setOpportunities([]);
        setCustomerMap(new Map());
      }
    } catch (err) {
      console.error('[opportunity] Failed to load opportunities:', err);
      if (gen !== loadGenRef.current) return;
      setOpportunities([]);
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

  const wizardOpen = addOpen || !!editing;
  useEffect(() => {
    if (!wizardOpen) return;
    if (customers.length > 0) return;
    if (!isTauriApp()) return;
    let cancelled = false;
    (async () => {
      try {
        const custs = await queryAllCustomers();
        if (!cancelled) setCustomers(custs);
      } catch (err) {
        console.error('[opportunity] Failed to load customers:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [wizardOpen, customers.length]);

  const [wizardCustomerId, setWizardCustomerId] = useState<string | null>(null);
  const activeCustomerId = wizardCustomerId ?? editing?.customerId ?? null;
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

  // Reset wizard's tracked customer when both dialogs are closed
  useEffect(() => {
    if (!addOpen && !editing) setWizardCustomerId(null);
  }, [addOpen, editing]);

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
    secondaryOwnerId: data.secondaryOwnerId,
    secondaryOwnerName: data.secondaryOwnerName,
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
    const target = closing ?? editing;
    if (!target) return;
    const currentOpp = allOpportunities.find((o) => o.id === target.id) ?? target;
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
    setClosing(null);
    setEditing(null);

    if (data.outcome === 'Won') {
      if (isWhaleDeal(data.actualRevenue, updated.currency ?? 'USD')) {
        whaleCelebration();
      } else if (isSalesModeArmed()) {
        window.sessionStorage.removeItem('crm-easter-egg-sales-mode-armed');
        salesModeBurst();
      } else if (isFirstWinOfDay()) {
        realisticConfetti();
      }
    }
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
  const closeAs = (opp: Opportunity, outcome: 'Won' | 'Lost') => {
    setClosing(opp);
    setCloseOutcome(outcome);
  };

  const filtered = getFilteredOpportunities();
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selected = filtered.find((o) => o.id === selectedId) ?? paged[0] ?? null;
  const open = filtered.filter((o) => o.status === 'Open');
  const openValue = open.reduce((a, o) => a + (oppArr(o) ?? 0), 0);
  const weighted = open.reduce((a, o) => a + weightedValue(o), 0);
  const companyName = (o: Opportunity) => customerMap.get(o.customerId) ?? '';

  const searchBox = (
    <div className="relative min-w-0 flex-1">
      <Search size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-faint" />
      <Input
        ref={searchRef}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search deals…"
        aria-label="Search deals"
        className="pl-7 pr-7"
      />
      {searchQuery && (
        <button type="button" aria-label="Clear search" onClick={() => setSearchQuery('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X size={13} />
        </button>
      )}
    </div>
  );

  return (
    <>
      <ViewBar
        title="Pipeline"
        meta={isLoading ? undefined : `${open.length} open · ${compactMoney(openValue)} · weighted ${compactMoney(weighted)}`}
      >
        <ViewBarSeparator />
        <Segmented<PipelineView>
          aria-label="View"
          value={view}
          onChange={setView}
          options={[
            { value: 'list', label: <><LayoutList size={13} />List</> },
            { value: 'board', label: <><Columns3 size={13} />Board</> },
          ]}
        />
        <Button
          variant="outline"
          aria-pressed={filterMineOnly}
          disabled={currentUserIds.length === 0}
          onClick={toggleMineOnly}
          title="Show only opportunities you created"
          className={cn(filterMineOnly && 'border-primary/40 bg-accent text-accent-foreground hover:bg-accent')}
        >
          <User size={14} />
          Mine
        </Button>
        <OpportunityFilterPopover />
        <ViewBarSpacer />
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={14} />
          New opportunity
        </Button>
      </ViewBar>

      <FullBleed data-tour="page-opportunities">
        {view === 'board' ? (
          <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
            <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2">
              <div className="flex w-[280px]">{searchBox}</div>
            </div>
            <PipelineBoard opportunities={filtered} customerMap={customerMap} onOpen={openEdit} onCloseAs={closeAs} stage={filterStage} />
          </div>
        ) : (
          <div className="grid h-full grid-cols-[320px_minmax(0,1fr)]">
            <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden border-r border-border bg-card">
              <div className="flex items-center gap-1 border-b border-border p-2">
                {searchBox}
                <SortMenu<OppSortBy>
                  aria-label="Sort opportunities"
                  options={[
                    { value: 'createdAt', label: 'Created' },
                    { value: 'subject', label: 'Subject' },
                    { value: 'estimatedRevenue', label: 'Revenue' },
                    { value: 'expirationDate', label: 'Expiration' },
                    { value: 'stage', label: 'Stage' },
                  ]}
                  value={sortBy}
                  dir={sortDir}
                  onChange={setSortBy}
                  onDirChange={setSortDir}
                />
              </div>
              <div className="min-h-0 overflow-y-auto">
                {isLoading ? (
                  <div className="grid">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-2.5 border-t border-border px-3 py-3 first:border-t-0">
                        <Skeleton className="size-7 rounded-[7px]" />
                        <div className="grid flex-1 gap-1.5">
                          <Skeleton className="h-3 w-2/3" />
                          <Skeleton className="h-2.5 w-full" />
                          <Skeleton className="h-4 w-20 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : paged.length === 0 ? (
                  <EmptyState icon={Target} title="No opportunities found" description="Try adjusting your search or filters" />
                ) : (
                  <div role="listbox" aria-label="Opportunities" className="stagger-in grid">
                    {paged.map((o) => (
                      <OpportunityContextMenu key={o.id} opportunity={o} onOpen={() => openEdit(o)} onCloseAs={(out) => closeAs(o, out)}>
                        <OpportunityRow
                          opportunity={o}
                          companyName={companyName(o)}
                          selected={selected?.id === o.id}
                          onClick={() => setSelectedId(o.id)}
                          onDoubleClick={() => openEdit(o)}
                        />
                      </OpportunityContextMenu>
                    ))}
                  </div>
                )}
              </div>
              <CompactPager page={safePage} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
            </div>
            <div className="min-h-0 min-w-0 overflow-y-auto">
              {selected && (
                <OpportunityDetail
                  key={selected.id}
                  opportunity={selected}
                  companyName={companyName(selected)}
                  onEdit={() => openEdit(selected)}
                  onCloseAs={(out) => closeAs(selected, out)}
                />
              )}
            </div>
          </div>
        )}
      </FullBleed>

      <Dialog open={addOpen} onOpenChange={(isOpen) => { setAddOpen(isOpen); }}>
        <DialogContent className="sm:max-w-[1000px] h-[min(760px,90vh)] p-0 gap-0 overflow-hidden">
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

      <Dialog open={!!editing} onOpenChange={(isOpen) => { if (!isOpen) setEditing(null); }}>
        <DialogContent className="sm:max-w-[1000px] h-[min(760px,90vh)] p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">Edit Opportunity</DialogTitle>
          {editing && (
            <OpportunityWizard
              opportunity={editing}
              customers={customers}
              contacts={contacts}
              onSave={handleEdit}
              onCustomerChange={setWizardCustomerId}
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
        currency={(closing ?? editing)?.currency ?? 'USD'}
        onClose={() => {
          setCloseOutcome(null);
          setClosing(null);
        }}
        onConfirm={handleClose}
      />
    </>
  );
}
