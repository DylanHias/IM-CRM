'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { useD365UserIdResolved } from '@/hooks/useD365UserId';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { notify } from '@/lib/notify';

let didRun = false;

export function useLaunchAlerts() {
  const followUpReminderDays = useSettingsStore((s) => s.followUpReminderDays);
  const overdueAlertsOnLaunch = useSettingsStore((s) => s.overdueAlertsOnLaunch);
  const dueTodayAlertsOnLaunch = useSettingsStore((s) => s.dueTodayAlertsOnLaunch);
  const opportunityStaleReminderDays = useSettingsStore((s) => s.opportunityStaleReminderDays);
  const opportunityExpiringReminderDays = useSettingsStore((s) => s.opportunityExpiringReminderDays);
  const dailyDigestOnLaunch = useSettingsStore((s) => s.dailyDigestOnLaunch);
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
      const { queryStaleOpportunityCount, queryExpiringOpportunityCount } = await import(
        '@/lib/db/queries/opportunities'
      );

      const userId = d365UserId ?? account.localAccountId;
      const altUserId = account.localAccountId;

      let overdueCount = 0;
      let dueTodayCount = 0;
      let upcomingCount = 0;
      let staleCount = 0;
      let expiringCount = 0;

      try {
        overdueCount = await queryOverdueFollowUpCount(userId, altUserId);
        dueTodayCount = await queryDueTodayFollowUpCount(userId, altUserId);
        upcomingCount = followUpReminderDays > 0
          ? await queryUpcomingFollowUpCount(followUpReminderDays, userId, altUserId)
          : 0;
      } catch (err) {
        console.error('[followup] Failed to compute launch alerts:', err);
      }

      try {
        staleCount = await queryStaleOpportunityCount(opportunityStaleReminderDays, userId, altUserId);
      } catch (err) {
        console.error('[opportunity] Failed to compute stale opportunity count:', err);
      }

      try {
        expiringCount = await queryExpiringOpportunityCount(opportunityExpiringReminderDays, userId, altUserId);
      } catch (err) {
        console.error('[opportunity] Failed to compute expiring opportunity count:', err);
      }

      if (dailyDigestOnLaunch) {
        const parts: string[] = [];
        if (overdueAlertsOnLaunch && overdueCount > 0) parts.push(`${overdueCount} overdue`);
        if (dueTodayAlertsOnLaunch && dueTodayCount > 0) parts.push(`${dueTodayCount} due today`);
        if (followUpReminderDays > 0 && upcomingCount > 0) parts.push(`${upcomingCount} upcoming`);
        if (staleCount > 0) parts.push(`${staleCount} stale`);
        if (expiringCount > 0) parts.push(`${expiringCount} expiring`);
        if (parts.length > 0) {
          notify('Daily digest', {
            description: parts.join(' • '),
            severity: overdueCount > 0 || expiringCount > 0 ? 'warning' : 'info',
            critical: true,
          });
        }
        return;
      }

      if (overdueAlertsOnLaunch && overdueCount > 0) {
        notify(`${overdueCount} overdue follow-up${overdueCount > 1 ? 's' : ''}`, {
          description: 'Check your follow-ups to stay on track',
          severity: 'warning',
        });
      }
      if (dueTodayAlertsOnLaunch && dueTodayCount > 0) {
        notify(`${dueTodayCount} follow-up${dueTodayCount > 1 ? 's' : ''} due today`, {
          description: 'Stay on top of your day',
          severity: 'info',
        });
      }
      if (followUpReminderDays > 0 && upcomingCount > 0) {
        notify(
          `${upcomingCount} follow-up${upcomingCount > 1 ? 's' : ''} due within ${followUpReminderDays} day${followUpReminderDays > 1 ? 's' : ''}`,
          { severity: 'info' },
        );
      }
      if (staleCount > 0) {
        notify(`${staleCount} stale opportunit${staleCount > 1 ? 'ies' : 'y'}`, {
          description: `No updates in ${opportunityStaleReminderDays}+ days`,
          severity: 'warning',
        });
      }
      if (opportunityExpiringReminderDays > 0 && expiringCount > 0) {
        notify(
          `${expiringCount} opportunit${expiringCount > 1 ? 'ies' : 'y'} expiring soon`,
          {
            description: `Within ${opportunityExpiringReminderDays} day${opportunityExpiringReminderDays > 1 ? 's' : ''}`,
            severity: 'warning',
          },
        );
      }
    };

    const timer = setTimeout(run, 1500);
    return () => clearTimeout(timer);
  }, [
    followUpReminderDays,
    overdueAlertsOnLaunch,
    dueTodayAlertsOnLaunch,
    opportunityStaleReminderDays,
    opportunityExpiringReminderDays,
    dailyDigestOnLaunch,
    d365UserId,
    isResolved,
    account?.localAccountId,
  ]);
}
