'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Bell, Plus, Settings,
  Clock, User, Loader2,
  Mail, Phone, Globe, FileText, Target, ArrowLeft, Copy, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/DatePicker';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { ContactList } from '@/components/contacts/ContactList';
import { OpportunityList } from '@/components/opportunities/OpportunityList';
import { ActivitiesTabContent } from '@/components/activities/ActivitiesTabContent';
import { InvoiceList } from '@/components/invoices/InvoiceList';
import { FollowUpList } from '@/components/followups/FollowUpList';
import { Timeline } from '@/components/timeline/Timeline';
import { useCustomerStore } from '@/store/customerStore';
import { useUIStore } from '@/store/uiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useShortcutListener } from '@/hooks/useShortcuts';
import { useActivities } from '@/hooks/useActivities';
import { useFollowUps } from '@/hooks/useFollowUps';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { queryContactsByCustomer } from '@/lib/db/queries/contacts';
import { todayISO, nowDatetimeLocal, isoToDatetimeLocal, addHoursLocal } from '@/lib/utils/dateUtils';
import { getCountryCode } from '@/lib/utils/countryUtils';
import { useOpportunities } from '@/hooks/useOpportunities';
import type { Activity, ActivityStatus, Contact } from '@/types/entities';

type ProfileTab = 'overview' | 'activities' | 'contacts' | 'followups' | 'opportunities' | 'invoices';

interface CustomerDetailProps {
  customerId: string;
}

const validTabs: ProfileTab[] = ['overview', 'activities', 'contacts', 'followups', 'opportunities', 'invoices'];

