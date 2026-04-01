'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { toast } from 'sonner';

let didRun = false;

export function useLaunchAlerts() {

  const followUpReminderDays = useSettingsStore((s) => s.followUpReminderDays);
  const overdueAlertsOnLaunch = useSettingsStore((s) => s.overdueAlertsOnLaunch);
  const dueTodayAlertsOnLaunch = useSettingsStore((s) => s.dueTodayAlertsOnLaunch);
  const opportunityStaleReminderDays = useSettingsStore((s) => s.opportunityStaleReminderDays);
  useEffect(() => {
    if (didRun) return;
    didRun = true;

    const run = async () => {
      if (!isTauriApp()) return;

      const { queryOverdueFollowUpCount, queryUpcomingFollowUpCount, queryDueTodayFollowUpCount } = await import(
        '@/lib/db/queries/followups'
      );

      const overdueCount = await queryOverdueFollowUpCount();
      const dueTodayCount = await queryDueTodayFollowUpCount();
      const upcomingCount = followUpReminderDays > 0
        ? await queryUpcomingFollowUpCount(followUpReminderDays)
        : 0;

      // Overdue follow-up alerts
      if (overdueAlertsOnLaunch && overdueCount > 0) {
        toast.warning(`${overdueCount} overdue follow-up${overdueCount > 1 ? 's' : ''}`, {
          description: 'Check your follow-ups to stay on track',
        });
      }

      // Follow-ups due today
      if (dueTodayAlertsOnLaunch && dueTodayCount > 0) {
        toast.info(
          `${dueTodayCount} follow-up${dueTodayCount > 1 ? 's' : ''} due today`,
          { description: 'Stay on top of your day' },
        );
      }

      // Upcoming follow-up reminders
      if (followUpReminderDays > 0 && upcomingCount > 0) {
        toast.info(
          `${upcomingCount} follow-up${upcomingCount > 1 ? 's' : ''} due within ${followUpReminderDays} day${followUpReminderDays > 1 ? 's' : ''}`,
        );
      }

      // Stale opportunity detection
      try {
        const opportunities = await (await import('@/lib/db/queries/opportunities')).queryAllOpportunities();
        const cutoff = new Date(
          Date.now() - opportunityStaleReminderDays * 86400000,
        ).toISOString();
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
  }, [followUpReminderDays, overdueAlertsOnLaunch, dueTodayAlertsOnLaunch, opportunityStaleReminderDays]);
}
