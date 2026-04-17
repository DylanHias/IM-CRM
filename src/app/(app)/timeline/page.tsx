'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Timeline } from '@/components/timeline/Timeline';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { queryAllActivities } from '@/lib/db/queries/activities';
import { queryAllFollowUps } from '@/lib/db/queries/followups';
import { queryAllOpportunities } from '@/lib/db/queries/opportunities';
import { queryAllCustomers } from '@/lib/db/queries/customers';
import { onDataEvent } from '@/lib/dataEvents';
import type { Activity, FollowUp, Opportunity } from '@/types/entities';

export default function TimelinePage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [customerMap, setCustomerMap] = useState<Map<string, string>>(new Map());
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      if (isTauriApp()) {
        const [acts, fups, opps, customers] = await Promise.all([
          queryAllActivities(),
          queryAllFollowUps(),
          queryAllOpportunities(),
          queryAllCustomers(),
        ]);
        setActivities(acts);
        setFollowUps(fups);
        setOpportunities(opps);
        setCustomerMap(new Map(customers.map((c) => [c.id, c.name])));
      }
    } catch (err) {
      console.error('[timeline] Failed to load:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return onDataEvent(() => loadData());
  }, [loadData]);

  const q = search.toLowerCase().trim();
  const filteredActivities = q
    ? activities.filter((a) =>
        a.subject.toLowerCase().includes(q) ||
        (customerMap.get(a.customerId) ?? '').toLowerCase().includes(q)
      )
    : activities;
  const filteredFollowUps = q
    ? followUps.filter((f) =>
        f.title.toLowerCase().includes(q) ||
        (customerMap.get(f.customerId) ?? '').toLowerCase().includes(q)
      )
    : followUps;
  const filteredOpportunities = q
    ? opportunities.filter((o) =>
        o.subject.toLowerCase().includes(q) ||
        (customerMap.get(o.customerId) ?? '').toLowerCase().includes(q)
      )
    : opportunities;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
        <h2 className="text-xl font-semibold text-foreground">Timeline</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          All activities, follow-ups, and opportunities across your customers.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.05, ease: 'easeOut' }} className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by subject or customer…"
          className="pl-8"
        />
      </motion.div>

      <Timeline
        activities={filteredActivities}
        followUps={filteredFollowUps}
        opportunities={filteredOpportunities}
        customerMap={customerMap}
        onOpenCustomer={(customerId) => router.push(`/customers?id=${customerId}`)}
        paginate
      />
    </div>
  );
}
