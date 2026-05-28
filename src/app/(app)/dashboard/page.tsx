'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Target, Wallet, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { listContainerVariants, listItemVariants, sectionReveal } from '@/lib/motion';
import { MetricCard } from '@/components/analytics/MetricCard';
import { GreetingHeader } from '@/components/today/GreetingHeader';
import { GlobalSearchBar } from '@/components/today/GlobalSearchBar';
import { BelgiumMapCard } from '@/components/dashboard/BelgiumMapCard';
import { RecentActivityPanel } from '@/components/dashboard/RecentActivityPanel';
import { WeekStripPanel } from '@/components/dashboard/WeekStripPanel';
import { StaleOpportunitiesPanel } from '@/components/dashboard/StaleOpportunitiesPanel';
import { QuickAddMenu } from '@/components/dashboard/QuickAddMenu';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { useCustomerStore } from '@/store/customerStore';
import { useCustomers } from '@/hooks/useCustomers';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { BELGIAN_CITIES, normalizeCityKey } from '@/lib/geo/belgianCities';
import { normalizeCity } from '@/lib/utils/cityProvince';
import type { Activity as ActivityType, FollowUp, Opportunity } from '@/types/entities';
import type { StaleOpportunity } from '@/lib/db/queries/opportunities';

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

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

interface CityCount {
  cityId: string;
  n: number;
}

interface DashboardCache {
  recentActivities: ActivityType[];
  recentOpportunities: Opportunity[];
  allFollowUps: FollowUp[];
  activitiesCount: number;
  opportunitiesCount: number;
  openPipelineValue: number;
  cityCounts: CityCount[];
  totalBelgianCustomers: number;
  staleOpportunities: StaleOpportunity[];
  activityTrend: { current: number; previous: number };
  opportunityTrend: { current: number; previous: number };
  pipelineDelta: { currentValue: number; previousValue: number };
  myCustomersCount: number;
  forUserId: string;
}
let cache: DashboardCache | null = null;

