'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, MapPin, Phone, Mail, Globe, Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactList } from '@/components/contacts/ContactList';
import { ActivityList } from '@/components/activities/ActivityList';
import { TrainingList } from '@/components/trainings/TrainingList';
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
import type { Contact, Training } from '@/types/entities';

export default function CustomerDetailClient() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const { customers } = useCustomerStore();
  const customer = customers.find((c) => c.id === customerId);

  const { activities } = useActivities(customerId);
  const { followUps, completeFollowUp } = useFollowUps(customerId);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [tab, setTab] = useState('timeline');

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
      <AppShell title={customer.name}>
        <div className="max-w-5xl mx-auto space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5" onClick={() => router.back()}>
              <ArrowLeft size={16} />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{customer.name}</h2>
                <Badge variant={customer.status === 'active' ? 'success' : 'secondary'}>
                  {customer.status}
                </Badge>
                {customer.segment && (
                  <Badge variant="outline">{customer.segment}</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 flex-wrap text-sm text-muted-foreground">
                {customer.industry && <span>{customer.industry}</span>}
                {customer.addressCity && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {customer.addressCity}, {customer.addressCountry}
                  </span>
                )}
                {customer.ownerName && <span>Owner: {customer.ownerName}</span>}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => router.push(`/activities/new?customerId=${customerId}`)}
              >
                <Plus size={13} />
                Log Activity
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => router.push(`/followups/new?customerId=${customerId}`)}
              >
                <Plus size={13} />
                Follow-Up
              </Button>
            </div>
          </div>

          {/* Quick info card */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                <Phone size={13} className="text-blue-500" />
                {customer.phone}
              </a>
            )}
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                <Mail size={13} className="text-blue-500" />
                {customer.email}
              </a>
            )}
            {customer.website && (
              <a href={customer.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                <Globe size={13} className="text-blue-500" />
                Website
              </a>
            )}
            {customer.accountNumber && (
              <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm text-slate-500">
                <Building2 size={13} />
                {customer.accountNumber}
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="activities">Activities ({activities.length})</TabsTrigger>
              <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
              <TabsTrigger value="trainings">Trainings ({trainings.length})</TabsTrigger>
              <TabsTrigger value="followups">Follow-Ups ({followUps.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <Timeline activities={activities} trainings={trainings} followUps={followUps} />
            </TabsContent>

            <TabsContent value="activities" className="mt-4">
              <ActivityList activities={activities} contacts={contacts} customerId={customerId} />
            </TabsContent>

            <TabsContent value="contacts" className="mt-4">
              <ContactList contacts={contacts} customerId={customerId} onContactAdded={(c) => setContacts((prev) => [...prev, c])} />
            </TabsContent>

            <TabsContent value="trainings" className="mt-4">
              <TrainingList
                trainings={trainings}
                customerId={customerId}
                onTrainingAdded={(t) => setTrainings((prev) => [t, ...prev])}
              />
            </TabsContent>

            <TabsContent value="followups" className="mt-4">
              <FollowUpList followUps={followUps} customerId={customerId} onComplete={completeFollowUp} />
            </TabsContent>
          </Tabs>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
