'use client';

import { useEffect, useRef, useState } from 'react';
import { Activity, Target, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { listContainerVariants, listItemVariants, sectionReveal } from '@/lib/motion';
import { MetricCard } from '@/components/analytics/MetricCard';
import { GreetingHeader } from '@/components/today/GreetingHeader';
import { GlobalSearchBar } from '@/components/today/GlobalSearchBar';
import { BelgiumMapCard } from '@/components/dashboard/BelgiumMapCard';
import { RecentActivityPanel } from '@/components/dashboard/RecentActivityPanel';
import { DueTodayPanel } from '@/components/dashboard/DueTodayPanel';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { useCustomers } from '@/hooks/useCustomers';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { normalizeCityKey } from '@/lib/geo/belgianCities';
import { normalizeCity } from '@/lib/utils/cityProvince';
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
          { queryFollowUpsByUser },
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
          pipeline,
          rawCities,
        ] = await Promise.all([
          queryMyRecentActivitiesLatest(userId, altUserId, 15),
          queryFollowUpsByUser(userId, altUserId ?? undefined),
          queryMyActivitiesCountAllTime(userIds),
          queryMyOpportunitiesCountAllTime(userIds),
          queryMyPipeline(userIds),
          queryBelgianCustomersByCity(),
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
          allFollowUps: allFUs,
          activitiesCount: actCount,
          opportunitiesCount: oppCount,
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
          <motion.div {...sectionReveal(0)}>
            <BelgiumMapCard cityCounts={cityCounts} totalCustomers={totalBelgianCustomers} />
          </motion.div>

          <motion.div
            className="grid grid-cols-2 lg:grid-cols-3 gap-3"
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={listItemVariants}>
              <MetricCard
                label="Total Activities"
                value={loading || activitiesCount === null ? '—' : fmt(activitiesCount)}
                icon={Activity}
                sub="All time"
              />
            </motion.div>
            <motion.div variants={listItemVariants}>
              <MetricCard
                label="Opportunities"
                value={loading || opportunitiesCount === null ? '—' : fmt(opportunitiesCount)}
                icon={Target}
                sub="All time"
              />
            </motion.div>
            <motion.div variants={listItemVariants}>
              <MetricCard
                label="Open Pipeline"
                value={loading || openPipelineValue === null ? '—' : fmtEur(openPipelineValue)}
                icon={Wallet}
                sub="Your open deals"
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Right column: Recent Activity + Due Today */}
        <div className="flex flex-col gap-4">
          <motion.div {...sectionReveal(0.08)}>
            <RecentActivityPanel activities={recentActivities} loading={loading} />
          </motion.div>
          <motion.div {...sectionReveal(0.14)}>
            <DueTodayPanel
              followUps={allFollowUps.filter((f) => {
                const today = new Date().toISOString().split('T')[0];
                return !f.completed && f.dueDate === today;
              })}
              loading={loading}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
