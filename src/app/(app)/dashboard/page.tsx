'use client';

import { useEffect, useState } from 'react';
import { CheckSquare, Activity, Target } from 'lucide-react';
import { MetricCard } from '@/components/analytics/MetricCard';
import { GreetingHeader } from '@/components/today/GreetingHeader';
import { GlobalSearchBar } from '@/components/today/GlobalSearchBar';
import { TodayFollowUpsCard } from '@/components/today/TodayFollowUpsCard';
import { RecentActivitiesCard } from '@/components/today/RecentActivitiesCard';
import { OpenOpportunitiesCard } from '@/components/today/OpenOpportunitiesCard';
import { useAuthStore } from '@/store/authStore';
import { useD365UserId } from '@/hooks/useD365UserId';
import { useOpportunityListStore } from '@/store/opportunityListStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import type { Activity as ActivityType, FollowUp } from '@/types/entities';

export default function TodayPage() {
  const account = useAuthStore((s) => s.account);
  const d365UserId = useD365UserId();

  const [todayFollowUps, setTodayFollowUps] = useState<FollowUp[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityType[]>([]);
  const [allFollowUps, setAllFollowUps] = useState<FollowUp[]>([]);
  const [activityCountThisWeek, setActivityCountThisWeek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const opportunities = useOpportunityListStore((s) => s.opportunities);
  const openOpps = opportunities.filter((o) => o.status === 'Open');
  const pipelineValue = openOpps.reduce((sum, o) => sum + (o.estimatedRevenue ?? 0), 0);

  useEffect(() => {
    if (!isTauriApp()) {
      setLoading(false);
      return;
    }
    const userId = d365UserId ?? account?.localAccountId ?? undefined;
    const altUserId = account?.localAccountId ?? undefined;

    const load = async () => {
      try {
        const { queryDueTodayFollowUps, queryAllFollowUps } = await import('@/lib/db/queries/followups');
        const { queryRecentActivities, queryMyActivityCountSince } = await import('@/lib/db/queries/activities');

        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

        const [dueTodayFUs, recentActs, allFUs, actCount] = await Promise.all([
          queryDueTodayFollowUps(userId, altUserId),
          queryRecentActivities(10),
          queryAllFollowUps(),
          userId
            ? queryMyActivityCountSince(userId, altUserId && altUserId !== userId ? altUserId : null, sevenDaysAgo)
            : Promise.resolve(0),
        ]);

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
  }, [d365UserId, account?.localAccountId]);

  const handleFollowUpCompleted = (id: string) => {
    setTodayFollowUps((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <GreetingHeader />

      <GlobalSearchBar activities={recentActivities} followUps={allFollowUps} />

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-3">
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
      <div className="grid grid-cols-2 gap-4">
        <TodayFollowUpsCard followUps={todayFollowUps} onCompleted={handleFollowUpCompleted} />
        <RecentActivitiesCard activities={recentActivities} />
      </div>

      <OpenOpportunitiesCard />
    </div>
  );
}
