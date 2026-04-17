'use client';

import { useEffect, useRef, useState } from 'react';
import { Activity, Target, CalendarClock, Wallet } from 'lucide-react';
import { MetricCard } from '@/components/analytics/MetricCard';
import { GreetingHeader } from '@/components/today/GreetingHeader';
import { GlobalSearchBar } from '@/components/today/GlobalSearchBar';
import { BelgiumMapCard } from '@/components/dashboard/BelgiumMapCard';
import { RecentActivityPanel } from '@/components/dashboard/RecentActivityPanel';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { useCustomers } from '@/hooks/useCustomers';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { normalizeCityKey } from '@/lib/geo/belgianCities';
import type { Activity as ActivityType, FollowUp } from '@/types/entities';

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function fmtEur(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${Math.round(n / 1_000)}k`;
  return `€${Math.round(n)}`;
}

interface CityCount {
  cityId: string;
  n: number;
}

interface DashboardCache {
  recentActivities: ActivityType[];
  allFollowUps: FollowUp[];
  activitiesCount: number;
  opportunitiesCount: number;
  followUpsDueToday: number;
  openPipelineValue: number;
  cityCounts: CityCount[];
  totalBelgianCustomers: number;
  forUserId: string;
}
let cache: DashboardCache | null = null;

export default function DashboardPage() {
  const account = useAuthStore((s) => s.account);
  const callerD365UserId = useSyncStore((s) => s.callerD365UserId);
  const userId = callerD365UserId ?? account?.localAccountId ?? null;
  const altUserId =
    account?.localAccountId && account.localAccountId !== userId
      ? account.localAccountId
      : null;

  // Warm the customer store so RecentActivityPanel can resolve customer names.
  useCustomers();

  const [recentActivities, setRecentActivities] = useState<ActivityType[]>(
    cache?.recentActivities ?? [],
  );
  const [allFollowUps, setAllFollowUps] = useState<FollowUp[]>(cache?.allFollowUps ?? []);
  const [activitiesCount, setActivitiesCount] = useState<number | null>(
    cache?.activitiesCount ?? null,
  );
  const [opportunitiesCount, setOpportunitiesCount] = useState<number | null>(
    cache?.opportunitiesCount ?? null,
  );
  const [followUpsDueToday, setFollowUpsDueToday] = useState<number | null>(
    cache?.followUpsDueToday ?? null,
  );
  const [openPipelineValue, setOpenPipelineValue] = useState<number | null>(
    cache?.openPipelineValue ?? null,
  );
  const [cityCounts, setCityCounts] = useState<CityCount[]>(cache?.cityCounts ?? []);
  const [totalBelgianCustomers, setTotalBelgianCustomers] = useState<number>(
    cache?.totalBelgianCustomers ?? 0,
  );
  const [loading, setLoading] = useState(cache === null);

  const loadedForUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isTauriApp() || !userId) {
      setLoading(false);
      return;
    }
    if (loadedForUserId.current === userId && cache?.forUserId === userId) return;

    const load = async () => {
      try {
        const userIds = [userId, altUserId].filter(Boolean) as string[];

        const [
          { queryMyActivitiesCountAllTime, queryMyOpportunitiesCountAllTime, queryBelgianCustomersByCity, queryMyPipeline },
          { queryDueTodayFollowUpCount, queryAllFollowUps },
          { queryMyRecentActivitiesLatest },
        ] = await Promise.all([
          import('@/lib/db/queries/analytics'),
          import('@/lib/db/queries/followups'),
          import('@/lib/db/queries/activities'),
        ]);

        const [
          recentActs,
          allFUs,
          actCount,
          oppCount,
          dueTodayCount,
          pipeline,
          rawCities,
        ] = await Promise.all([
          queryMyRecentActivitiesLatest(userId, altUserId, 15),
          queryAllFollowUps(),
          queryMyActivitiesCountAllTime(userIds),
          queryMyOpportunitiesCountAllTime(userIds),
          queryDueTodayFollowUpCount(userId, altUserId ?? undefined),
          queryMyPipeline(userIds),
          queryBelgianCustomersByCity(),
        ]);

        const normalizedCities = rawCities
          .map((r) => ({ cityId: normalizeCityKey(r.cityKey), n: r.n }))
          .filter((r): r is CityCount => r.cityId !== null);
        const totalBE = rawCities.reduce((s, r) => s + r.n, 0);

        cache = {
          recentActivities: recentActs,
          allFollowUps: allFUs,
          activitiesCount: actCount,
          opportunitiesCount: oppCount,
          followUpsDueToday: dueTodayCount,
          openPipelineValue: pipeline.openValue,
          cityCounts: normalizedCities,
          totalBelgianCustomers: totalBE,
          forUserId: userId,
        };
        loadedForUserId.current = userId;

        setRecentActivities(recentActs);
        setAllFollowUps(allFUs);
        setActivitiesCount(actCount);
        setOpportunitiesCount(oppCount);
        setFollowUpsDueToday(dueTodayCount);
        setOpenPipelineValue(pipeline.openValue);
        setCityCounts(normalizedCities);
        setTotalBelgianCustomers(totalBE);
      } catch (err) {
        console.error('[dashboard] Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, altUserId]);

  return (
    <div className="space-y-6">
      <GreetingHeader />

      <GlobalSearchBar activities={recentActivities} followUps={allFollowUps} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-6 items-start">
        {/* Left column: Belgium map + KPI cards */}
        <div className="space-y-4">
          <BelgiumMapCard cityCounts={cityCounts} totalCustomers={totalBelgianCustomers} />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Total Activities"
              value={loading || activitiesCount === null ? '—' : fmt(activitiesCount)}
              icon={Activity}
              sub="All time"
            />
            <MetricCard
              label="Opportunities"
              value={loading || opportunitiesCount === null ? '—' : fmt(opportunitiesCount)}
              icon={Target}
              sub="All time"
            />
            <MetricCard
              label="Due Today"
              value={loading || followUpsDueToday === null ? '—' : fmt(followUpsDueToday)}
              icon={CalendarClock}
              sub="Follow-ups"
            />
            <MetricCard
              label="Open Pipeline"
              value={loading || openPipelineValue === null ? '—' : fmtEur(openPipelineValue)}
              icon={Wallet}
              sub="Your open deals"
            />
          </div>
        </div>

        {/* Right column: Recent activities */}
        <RecentActivityPanel activities={recentActivities} loading={loading} />
      </div>
    </div>
  );
}