export default function DashboardPage() {
  const router = useRouter();
  const setFilterCity = useCustomerStore((s) => s.setFilterCity);
  const account = useAuthStore((s) => s.account);
  const callerD365UserId = useSyncStore((s) => s.callerD365UserId);
  const userId = callerD365UserId ?? account?.localAccountId ?? null;
  const altUserId =
    account?.localAccountId && account.localAccountId !== userId
      ? account.localAccountId
      : null;

  useCustomers();

  const [recentActivities, setRecentActivities] = useState<ActivityType[]>(
    cache?.recentActivities ?? [],
  );
  const [recentOpportunities, setRecentOpportunities] = useState<Opportunity[]>(
    cache?.recentOpportunities ?? [],
  );
  const [allFollowUps, setAllFollowUps] = useState<FollowUp[]>(cache?.allFollowUps ?? []);
  const [activitiesCount, setActivitiesCount] = useState<number | null>(
    cache?.activitiesCount ?? null,
  );
  const [opportunitiesCount, setOpportunitiesCount] = useState<number | null>(
    cache?.opportunitiesCount ?? null,
  );
  const [openPipelineValue, setOpenPipelineValue] = useState<number | null>(
    cache?.openPipelineValue ?? null,
  );
  const [cityCounts, setCityCounts] = useState<CityCount[]>(cache?.cityCounts ?? []);
  const [totalBelgianCustomers, setTotalBelgianCustomers] = useState<number>(
    cache?.totalBelgianCustomers ?? 0,
  );
  const [staleOpportunities, setStaleOpportunities] = useState<StaleOpportunity[]>(
    cache?.staleOpportunities ?? [],
  );
  const [activityTrend, setActivityTrend] = useState<{ current: number; previous: number } | null>(
    cache?.activityTrend ?? null,
  );
  const [opportunityTrend, setOpportunityTrend] = useState<{ current: number; previous: number } | null>(
    cache?.opportunityTrend ?? null,
  );
  const [pipelineDelta, setPipelineDelta] = useState<{ currentValue: number; previousValue: number } | null>(
    cache?.pipelineDelta ?? null,
  );
  const [myCustomersCount, setMyCustomersCount] = useState<number | null>(
    cache?.myCustomersCount ?? null,
  );
  const [loading, setLoading] = useState(cache === null);

  const loadedForUserId = useRef<string | null>(null);

  const handleCityClick = useCallback(
    (cityId: string) => {
      const city = BELGIAN_CITIES.find((c) => c.id === cityId);
      const canonical = city ? normalizeCity(city.displayName) : null;
      if (canonical) setFilterCity(canonical);
      router.push('/customers');
    },
    [router, setFilterCity],
  );

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
          {
            queryMyActivitiesCountAllTime,
            queryMyOpportunitiesCountAllTime,
            queryBelgianCustomersByCity,
            queryMyPipeline,
            queryMyActivityWeeklyTrend,
            queryMyOpportunityWeeklyTrend,
            queryMyPipelineWeeklyDelta,
            queryMyCustomersCount,
          },
          { queryFollowUpsByUser },
          { queryMyRecentActivitiesLatest },
          { queryMyRecentOpportunitiesLatest, queryMyStaleOpportunities },
        ] = await Promise.all([
          import('@/lib/db/queries/analytics'),
          import('@/lib/db/queries/followups'),
          import('@/lib/db/queries/activities'),
          import('@/lib/db/queries/opportunities'),
        ]);

        const [
          recentActs,
          recentOpps,
          allFUs,
          actCount,
          oppCount,
          pipeline,
          rawCities,
          stale,
          actTrend,
          oppTrend,
          pipeDelta,
          myCustCount,
        ] = await Promise.all([
          queryMyRecentActivitiesLatest(userId, altUserId, 15),
          queryMyRecentOpportunitiesLatest(userId, altUserId, 15),
          queryFollowUpsByUser(userId, altUserId ?? undefined),
          queryMyActivitiesCountAllTime(userIds),
          queryMyOpportunitiesCountAllTime(userIds),
          queryMyPipeline(userIds),
          queryBelgianCustomersByCity(),
          queryMyStaleOpportunities(userId, altUserId, 30, 25),
          queryMyActivityWeeklyTrend(userIds),
          queryMyOpportunityWeeklyTrend(userIds),
          queryMyPipelineWeeklyDelta(userIds),
          queryMyCustomersCount(userIds),
        ]);

        const cityAgg = new Map<string, number>();
        for (const r of rawCities) {
          const canonical = normalizeCity(r.cityKey);
          const cityId = canonical ? normalizeCityKey(canonical) : null;
          if (cityId) cityAgg.set(cityId, (cityAgg.get(cityId) ?? 0) + r.n);
        }
        const normalizedCities = Array.from(cityAgg.entries()).map(([cityId, n]) => ({ cityId, n }));
        const totalBE = rawCities.reduce((s, r) => s + r.n, 0);

        cache = {
          recentActivities: recentActs,
          recentOpportunities: recentOpps,
          allFollowUps: allFUs,
          activitiesCount: actCount,
          opportunitiesCount: oppCount,
          openPipelineValue: pipeline.openValue,
          cityCounts: normalizedCities,
          totalBelgianCustomers: totalBE,
          staleOpportunities: stale,
          activityTrend: actTrend,
          opportunityTrend: oppTrend,
          pipelineDelta: pipeDelta,
          myCustomersCount: myCustCount,
          forUserId: userId,
        };
        loadedForUserId.current = userId;

        setRecentActivities(recentActs);
        setRecentOpportunities(recentOpps);
        setAllFollowUps(allFUs);
        setActivitiesCount(actCount);
        setOpportunitiesCount(oppCount);
        setOpenPipelineValue(pipeline.openValue);
        setCityCounts(normalizedCities);
        setTotalBelgianCustomers(totalBE);
        setStaleOpportunities(stale);
        setActivityTrend(actTrend);
        setOpportunityTrend(oppTrend);
        setPipelineDelta(pipeDelta);
        setMyCustomersCount(myCustCount);
      } catch (err) {
        console.error('[dashboard] Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, altUserId]);

  const activityDelta = activityTrend
    ? pctDelta(activityTrend.current, activityTrend.previous)
    : null;
  const opportunityDelta = opportunityTrend
    ? pctDelta(opportunityTrend.current, opportunityTrend.previous)
    : null;
  const pipelineDeltaPct = pipelineDelta
    ? pctDelta(pipelineDelta.currentValue, pipelineDelta.previousValue)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <GreetingHeader />
        <QuickAddMenu />
      </div>

      <GlobalSearchBar activities={recentActivities} followUps={allFollowUps} />

      <div className="grid grid-cols-1 lg:grid-cols-[45fr_20fr_35fr] gap-6 items-stretch">
        <motion.div {...sectionReveal(0)}>
          <BelgiumMapCard
            cityCounts={cityCounts}
            totalCustomers={totalBelgianCustomers}
            onCityClick={handleCityClick}
          />
        </motion.div>

        <motion.div
          className="flex flex-col gap-3 h-full min-h-0"
          variants={listContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={listItemVariants} className="flex-1 min-h-0">
            <MetricCard
              className="h-full"
              label="Total Activities"
              value={loading || activitiesCount === null ? '—' : fmt(activitiesCount)}
              icon={Activity}
              sub="All time"
              delta={activityDelta ?? undefined}
              deltaLabel="% vs last 7d"
            />
          </motion.div>
          <motion.div variants={listItemVariants} className="flex-1 min-h-0">
            <MetricCard
              className="h-full"
              label="Opportunities"
              value={loading || opportunitiesCount === null ? '—' : fmt(opportunitiesCount)}
              icon={Target}
              sub="All time"
              delta={opportunityDelta ?? undefined}
              deltaLabel="% vs last 7d"
            />
          </motion.div>
          <motion.div variants={listItemVariants} className="flex-1 min-h-0">
            <MetricCard
              className="h-full"
              label="Open Pipeline"
              value={loading || openPipelineValue === null ? '—' : fmtEur(openPipelineValue)}
              icon={Wallet}
              sub="Your open deals"
              delta={pipelineDeltaPct ?? undefined}
              deltaLabel="% vs 7d ago"
            />
          </motion.div>
          <motion.div variants={listItemVariants} className="flex-1 min-h-0">
            <MetricCard
              className="h-full"
              label="My Customers"
              value={loading || myCustomersCount === null ? '—' : fmt(myCustomersCount)}
              icon={Building2}
              sub="Accounts you own"
            />
          </motion.div>
        </motion.div>

        <div className="flex flex-col gap-4 h-full min-h-0">
          <motion.div {...sectionReveal(0.08)} className="flex-1 min-h-0">
            <RecentActivityPanel
              activities={recentActivities}
              opportunities={recentOpportunities}
              loading={loading}
            />
          </motion.div>
          <motion.div {...sectionReveal(0.14)} className="flex-1 min-h-0">
            <StaleOpportunitiesPanel opportunities={staleOpportunities} loading={loading} />
          </motion.div>
        </div>
      </div>

      <motion.div {...sectionReveal(0.2)}>
        <WeekStripPanel followUps={allFollowUps} loading={loading} />
      </motion.div>
    </div>
  );
}