export default function CustomerDetailClient({ customerId }: CustomerDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { customers } = useCustomerStore();
  const customer = customers.find((c) => c.id === customerId);

  const { activities, createActivity, editActivity, deleteActivity } = useActivities(customerId);
  const [filteredActivityCount, setFilteredActivityCount] = useState<number | null>(null);
  const { followUps, createFollowUp, completeFollowUp } = useFollowUps(customerId);
  const { opportunities: customerOpportunities } = useOpportunities(customerId);

  useEffect(() => {
    if (customer) {
      useUIStore.getState().addRecentCustomer(customerId);
    }
  }, [customerId, customer]);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const tabParam = searchParams.get('tab') as ProfileTab | null;
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'overview';
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

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
        description: editDescription.trim() || null,
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
        description: newActDescription.trim() || null,
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
        description: newFuDescription.trim() || null,
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

  const profileTabs: { key: ProfileTab; label: string; icon: typeof Settings; count?: number; disabled?: boolean }[] = useMemo(() => [
    { key: 'overview', label: 'Overview', icon: Settings },
    { key: 'activities', label: 'Activities', icon: Clock, count: filteredActivityCount ?? activities.length },
    { key: 'contacts', label: 'Contacts', icon: User, count: contacts.length },
    { key: 'followups', label: 'Follow-Ups', icon: Bell, count: followUps.length },
    { key: 'opportunities', label: 'Opportunities', icon: Target, count: customerOpportunities.length },
    { key: 'invoices', label: 'Invoices', icon: FileText, disabled: true },
  ], [activities.length, filteredActivityCount, contacts.length, followUps.length, customerOpportunities.length]);


  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Building2 size={40} className="text-muted-foreground" />
        <p className="text-muted-foreground">Customer not found</p>
        <Button variant="outline" onClick={() => router.push('/customers')}>
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
          {/* ── Back Link ── */}
          <button
            onClick={() => router.push('/customers')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            All customers
          </button>

          {/* ── Company Header ── */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex items-center gap-5 mb-3">
              {/* Company Logo */}
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-info/10 border border-border/50 flex items-center justify-center flex-shrink-0 shadow-sm"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.05, ease: 'easeOut' }}
              >
                <Building2 size={28} className="text-primary" />
              </motion.div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">
                {customer.name}
                <Badge variant={customer.status === 'active' ? 'success' : 'secondary'} className="ml-3 align-top text-xs relative -top-1">
                  {customer.status}
                </Badge>
              </h1>
            </div>

            {/* Contact Info Cards */}
            {(customer.email || customer.phone || customer.website) && (
              <div className="flex flex-wrap gap-2 mt-1">
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary hover:bg-primary/20 hover:border-primary/30 transition-colors"
                  >
                    <Mail size={13} />
                    {customer.email}
                  </a>
                )}
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-colors"
                  >
                    <Phone size={13} />
                    {customer.phone}
                  </a>
                )}
                {customer.website && (
                  <a
                    href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 hover:border-violet-500/30 transition-colors"
                  >
                    <Globe size={13} />
                    {customer.website}
                  </a>
                )}
              </div>
            )}
          </motion.div>

          {/* ── Two Column Layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
            {/* ── Left Column: Details ── */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Company Details Card */}
              <div className="bg-card rounded-xl border border-border/70 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Settings size={15} className="text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Company details</span>
                  </div>
                </div>

                <div className="divide-y divide-border/40">
                  <DetailRow label="Company Name" value={customer.name} />
                  <DetailRow label="City" value={customer.addressCity} />
                  <DetailRow label="Country" value={customer.addressCountry} />
                  <DetailRow label="Contact Address" value={customer.addressStreet} />
                  <DetailRow label="Industry" value={customer.industry} />
                  {customer.segment && (
                    <DetailRow label="Segment" value={customer.segment} />
                  )}
                  {customer.accountNumber && (
                    <DetailRow label="Account No." value={customer.accountNumber} />
                  )}
                  {customer.bcn && (
                    <DetailRow label="BCN" value={customer.bcn} />
                  )}
                  {customer.resellerId && (
                    <DetailRow label="Reseller ID" value={customer.resellerId} />
                  )}
                </div>
              </div>

              {/* Owner info */}
              {customer.ownerName && (
                <div className="bg-card rounded-xl border border-border/70 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <User size={15} className="text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">Account Owner</span>
                    </div>
                  </div>
                  <div className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                        {customer.ownerName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <span className="text-[13px] font-medium text-foreground">{customer.ownerName}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* ── Right Column: Activity ── */}
            <div>
              {/* Tab Switcher */}
              <div className="flex items-center gap-0 border-b border-border/60 mb-5">
                {profileTabs.map(({ key, label, icon: TabIcon, count, disabled }) => (
                  <button
                    key={key}
                    className={`px-3 py-2.5 text-[13px] font-medium transition-colors relative whitespace-nowrap ${
                      disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : activeTab === key
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => !disabled && setActiveTab(key)}
                    title={disabled ? 'Coming soon' : undefined}
                  >
                    <span className="flex items-center gap-1.5">
                      <TabIcon size={14} />
                      {label}
                      {count !== undefined && (
                        <span className="text-xs text-muted-foreground">({count})</span>
                      )}
                    </span>
                    {activeTab === key && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full"
                        layoutId="tab-underline"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-3 gap-4">
                      {(() => {
                        const statCards = [
                          customer.arr !== null && customer.arr !== undefined ? {
                            label: 'ARR',
                            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(customer.arr),
                          } : null,
                          { label: 'Activities', value: String(activities.length) },
                          { label: 'Open Follow-Ups', value: String(followUps.filter((f) => !f.completed).length) },
                          { label: 'Contacts', value: String(contacts.length) },
                        ].filter(Boolean) as { label: string; value: string }[];

                        return (
                          <>
                            {statCards.map((card, i) => (
                              <motion.div
                                key={card.label}
                                className="bg-card border border-border/70 rounded-xl p-4 shadow-sm"
                                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.15, delay: i * 0.03, ease: 'easeOut' }}
                              >
                                <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                                <p className="text-lg font-bold text-foreground">{card.value}</p>
                              </motion.div>
                            ))}
                          </>
                        );
                      })()}
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: 0.1, ease: 'easeOut' }}
                    >
                      <h3 className="text-base font-semibold text-foreground mb-3">Recent Activity</h3>
                      <Timeline
                        activities={activities}
                        followUps={followUps}
                        paginate
                      />
                    </motion.div>
                  </motion.div>
                )}

                {/* Activities Tab */}
                {activeTab === 'activities' && (
                  <motion.div
                    key="activities"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
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

                {/* Contacts Tab */}
                {activeTab === 'contacts' && (
                  <motion.div
                    key="contacts"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <ContactList
                      contacts={contacts}
                      customerId={customerId}
                      triggerAdd={triggerContactAdd}
                      onContactAdded={(c) => setContacts((prev) => [...prev, c])}
                      onContactUpdated={(c) => setContacts((prev) => prev.map((x) => (x.id === c.id ? c : x)))}
                      onContactDeleted={(id) => setContacts((prev) => prev.filter((x) => x.id !== id))}
                    />
                  </motion.div>
                )}

                {/* Follow-Ups Tab */}
                {activeTab === 'followups' && (
                  <motion.div
                    key="followups"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <FollowUpList followUps={followUps} customerId={customerId} onComplete={completeFollowUp} onAdd={() => setAddFollowUpOpen(true)} />
                  </motion.div>
                )}

                {/* Opportunities Tab */}
                {activeTab === 'opportunities' && (
                  <motion.div
                    key="opportunities"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <OpportunityList customerId={customerId} triggerAdd={triggerOpportunityAdd} />
                  </motion.div>
                )}

                {/* Invoices Tab */}
                {activeTab === 'invoices' && (
                  <motion.div
                    key="invoices"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <InvoiceList resellerId={customer.resellerId} countryCode={getCountryCode(customer.addressCountry)} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Edit Activity Dialog */}
              <Dialog open={!!editingActivity} onOpenChange={(open) => !open && setEditingActivity(null)}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Activity</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveActivity} className="space-y-4">
                    <div className="space-y-1">
                      <Label>Type</Label>
                      <Select value={editType} onValueChange={(v) => {
                        const newType = v as Activity['type'];
                        const wasAppt = editType === 'meeting' || editType === 'visit';
                        const isNowAppt = newType === 'meeting' || newType === 'visit';
                        setEditType(newType);
                        if (wasAppt !== isNowAppt) {
                          const now = nowDatetimeLocal();
                          setEditStartTime(now);
                          setEditOccurredAt(isNowAppt ? addHoursLocal(now, 1) : todayISO());
                        }
                      }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="visit">Visit</SelectItem>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="note">Note</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <div className="space-y-1">
                      <Label>Subject *</Label>
                      <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                      <Label>Description</Label>
                      <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
                    </div>
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
                    <div className="grid grid-cols-2 gap-3">
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
                    <div className="flex gap-3 pt-1">
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
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Activity</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateActivity} className="space-y-4">
                    <div className="space-y-1">
                      <Label>Type</Label>
                      <Select value={newActType ?? defaultActivityType} onValueChange={(v) => {
                        const newType = v as Activity['type'];
                        const prevType = newActType ?? defaultActivityType;
                        const wasAppt = prevType === 'meeting' || prevType === 'visit';
                        const isNowAppt = newType === 'meeting' || newType === 'visit';
                        setNewActType(newType);
                        if (wasAppt !== isNowAppt) {
                          const now = nowDatetimeLocal();
                          setNewActStartTime(now);
                          setNewActDate(isNowAppt ? addHoursLocal(now, 1) : todayISO());
                        }
                      }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="visit">Visit</SelectItem>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="note">Note</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <div className="space-y-1">
                      <Label>Subject *</Label>
                      <Input value={newActSubject} onChange={(e) => setNewActSubject(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                      <Label>Description</Label>
                      <Textarea value={newActDescription} onChange={(e) => setNewActDescription(e.target.value)} rows={3} />
                    </div>
                    {((newActType ?? defaultActivityType) === 'meeting' || (newActType ?? defaultActivityType) === 'visit') ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label>Start *</Label>
                          <DateTimePicker value={newActStartTime} onChange={handleNewActStartChange} />
                        </div>
                        <div className="space-y-1">
                          <Label>End *</Label>
                          <DateTimePicker value={newActDate} onChange={handleNewActEndChange} minValue={newActStartTime} />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Label>Date *</Label>
                        <DatePicker value={newActDate} onChange={setNewActDate} maxDate={new Date()} />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Contact</Label>
                        <Select value={newActContactId} onValueChange={setNewActContactId}>
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
                    <div className="flex gap-3 pt-1">
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
                      <Textarea value={newFuDescription} onChange={(e) => setNewFuDescription(e.target.value)} rows={3} />
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
          </div>
    </div>
  );
}

/* ── Detail Row ── */
interface DetailRowProps {
  label: string;
  value: string | null | undefined;
}

function DetailRow({ label, value }: DetailRowProps) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group flex items-center px-5 py-3">
      <span className="text-[13px] text-muted-foreground w-[120px] flex-shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-foreground flex-1 min-w-0 truncate">{value}</span>
      <button
        onClick={handleCopy}
        className="flex-shrink-0 ml-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-all"
        title={`Copy ${label}`}
      >
        {copied
          ? <Check size={12} className="text-emerald-500" />
          : <Copy size={12} />}
      </button>
    </div>
  );
}
