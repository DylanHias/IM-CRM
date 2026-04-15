'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckSquare, Activity, Target } from 'lucide-react';
import { MetricCard } from '@/components/analytics/MetricCard';
import { GreetingHeader } from '@/components/today/GreetingHeader';
import { GlobalSearchBar } from '@/components/today/GlobalSearchBar';
import { TodayFollowUpsCard } from '@/components/today/TodayFollowUpsCard';
import { RecentActivitiesCard } from '@/components/today/RecentActivitiesCard';
import { OpenOpportunitiesCard } from '@/components/today/OpenOpportunitiesCard';
import { FavoritedCustomersCard } from '@/components/today/FavoritedCustomersCard';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { useOpportunityListStore } from '@/store/opportunityListStore';
import { useCustomers } from '@/hooks/useCustomers';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import type { Activity as ActivityType, FollowUp } from '@/types/entities';

// Module-level cache: survives navigation (re-mounts) within a session.
// Stale data shows instantly while a fresh load runs in the background.
interface DashboardCache {
  todayFollowUps: FollowUp[];
  recentActivities: ActivityType[];
  allFollowUps: FollowUp[];
  activityCountThisWeek: number | null;
  forUserId: string | null;
}
let cache: DashboardCache | null = null;

export default function TodayPage() {
  const account = useAuthStore((s) => s.account);
  // Read resolved D365 user ID directly from the sync store — available immediately
  // after the first sync without waiting for the async useD365UserId hook.
  const callerD365UserId = useSyncStore((s) => s.callerD365UserId);
  const userId = callerD365UserId ?? account?.localAccountId ?? null;

  // Ensures customerStore.customers and allContacts are loaded for RecentActivitiesCard,
  // FavoritedCustomersCard, and GlobalSearchBar.
  useCustomers();

  const [todayFollowUps, setTodayFollowUps] = useState<FollowUp[]>(cache?.todayFollowUps ?? []);
  const [recentActivities, setRecentActivities] = useState<ActivityType[]>(cache?.recentActivities ?? []);
  const [allFollowUps, setAllFollowUps] = useState<FollowUp[]>(cache?.allFollowUps ?? []);
  const [activityCountThisWeek, setActivityCountThisWeek] = useState<number | null>(cache?.activityCountThisWeek ?? null);
  // Only show loading state when we have no cached data to display.
  const [loading, setLoading] = useState(cache === null);

  const opportunities = useOpportunityListStore((s) => s.opportunities);
  const openOpps = opportunities.filter((o) => o.status === 'Open');
  const pipelineValue = openOpps.reduce((sum, o) => sum + (o.estimatedRevenue ?? 0), 0);

  const loadedForUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isTauriApp() || !userId) {
      setLoading(false);
      return;
    }
    // Skip if we already loaded for this user in this session (cache is fresh).
    if (loadedForUserId.current === userId && cache?.forUserId === userId) return;

    const load = async () => {
      try {
        const { queryDueTodayFollowUps, queryAllFollowUps } = await import('@/lib/db/queries/followups');
        const { queryMyRecentActivities, queryMyActivityCountSince } = await import('@/lib/db/queries/activities');

        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const altId = account?.localAccountId && account.localAccountId !== userId ? account.localAccountId : null;

        const [dueTodayFUs, recentActs, allFUs, actCount] = await Promise.all([
          queryDueTodayFollowUps(userId, account?.localAccountId),
          queryMyRecentActivities(userId, altId, sevenDaysAgo),
          queryAllFollowUps(),
          queryMyActivityCountSince(userId, altId, sevenDaysAgo),
        ]);

        cache = {
          todayFollowUps: dueTodayFUs,
          recentActivities: recentActs,
          allFollowUps: allFUs,
          activityCountThisWeek: actCount,
          forUserId: userId,
        };
        loadedForUserId.current = userId;

        setTodayFollowUps(dueTodayFUs);
        setRecentActivities(recentActs);
        setAllFollowUps(allFUs);
        setActivityCountThisWeek(actCount);
      } catch (err) {
        console.error('[today] Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, account?.localAccountId]);

  const handleFollowUpCompleted = (id: string) => {
    setTodayFollowUps((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (cache) cache = { ...cache, todayFollowUps: next };
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <GreetingHeader />

      <GlobalSearchBar activities={recentActivities} followUps={allFollowUps} />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard
          label="Due Today"
          value={loading ? '—' : todayFollowUps.length}
          icon={CheckSquare}
          sub="follow-ups"
        />
        <MetricCard
          label="My Activities"
          value={loading || activityCountThisWeek === null ? '—' : activityCountThisWeek}
          icon={Activity}
          sub="this week"
        />
        <MetricCard
          label="Pipeline"
          value={openOpps.length === 0 ? '—' : `€${pipelineValue.toLocaleString('nl-BE', { maximumFractionDigits: 0 })}`}
          icon={Target}
          sub={`${openOpps.length} open ${openOpps.length === 1 ? 'opportunity' : 'opportunities'}`}
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TodayFollowUpsCard followUps={todayFollowUps} onCompleted={handleFollowUpCompleted} />
        <RecentActivitiesCard activities={recentActivities} />
      </div>

      <OpenOpportunitiesCard />

      <FavoritedCustomersCard />
    </div>
  );
}
