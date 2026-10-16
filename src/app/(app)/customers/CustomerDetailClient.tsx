'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { underlineSpring, tabPanelMotion } from '@/lib/motion';
import {
  Building2, Plus, Clock, Loader2, Mail, Phone, Globe, ArrowLeft, ExternalLink, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ActivityTypePicker } from '@/components/activities/ActivityTypePicker';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { htmlIsEmpty } from '@/lib/utils/htmlUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/DatePicker';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { ContactList } from '@/components/contacts/ContactList';
import { OpportunityList } from '@/components/opportunities/OpportunityList';
import { CustomerDetailsTab } from '@/components/customers/CustomerDetailsTab';
import { Panel, PanelHeader, PanelBody, PanelLink } from '@/components/ui/panel';
import { EmptyState } from '@/components/ui/empty-state';
import { ActivitiesTabContent } from '@/components/activities/ActivitiesTabContent';
import { RevenueTabContent } from '@/components/customers/revenue/RevenueTabContent';
import { FollowUpList } from '@/components/followups/FollowUpList';
import { Timeline } from '@/components/timeline/Timeline';
import { useCustomerStore } from '@/store/customerStore';
import { useUIStore } from '@/store/uiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useShortcutListener } from '@/hooks/useShortcuts';
import { useActivities } from '@/hooks/useActivities';
import { useFollowUps } from '@/hooks/useFollowUps';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { queryContactsByCustomer, setPrimaryContact } from '@/lib/db/queries/contacts';
import { directPushPrimaryContact } from '@/lib/sync/directPushService';
import { todayISO, nowDatetimeLocal, isoToDatetimeLocal, addHoursLocal } from '@/lib/utils/dateUtils';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useCustomerRevenue } from '@/hooks/useCustomerRevenue';
import { getEffectiveArr } from '@/lib/revenue/effectiveArr';
import { d365RecordUrl } from '@/lib/d365/recordUrl';
import { openExternal } from '@/lib/utils/openExternal';
import { cn } from '@/lib/utils';
import { scoreHealth, healthTier, healthTierLabel, healthTierBadgeVariant } from '@/lib/customers/healthScore';
import type { Activity, ActivityStatus, Contact } from '@/types/entities';

type ProfileTab = 'overview' | 'activities' | 'contacts' | 'followups' | 'opportunities' | 'revenue' | 'details';

interface CustomerDetailProps {
  customerId: string;
  /** Add the customer to the sidebar's Recent list (only when the user opened it explicitly). */
  trackRecent?: boolean;
}

const validTabs: ProfileTab[] = ['overview', 'activities', 'contacts', 'followups', 'opportunities', 'revenue', 'details'];

