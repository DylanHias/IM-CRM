'use client';

import { useEffect, useRef } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { toast } from 'sonner';

export function useLaunchAlerts() {
  const didRun = useRef(false);

  const followUpReminderDays = useSettingsStore((s) => s.followUpReminderDays);
  const overdueAlertsOnLaunch = useSettingsStore((s) => s.overdueAlertsOnLaunch);
  const opportunityStaleReminderDays = useSettingsStore((s) => s.opportunityStaleReminderDays);

  useEffect(() => {
    if (didRun.current || !isTauriApp()) return;
    didRun.current = true;

    const run = async () => {
      const { queryOverdueFollowUpCount, queryUpcomingFollowUpCount } = await import(
        '@/lib/db/queries/followups'
      );

      // Overdue follow-up alerts
      if (overdueAlertsOnLaunch) {
        const overdueCount = await queryOverdueFollowUpCount();
        if (overdueCount > 0) {
          toast.warning(`${overdueCount} overdue follow-up${overdueCount > 1 ? 's' : ''}`, {
            description: 'Check your follow-ups to stay on track',
          });
        }
      }

      // Upcoming follow-up reminders
      if (followUpReminderDays > 0) {
        const upcomingCount = await queryUpcomingFollowUpCount(followUpReminderDays);
        if (upcomingCount > 0) {
          toast.info(
            `${upcomingCount} follow-up${upcomingCount > 1 ? 's' : ''} due within ${followUpReminderDays} day${followUpReminderDays > 1 ? 's' : ''}`,
          );
        }
      }

      // Stale opportunity detection
      try {
        const { queryAllOpportunities } = await import('@/lib/db/queries/opportunities');
        const opportunities = await queryAllOpportunities();
        const cutoff = new Date(Date.now() - opportunityStaleReminderDays * 86400000).toISOString();
        const staleCount = opportunities.filter(
          (o) => o.status === 'Open' && o.updatedAt < cutoff,
        ).length;
        if (staleCount > 0) {
          toast.warning(
            `${staleCount} stale opportunit${staleCount > 1 ? 'ies' : 'y'}`,
            { description: `No updates in ${opportunityStaleReminderDays}+ days` },
          );
        }
      } catch {
        // opportunities table may not exist yet
      }
    };

    // Delay alerts slightly so the UI settles first
    const timer = setTimeout(run, 2000);
    return () => clearTimeout(timer);
  }, [followUpReminderDays, overdueAlertsOnLaunch, opportunityStaleReminderDays]);
}
