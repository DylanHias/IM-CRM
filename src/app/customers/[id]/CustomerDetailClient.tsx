'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Bell, Plus, Settings,
  Clock, User, Info, Loader2,
  Mail, Phone, Globe, FileText,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ContactList } from '@/components/contacts/ContactList';

import { TrainingList } from '@/components/trainings/TrainingList';
import { InvoiceList } from '@/components/invoices/InvoiceList';
import { FollowUpList } from '@/components/followups/FollowUpList';
import { Timeline } from '@/components/timeline/Timeline';
import { useCustomerStore } from '@/store/customerStore';
import { useActivities } from '@/hooks/useActivities';
import { useFollowUps } from '@/hooks/useFollowUps';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { queryContactsByCustomer } from '@/lib/db/queries/contacts';
import { queryTrainingsByCustomer } from '@/lib/db/queries/trainings';
import { mockContacts } from '@/lib/mock/contacts';
import { mockTrainings } from '@/lib/mock/trainings';
import { todayISO } from '@/lib/utils/dateUtils';
import { getCountryCode } from '@/lib/utils/countryUtils';
import type { Activity, Contact, Training } from '@/types/entities';

type ProfileTab = 'overview' | 'activities' | 'contacts' | 'trainings' | 'followups' | 'invoices';

