'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { useD365UserIdResolved } from '@/hooks/useD365UserId';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { toast } from 'sonner';

let didRun = false;

export function useLaunchAlerts() {
  const followUpReminderDays = useSettingsStore((s) => s.followUpReminderDays);
  const overdueAlertsOnLaunch = useSettingsStore((s) => s.overdueAlertsOnLaunch);
  const dueTodayAlertsOnLaunch = useSettingsStore((s) => s.dueTodayAlertsOnLaunch);
  const opportunityStaleReminderDays = useSettingsStore((s) => s.opportunityStaleReminderDays);
  const account = useAuthStore((s) => s.account);
  const { id: d365UserId, isResolved } = useD365UserIdResolved();

  useEffect(() => {
    if (didRun) return;
    if (!isTauriApp()) return;
    if (!account?.localAccountId) return;
    if (!isResolved) return;

    didRun = true;

    const run = async () => {
      const { queryOverdueFollowUpCount, queryUpcomingFollowUpCount, queryDueTodayFollowUpCount } = await import(
        '@/lib/db/queries/followups'
      );

      const userId = d365UserId ?? account.localAccountId;
      const altUserId = account.localAccountId;

      try {
        const overdueCount = await queryOverdueFollowUpCount(userId, altUserId);
        const dueTodayCount = await queryDueTodayFollowUpCount(userId, altUserId);
        const upcomingCount = followUpReminderDays > 0
          ? await queryUpcomingFollowUpCount(followUpReminderDays, userId, altUserId)
          : 0;

        if (overdueAlertsOnLaunch && overdueCount > 0) {
          toast.warning(`${overdueCount} overdue follow-up${overdueCount > 1 ? 's' : ''}`, {
            description: 'Check your follow-ups to stay on track',
          });
        }

        if (dueTodayAlertsOnLaunch && dueTodayCount > 0) {
          toast.info(
            `${dueTodayCount} follow-up${dueTodayCount > 1 ? 's' : ''} due today`,
            { description: 'Stay on top of your day' },
          );
        }

        if (followUpReminderDays > 0 && upcomingCount > 0) {
          toast.info(
            `${upcomingCount} follow-up${upcomingCount > 1 ? 's' : ''} due within ${followUpReminderDays} day${followUpReminderDays > 1 ? 's' : ''}`,
          );
        }
      } catch (err) {
        console.error('[followup] Failed to compute launch alerts:', err);
      }

      try {
        const { queryStaleOpportunityCount } = await import('@/lib/db/queries/opportunities');
        const staleCount = await queryStaleOpportunityCount(
          opportunityStaleReminderDays,
          userId,
          altUserId,
        );
        if (staleCount > 0) {
          toast.warning(
            `${staleCount} stale opportunit${staleCount > 1 ? 'ies' : 'y'}`,
            { description: `No updates in ${opportunityStaleReminderDays}+ days` },
          );
        }
      } catch (err) {
        console.error('[opportunity] Failed to compute stale opportunity count:', err);
      }
    };

    const timer = setTimeout(run, 1500);
    return () => clearTimeout(timer);
  }, [
    followUpReminderDays,
    overdueAlertsOnLaunch,
    dueTodayAlertsOnLaunch,
    opportunityStaleReminderDays,
    d365UserId,
    isResolved,
    account?.localAccountId,
  ]);
}