export default function CustomerDetailClient({ customerId, trackRecent = true }: CustomerDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { customers } = useCustomerStore();
  const customer = customers.find((c) => c.id === customerId);

  const { activities, createActivity, editActivity, deleteActivity } = useActivities(customerId);
  const [filteredActivityCount, setFilteredActivityCount] = useState<number | null>(null);
  const { followUps, createFollowUp, completeFollowUp } = useFollowUps(customerId);
  const { opportunities: customerOpportunities } = useOpportunities(customerId);
  const revenue = useCustomerRevenue(customer?.bcn, customer?.accountNumber);

  useEffect(() => {
    if (customer && trackRecent) {
      useUIStore.getState().addRecentCustomer(customerId);
    }
  }, [customerId, customer, trackRecent]);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const tabParam = searchParams.get('tab') as ProfileTab | null;
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'overview';
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // "Add …" from the customer right-click menu arrives as ?action=…
  const actionParam = searchParams.get('action');
  const actionActivityId = searchParams.get('activityId');
  const handledEditRef = useRef<string | null>(null);
  useEffect(() => {
    if (actionParam !== 'edit-activity' || !actionActivityId || handledEditRef.current === actionActivityId) return;
    const target = activities.find((a) => a.id === actionActivityId);
    if (!target) return;
    handledEditRef.current = actionActivityId;
    openEditActivity(target);
    // openEditActivity only sets state; it is recreated every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionParam, actionActivityId, activities]);
  useEffect(() => {
    if (actionParam === 'activity') setAddActivityOpen(true);
    else if (actionParam === 'followup') setAddFollowUpOpen(true);
    else if (actionParam === 'opportunity') {
      setActiveTab('opportunities');
      setTriggerOpportunityAdd((n) => n + 1);
    }
  }, [actionParam]);

  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editType, setEditType] = useState<Activity['type']>('meeting');
  const [editSubject, setEditSubject] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editOccurredAt, setEditOccurredAt] = useState('');
  const [editDirection, setEditDirection] = useState<'outgoing' | 'incoming'>('outgoing');
  const [editContactId, setEditContactId] = useState('none');
  const [isSavingActivity, setIsSavingActivity] = useState(false);

  const defaultActivityType = useSettingsStore((s) => s.defaultActivityType);

  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [newActType, setNewActType] = useState<Activity['type'] | null>(null);
  const [newActSubject, setNewActSubject] = useState('');
  const [newActDescription, setNewActDescription] = useState('');
  const [newActStartTime, setNewActStartTime] = useState(nowDatetimeLocal);
  const [newActDate, setNewActDate] = useState(() => {
    const isAppt = defaultActivityType === 'meeting' || defaultActivityType === 'visit';
    return isAppt ? addHoursLocal(nowDatetimeLocal(), 1) : todayISO();
  });
  const [newActDirection, setNewActDirection] = useState<'outgoing' | 'incoming'>('outgoing');
  const [newActContactId, setNewActContactId] = useState('none');
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);

  const handleNewActStartChange = (newStart: string) => {
    setNewActStartTime(newStart);
    if (new Date(newStart) >= new Date(newActDate)) {
      setNewActDate(addHoursLocal(newStart, 1));
    }
  };

  const handleNewActEndChange = (newEnd: string) => {
    if (new Date(newEnd) < new Date(newActStartTime)) return;
    setNewActDate(newEnd);
  };

  const handleEditStartChange = (newStart: string) => {
    setEditStartTime(newStart);
    if (new Date(newStart) >= new Date(editOccurredAt)) {
      setEditOccurredAt(addHoursLocal(newStart, 1));
    }
  };

  const handleEditEndChange = (newEnd: string) => {
    if (new Date(newEnd) < new Date(editStartTime)) return;
    setEditOccurredAt(newEnd);
  };

  const [addFollowUpOpen, setAddFollowUpOpen] = useState(false);

  const [triggerContactAdd, setTriggerContactAdd] = useState(0);
  const [triggerOpportunityAdd, setTriggerOpportunityAdd] = useState(0);

  useShortcutListener('new-item', useCallback(() => {
    switch (activeTab) {
      case 'overview':
      case 'activities':
        setAddActivityOpen(true);
        break;
      case 'contacts':
        setTriggerContactAdd((n) => n + 1);
        break;
      case 'followups':
        setAddFollowUpOpen(true);
        break;
      case 'opportunities':
        setTriggerOpportunityAdd((n) => n + 1);
        break;
    }
  }, [activeTab]));
  const [newFuTitle, setNewFuTitle] = useState('');
  const [newFuDescription, setNewFuDescription] = useState('');
  const [newFuDueDate, setNewFuDueDate] = useState('');
  const [isCreatingFollowUp, setIsCreatingFollowUp] = useState(false);

  const openEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setEditType(activity.type);
    setEditSubject(activity.subject);
    setEditDescription(activity.description ?? '');
    const isAppt = activity.type === 'meeting' || activity.type === 'visit';
    setEditStartTime(activity.startTime ? isoToDatetimeLocal(activity.startTime) : nowDatetimeLocal());
    setEditOccurredAt(isAppt ? isoToDatetimeLocal(activity.occurredAt) : activity.occurredAt.split('T')[0]);
    setEditDirection(activity.direction ?? 'outgoing');
    setEditContactId(activity.contactId ?? 'none');
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity || !editSubject.trim()) return;
    setIsSavingActivity(true);
    try {
      const isAppt = editType === 'meeting' || editType === 'visit';
      await editActivity({
        ...editingActivity,
        type: editType,
        subject: editSubject.trim(),
        description: htmlIsEmpty(editDescription) ? null : editDescription,
        occurredAt: new Date(editOccurredAt).toISOString(),
        startTime: isAppt ? new Date(editStartTime).toISOString() : null,
        contactId: editContactId === 'none' ? null : editContactId,
        direction: editType === 'call' ? editDirection : null,
        updatedAt: new Date().toISOString(),
      });
      setEditingActivity(null);
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleDeleteActivity = async (activity: Activity) => {
    await deleteActivity(activity.id);
  };

  const handleStatusChange = async (activity: Activity, newStatus: ActivityStatus) => {
    await editActivity({
      ...activity,
      activityStatus: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActSubject.trim()) return;
    setIsCreatingActivity(true);
    try {
      const actType = newActType ?? defaultActivityType;
      const isAppt = actType === 'meeting' || actType === 'visit';
      await createActivity({
        customerId,
        contactId: newActContactId === 'none' ? null : newActContactId,
        type: actType,
        subject: newActSubject.trim(),
        description: htmlIsEmpty(newActDescription) ? null : newActDescription,
        occurredAt: new Date(newActDate).toISOString(),
        startTime: isAppt ? new Date(newActStartTime).toISOString() : null,
        activityStatus: 'open',
        direction: actType === 'call' ? newActDirection : null,
      });
      setAddActivityOpen(false);
      setNewActType(null);
      setNewActSubject('');
      setNewActDescription('');
      const now = nowDatetimeLocal();
      setNewActStartTime(now);
      const resetIsAppt = defaultActivityType === 'meeting' || defaultActivityType === 'visit';
      setNewActDate(resetIsAppt ? addHoursLocal(now, 1) : todayISO());
      setNewActDirection('outgoing');
      setNewActContactId('none');
    } finally {
      setIsCreatingActivity(false);
    }
  };

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFuTitle.trim() || !newFuDueDate) return;
    setIsCreatingFollowUp(true);
    try {
      await createFollowUp({
        customerId,
        activityId: null,
        title: newFuTitle.trim(),
        description: htmlIsEmpty(newFuDescription) ? null : newFuDescription,
        dueDate: newFuDueDate,
      });
      setAddFollowUpOpen(false);
      setNewFuTitle('');
      setNewFuDescription('');
      setNewFuDueDate('');
    } finally {
      setIsCreatingFollowUp(false);
    }
  };

  useEffect(() => {
    if (!customerId || customerId === '_placeholder') return;
    const load = async () => {
      try {
        if (isTauriApp()) {
          const c = await queryContactsByCustomer(customerId);
          setContacts(c);
        } else {
          setContacts([]);
        }
      } catch (err) {
        console.error('[customer] Failed to load detail data:', err);
        setContacts([]);
      }
    };
    load();
  }, [customerId]);

  const handlePrimaryChanged = useCallback(async (contactId: string) => {
    if (!isTauriApp()) return;
    try {
      await setPrimaryContact(contactId, customerId);
      const updated = contacts.map((c) => ({ ...c, isPrimary: c.id === contactId }));
      setContacts(updated);
      useCustomerStore.getState().setAllContacts(
        useCustomerStore.getState().allContacts.map((c) =>
          c.customerId === customerId ? { ...c, isPrimary: c.id === contactId } : c,
        ),
      );
      const contact = updated.find((c) => c.id === contactId);
      if (!contact?.remoteId) {
        console.warn('[contact] Primary contact push skipped: contact not yet synced to D365');
        toast.info('Primary contact saved locally. Will sync to D365 once the contact itself syncs.');
        return;
      }
      const pushResult = await directPushPrimaryContact(customerId, contact.remoteId);
      if (!pushResult.success) {
        console.error('[contact] D365 primary contact push failed:', pushResult.error);
        toast.error(`Could not update primary contact in D365: ${pushResult.error}`);
      }
    } catch (err) {
      console.error('[contact] Failed to set primary contact:', err);
      toast.error('Failed to set primary contact');
    }
  }, [contacts, customerId]);

  const profileTabs: { key: ProfileTab; label: string; count?: number }[] = useMemo(() => [
    { key: 'overview', label: 'Overview' },
    { key: 'activities', label: 'Activities', count: filteredActivityCount ?? activities.length },
    { key: 'contacts', label: 'Contacts', count: contacts.length },
    { key: 'followups', label: 'Follow-Ups', count: followUps.filter((f) => !f.completed).length },
    { key: 'opportunities', label: 'Opportunities', count: customerOpportunities.length },
    { key: 'revenue', label: 'Revenue' },
    { key: 'details', label: 'Details' },
  ], [activities.length, filteredActivityCount, contacts.length, followUps, customerOpportunities.length]);


  if (!customer) {
    return (
      <div className="grid h-full place-content-center gap-3.5">
        <EmptyState
          icon={Building2}
          title="Customer not found"
          description="It may have been removed in Dynamics 365, or it isn't synced to this device yet."
        />
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => router.push('/customers')}>
            <ArrowLeft size={13} />
            Back to customers
          </Button>
          <Button onClick={() => window.dispatchEvent(new CustomEvent('shortcut:sync'))}>
            <RefreshCw size={13} />
            Run sync
          </Button>
        </div>
      </div>
    );
  }

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
  const nowIso = new Date().toISOString();
  const openOpportunities = customerOpportunities.filter((o) => o.status === 'Open');
  const health = scoreHealth({
    lastActivityAt: customer.lastActivityAt,
    openOpportunityCount: openOpportunities.length,
    activityCountLast90Days: activities.filter((a) => a.occurredAt >= ninetyDaysAgo && a.occurredAt <= nowIso).length,
  });
  const tier = healthTier(health.total);
  const tierColor = { success: 'text-success', warning: 'text-warning', destructive: 'text-destructive' }[healthTierBadgeVariant(tier)];
  const arr = getEffectiveArr(customer, revenue);
  const d365Url = d365RecordUrl('account', customer.id);
  const primaryContact = contacts.find((c) => c.isPrimary) ?? null;

  const copyValue = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Copied ${label}`);
    } catch (err) {
      console.error('[customer] Failed to copy:', err);
    }
  };

  const linkClass = 'inline-flex h-6 items-center gap-1.5 rounded-md px-1.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-sunken hover:text-foreground';

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_auto_auto_minmax(0,1fr)] overflow-hidden">
      {/* ── Header ── */}
      <div data-tour="customer-detail" className="flex flex-wrap items-center gap-3 bg-card px-4 pb-3 pt-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-[9px] border border-primary/30 bg-accent text-[15px] font-semibold text-accent-foreground">
          {customer.name.split(/\s+/).filter((w) => /[A-Za-zÀ-ÿ0-9]/.test(w[0] ?? '')).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
        </span>
        <div className="grid min-w-[200px] flex-1 gap-1">
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-[-0.015em]">
            {customer.name}
            <Badge variant={customer.status === 'active' ? 'success' : 'secondary'}>
              {customer.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </h2>
          {(customer.email || customer.phone || customer.website) && (
            <div className="-ml-1.5 flex flex-wrap gap-x-1 gap-y-0.5">
              {customer.email && (
                <button type="button" className={linkClass} title="Copy email" onClick={() => copyValue('email', customer.email ?? '')}>
                  <Mail size={12} />
                  {customer.email}
                </button>
              )}
              {customer.phone && (
                <button type="button" className={linkClass} title="Copy phone" onClick={() => copyValue('phone', customer.phone ?? '')}>
                  <Phone size={12} />
                  {customer.phone}
                </button>
              )}
              {customer.website && (
                <button
                  type="button"
                  className={linkClass}
                  title="Open website"
                  onClick={() => openExternal(customer.website?.startsWith('http') ? customer.website : `https://${customer.website}`)}
                >
                  <Globe size={12} />
                  {customer.website.replace(/^https?:\/\//, '')}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={!d365Url}
            onClick={() => d365Url && openExternal(d365Url)}
            title="Open in Dynamics 365"
          >
            <ExternalLink size={13} />
            Open in Dynamics
          </Button>
          <Button variant="outline" onClick={() => setAddFollowUpOpen(true)}>
            <Clock size={13} />
            Follow-up
          </Button>
          <Button onClick={() => setAddActivityOpen(true)}>
            <Plus size={13} />
            Log activity
          </Button>
        </div>
      </div>

      {/* ── Key numbers ── */}
      <div className="grid grid-cols-5 divide-x divide-border border-t border-border bg-card max-md:grid-cols-3">
        <div className="grid min-w-0 px-4 pb-2.5 pt-2" title={`Recency ${health.recency} · Pipeline ${health.pipeline} · Frequency ${health.frequency}`}>
          <span className="text-[11px] text-muted-foreground">Health</span>
          <span className={cn('text-base font-semibold tabular-nums', tierColor)}>
            {health.total} · {healthTierLabel(tier)}
          </span>
        </div>
        <Stat label="ARR" value={arr.value !== null ? formatEur(arr.value) : '—'} />
        <Stat label="Activities" value={activities.length} />
        <Stat label="Open follow-ups" value={followUps.filter((f) => !f.completed).length} />
        <Stat label="Contacts" value={contacts.length} />
      </div>

      {/* ── Tabs ── */}
      <div role="tablist" className="flex gap-0.5 overflow-x-auto border-y border-border bg-card px-2.5 [scrollbar-width:none]">
        {profileTabs.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            data-tour={`tab-${key}`}
            onClick={() => setActiveTab(key)}
            className={cn(
              'relative -mb-px flex items-center gap-1.5 whitespace-nowrap px-2 pb-2 pt-2.5 text-[13px] font-medium transition-colors',
              activeTab === key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
            {count !== undefined && <span className="text-[10.5px] tabular-nums text-faint">{count}</span>}
            {activeTab === key && (
              <motion.span layoutId="customer-tab-underline" transition={underlineSpring} className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab body ── */}
      <div className="min-h-0 overflow-y-auto">
        <div className="grid content-start gap-3 px-4 pb-7 pt-3.5">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" {...tabPanelMotion} className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <Panel>
                  <PanelHeader title="Recent activity">
                    <PanelLink onClick={() => setActiveTab('activities')}>All activities</PanelLink>
                  </PanelHeader>
                  <PanelBody>
                    <Timeline activities={activities} followUps={followUps} paginate />
                  </PanelBody>
                </Panel>
                <div className="grid gap-3">
                  <Panel>
                    <PanelHeader title="Primary contact">
                      <PanelLink onClick={() => setActiveTab('contacts')}>All contacts</PanelLink>
                    </PanelHeader>
                    <PanelBody>
                      {primaryContact ? (
                        <div className="grid gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="grid size-[26px] shrink-0 place-items-center rounded-full border border-primary/30 bg-accent text-[10.5px] font-semibold text-accent-foreground">
                              {(primaryContact.firstName[0] ?? '') + (primaryContact.lastName[0] ?? '')}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate font-medium">{primaryContact.firstName} {primaryContact.lastName}</div>
                              {primaryContact.jobTitle && <div className="truncate text-xs text-muted-foreground">{primaryContact.jobTitle}</div>}
                            </div>
                          </div>
                          <div className="grid gap-0.5 text-xs">
                            {primaryContact.email && (
                              <button type="button" className="flex items-center gap-1.5 text-left text-accent-foreground hover:underline" onClick={() => copyValue('email', primaryContact.email ?? '')}>
                                <Mail size={11} /> {primaryContact.email}
                              </button>
                            )}
                            {(primaryContact.phone || primaryContact.mobile) && (
                              <button type="button" className="flex items-center gap-1.5 text-left hover:underline" onClick={() => copyValue('phone', primaryContact.phone ?? primaryContact.mobile ?? '')}>
                                <Phone size={11} /> {primaryContact.phone ?? primaryContact.mobile}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No primary contact yet.</span>
                      )}
                    </PanelBody>
                  </Panel>
                  <Panel>
                    <PanelHeader title="Open opportunities" sub={openOpportunities.length} />
                    {openOpportunities.length === 0 ? (
                      <PanelBody className="text-xs text-muted-foreground">None open.</PanelBody>
                    ) : (
                      <ul>
                        {openOpportunities.map((o) => (
                          <li key={o.id} className="border-t border-border first:border-t-0">
                            <button type="button" onClick={() => setActiveTab('opportunities')} className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-2">
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[13px] font-medium">{o.subject}</div>
                                <div className="truncate text-xs text-muted-foreground">{o.stage} · {o.probability}%</div>
                              </div>
                              {o.estimatedRevenue != null && <span className="whitespace-nowrap font-semibold tabular-nums">{formatEur(o.estimatedRevenue)}</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Panel>
                </div>
              </motion.div>
            )}

            {activeTab === 'activities' && (
              <motion.div key="activities" {...tabPanelMotion}>
                <ActivitiesTabContent
                  activities={activities}
                  contacts={contacts}
                  onAddActivity={() => setAddActivityOpen(true)}
                  onEditActivity={openEditActivity}
                  onDeleteActivity={handleDeleteActivity}
                  onStatusChange={handleStatusChange}
                  onFilteredCountChange={setFilteredActivityCount}
                />
              </motion.div>
            )}

            {activeTab === 'contacts' && (
              <motion.div key="contacts" {...tabPanelMotion}>
                <ContactList
                  contacts={contacts}
                  customerId={customerId}
                  triggerAdd={triggerContactAdd}
                  onContactAdded={(c) => setContacts((prev) => [...prev, c])}
                  onContactUpdated={(c) => setContacts((prev) => prev.map((x) => (x.id === c.id ? c : x)))}
                  onContactDeleted={(id) => setContacts((prev) => prev.filter((x) => x.id !== id))}
                  onPrimaryChanged={handlePrimaryChanged}
                />
              </motion.div>
            )}

            {activeTab === 'followups' && (
              <motion.div key="followups" {...tabPanelMotion}>
                <FollowUpList followUps={followUps} customerId={customerId} onComplete={completeFollowUp} onAdd={() => setAddFollowUpOpen(true)} />
              </motion.div>
            )}

            {activeTab === 'opportunities' && (
              <motion.div key="opportunities" {...tabPanelMotion}>
                <OpportunityList customerId={customerId} triggerAdd={triggerOpportunityAdd} />
              </motion.div>
            )}

            {activeTab === 'revenue' && (
              <motion.div key="revenue" {...tabPanelMotion}>
                <RevenueTabContent customer={customer} />
              </motion.div>
            )}

            {activeTab === 'details' && (
              <motion.div key="details" {...tabPanelMotion}>
                <CustomerDetailsTab customer={customer} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    {/* Edit Activity Dialog */}
    <Dialog open={!!editingActivity} onOpenChange={(open) => !open && setEditingActivity(null)}>
      <DialogContent className="sm:max-w-[80vw] w-[80vw] h-[80vh] max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Activity</DialogTitle>
          <DialogDescription>{customer.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveActivity} className="flex flex-col flex-1 min-h-0 gap-4">
          <div className="grid grid-cols-[3fr_7fr] gap-4 flex-1 min-h-0">
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Type</Label>
                <ActivityTypePicker value={editType} onChange={(newType) => {
                  const wasAppt = editType === 'meeting' || editType === 'visit';
                  const isNowAppt = newType === 'meeting' || newType === 'visit';
                  setEditType(newType);
                  if (wasAppt !== isNowAppt) {
                    const now = nowDatetimeLocal();
                    setEditStartTime(now);
                    setEditOccurredAt(isNowAppt ? addHoursLocal(now, 1) : todayISO());
                  }
                }} />
              </div>
              {editType === 'call' && (
                <div className="space-y-1">
                  <Label>Direction</Label>
                  <Select value={editDirection} onValueChange={(v) => setEditDirection(v as 'outgoing' | 'incoming')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outgoing">Outgoing</SelectItem>
                      <SelectItem value="incoming">Incoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(editType === 'meeting' || editType === 'visit') ? (
                <>
                  <div className="space-y-1">
                    <Label>Start *</Label>
                    <DateTimePicker value={editStartTime} onChange={handleEditStartChange} />
                  </div>
                  <div className="space-y-1">
                    <Label>End *</Label>
                    <DateTimePicker value={editOccurredAt} onChange={handleEditEndChange} minValue={editStartTime} />
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <Label>Date *</Label>
                  <DatePicker value={editOccurredAt} onChange={setEditOccurredAt} maxDate={new Date()} />
                </div>
              )}
              <div className="space-y-1">
                <Label>Contact</Label>
                <Select value={editContactId} onValueChange={setEditContactId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No contact</SelectItem>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-4 min-h-0">
              <div className="space-y-1">
                <Label>Subject *</Label>
                <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} required />
              </div>
              <div className="space-y-1 flex flex-col flex-1 min-h-0">
                <Label>Description</Label>
                {editType === 'call' ? (
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="resize-none flex-1 min-h-0 overflow-y-auto"
                  />
                ) : (
                  <RichTextEditor
                    value={editDescription}
                    onChange={setEditDescription}
                    className="flex-1 min-h-0"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-1 flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => setEditingActivity(null)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isSavingActivity || !editSubject.trim()} className="flex-1">
              {isSavingActivity ? <><Loader2 size={15} className="animate-spin mr-2" />Saving...</> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Add Activity Dialog */}
    <Dialog open={addActivityOpen} onOpenChange={setAddActivityOpen}>
      <DialogContent className="sm:max-w-[80vw] w-[80vw] h-[80vh] max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add Activity</DialogTitle>
          <DialogDescription>{customer.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateActivity} className="flex flex-col flex-1 min-h-0 gap-4">
          <div className="grid grid-cols-[3fr_7fr] gap-4 flex-1 min-h-0">
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Type</Label>
                <ActivityTypePicker value={newActType ?? defaultActivityType} onChange={(newType) => {
                  const prevType = newActType ?? defaultActivityType;
                  const wasAppt = prevType === 'meeting' || prevType === 'visit';
                  const isNowAppt = newType === 'meeting' || newType === 'visit';
                  setNewActType(newType);
                  if (wasAppt !== isNowAppt) {
                    const now = nowDatetimeLocal();
                    setNewActStartTime(now);
                    setNewActDate(isNowAppt ? addHoursLocal(now, 1) : todayISO());
                  }
                }} />
              </div>
              {(newActType ?? defaultActivityType) === 'call' && (
                <div className="space-y-1">
                  <Label>Direction</Label>
                  <Select value={newActDirection} onValueChange={(v) => setNewActDirection(v as 'outgoing' | 'incoming')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outgoing">Outgoing</SelectItem>
                      <SelectItem value="incoming">Incoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {((newActType ?? defaultActivityType) === 'meeting' || (newActType ?? defaultActivityType) === 'visit') ? (
                <>
                  <div className="space-y-1">
                    <Label>Start *</Label>
                    <DateTimePicker value={newActStartTime} onChange={handleNewActStartChange} />
                  </div>
                  <div className="space-y-1">
                    <Label>End *</Label>
                    <DateTimePicker value={newActDate} onChange={handleNewActEndChange} minValue={newActStartTime} />
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <Label>Date *</Label>
                  <DatePicker value={newActDate} onChange={setNewActDate} maxDate={new Date()} />
                </div>
              )}
              <div className="space-y-1">
                <Label>Contact</Label>
                <Combobox
                  value={newActContactId}
                  onValueChange={setNewActContactId}
                  searchPlaceholder="Search contacts..."
                  emptyText="No contacts found."
                  options={[
                    { value: 'none', label: 'No contact' },
                    ...contacts.map((c) => ({
                      value: c.id,
                      label: `${c.firstName} ${c.lastName}`,
                    })),
                  ]}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 min-h-0">
              <div className="space-y-1">
                <Label>Subject *</Label>
                <Input value={newActSubject} onChange={(e) => setNewActSubject(e.target.value)} required />
              </div>
              <div className="space-y-1 flex flex-col flex-1 min-h-0">
                <Label>Description</Label>
                {(newActType ?? defaultActivityType) === 'call' ? (
                  <Textarea
                    value={newActDescription}
                    onChange={(e) => setNewActDescription(e.target.value)}
                    className="resize-none flex-1 min-h-0 overflow-y-auto"
                  />
                ) : (
                  <RichTextEditor
                    value={newActDescription}
                    onChange={setNewActDescription}
                    className="flex-1 min-h-0"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-1 flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => setAddActivityOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isCreatingActivity || !newActSubject.trim()} className="flex-1">
              {isCreatingActivity ? <><Loader2 size={15} className="animate-spin mr-2" />Saving...</> : 'Add Activity'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Add Follow-Up Dialog */}
    <Dialog open={addFollowUpOpen} onOpenChange={setAddFollowUpOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Follow-Up</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateFollowUp} className="space-y-4">
          <div className="space-y-1">
            <Label>Title *</Label>
            <Input value={newFuTitle} onChange={(e) => setNewFuTitle(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              value={newFuDescription}
              onChange={(e) => setNewFuDescription(e.target.value)}
              rows={7}
              className="min-h-[180px] resize-y"
            />
          </div>
          <div className="space-y-1">
            <Label>Due Date *</Label>
            <DatePicker value={newFuDueDate} onChange={setNewFuDueDate} placeholder="Select due date" />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setAddFollowUpOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isCreatingFollowUp || !newFuTitle.trim() || !newFuDueDate} className="flex-1">
              {isCreatingFollowUp ? <><Loader2 size={15} className="animate-spin mr-2" />Saving...</> : 'Add Follow-Up'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid min-w-0 px-4 pb-2.5 pt-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="truncate text-base font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function formatEur(value: number): string {
  return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}