export default function CustomerDetailClient() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const { customers } = useCustomerStore();
  const customer = customers.find((c) => c.id === customerId);

  const { activities, editActivity, deleteActivity } = useActivities(customerId);
  const { followUps, completeFollowUp } = useFollowUps(customerId);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editType, setEditType] = useState<Activity['type']>('meeting');
  const [editSubject, setEditSubject] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editOccurredAt, setEditOccurredAt] = useState('');
  const [editContactId, setEditContactId] = useState('none');
  const [isSavingActivity, setIsSavingActivity] = useState(false);

  const openEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setEditType(activity.type);
    setEditSubject(activity.subject);
    setEditDescription(activity.description ?? '');
    setEditOccurredAt(activity.occurredAt.split('T')[0]);
    setEditContactId(activity.contactId ?? 'none');
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity || !editSubject.trim()) return;
    setIsSavingActivity(true);
    try {
      await editActivity({
        ...editingActivity,
        type: editType,
        subject: editSubject.trim(),
        description: editDescription.trim() || null,
        occurredAt: new Date(editOccurredAt).toISOString(),
        contactId: editContactId === 'none' ? null : editContactId,
        updatedAt: new Date().toISOString(),
      });
      setEditingActivity(null);
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleDeleteActivity = async (activity: Activity) => {
    if (!confirm(`Delete "${activity.subject}"?`)) return;
    await deleteActivity(activity.id);
  };


  useEffect(() => {
    if (!customerId || customerId === '_placeholder') return;
    const load = async () => {
      if (isTauriApp()) {
        const [c, t] = await Promise.all([
          queryContactsByCustomer(customerId),
          queryTrainingsByCustomer(customerId),
        ]);
        setContacts(c);
        setTrainings(t);
      } else {
        setContacts(mockContacts.filter((c) => c.customerId === customerId));
        setTrainings(mockTrainings.filter((t) => t.customerId === customerId));
      }
    };
    load();
  }, [customerId]);

  const profileTabs: { key: ProfileTab; label: string; icon: typeof Settings; count?: number }[] = useMemo(() => [
    { key: 'overview', label: 'Overview', icon: Settings },
    { key: 'activities', label: 'Activities', icon: Clock, count: activities.length },
    { key: 'contacts', label: 'Contacts', icon: User, count: contacts.length },
    { key: 'trainings', label: 'Trainings', icon: Info, count: trainings.length },
    { key: 'followups', label: 'Follow-Ups', icon: Bell, count: followUps.length },
    { key: 'invoices', label: 'Invoices', icon: FileText },
  ], [activities.length, contacts.length, trainings.length, followUps.length]);


  if (!customer) {
    return (
      <AuthGuard>
        <AppShell title="Customer">
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Building2 size={40} className="text-muted-foreground" />
            <p className="text-muted-foreground">Customer not found</p>
            <Button variant="outline" onClick={() => router.push('/customers')}>
              Back to Customers
            </Button>
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppShell
        title="Customer Profile"
        breadcrumbs={[
          { label: 'Customers', href: '/customers' },
          { label: 'Customer profile' },
        ]}
      >
        <div className="max-w-6xl mx-auto">
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
              <h1 className="text-4xl font-bold text-foreground tracking-tight">{customer.name}</h1>
            </div>

            {/* Contact Info Cards */}
            {(customer.email || customer.phone || customer.website) && (
              <div className="flex flex-wrap gap-2 mt-1">
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/30 transition-colors"
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
          <div className="grid grid-cols-[340px_1fr] gap-6 items-start">
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
                  {customer.language && (
                    <DetailRow label="Language" value={customer.language} />
                  )}
                  {customer.segment && (
                    <DetailRow label="Segment" value={customer.segment} />
                  )}
                  {customer.accountNumber && (
                    <DetailRow label="Account No." value={customer.accountNumber} />
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
                {profileTabs.map(({ key, label, icon: TabIcon, count }) => (
                  <button
                    key={key}
                    className={`px-3 py-2.5 text-[13px] font-medium transition-colors relative whitespace-nowrap ${
                      activeTab === key
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setActiveTab(key)}
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
                          { label: 'Trainings', value: String(trainings.length) },
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
                            <motion.div
                              className="bg-card border border-border/70 rounded-xl p-4 shadow-sm"
                              initial={{ opacity: 0, y: 12, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.15, delay: statCards.length * 0.03, ease: 'easeOut' }}
                            >
                              <p className="text-xs text-muted-foreground mb-1">Status</p>
                              <Badge variant={customer.status === 'active' ? 'success' : 'secondary'} className="mt-1">
                                {customer.status}
                              </Badge>
                            </motion.div>
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
                        activities={activities.slice(0, 5)}
                        trainings={trainings.slice(0, 3)}
                        followUps={followUps.slice(0, 3)}
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
                    <div className="flex justify-end mb-3">
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => router.push(`/activities/new?customerId=${customerId}`)}
                      >
                        <Plus size={13} />
                        Add Activity
                      </Button>
                    </div>
                    <Timeline
                      activities={activities}
                      trainings={[]}
                      followUps={[]}
                      onEditActivity={openEditActivity}
                      onDeleteActivity={handleDeleteActivity}
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
                      onContactAdded={(c) => setContacts((prev) => [...prev, c])}
                      onContactUpdated={(c) => setContacts((prev) => prev.map((x) => (x.id === c.id ? c : x)))}
                      onContactDeleted={(id) => setContacts((prev) => prev.filter((x) => x.id !== id))}
                    />
                  </motion.div>
                )}

                {/* Trainings Tab */}
                {activeTab === 'trainings' && (
                  <motion.div
                    key="trainings"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <TrainingList
                      trainings={trainings}
                      customerId={customerId}
                      onTrainingAdded={(t) => setTrainings((prev) => [t, ...prev])}
                      onTrainingUpdated={(t) => setTrainings((prev) => prev.map((x) => (x.id === t.id ? t : x)))}
                      onTrainingDeleted={(id) => setTrainings((prev) => prev.filter((x) => x.id !== id))}
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
                    <FollowUpList followUps={followUps} customerId={customerId} onComplete={completeFollowUp} />
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
                      <Select value={editType} onValueChange={(v) => setEditType(v as Activity['type'])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="visit">Visit</SelectItem>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="note">Note</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Subject *</Label>
                      <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                      <Label>Description</Label>
                      <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Date *</Label>
                        <Input type="date" value={editOccurredAt} onChange={(e) => setEditOccurredAt(e.target.value)} max={todayISO()} required />
                      </div>
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
            </div>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}

/* ── Detail Row ── */
interface DetailRowProps {
  label: string;
  value: string | null | undefined;
}

function DetailRow({ label, value }: DetailRowProps) {
  if (!value) return null;
  return (
    <div className="flex items-start px-5 py-3">
      <span className="text-[13px] text-muted-foreground w-[120px] flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-[13px] font-medium text-foreground">{value}</span>
    </div>
  );
}
