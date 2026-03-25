'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { mockFollowUps } from '@/lib/mock/followups';
import { mockOpportunities } from '@/lib/mock/opportunities';
import { toast } from 'sonner';

let didRun = false;

export function useLaunchAlerts() {

  const followUpReminderDays = useSettingsStore((s) => s.followUpReminderDays);
  const overdueAlertsOnLaunch = useSettingsStore((s) => s.overdueAlertsOnLaunch);
  const opportunityStaleReminderDays = useSettingsStore((s) => s.opportunityStaleReminderDays);
  const mockDataEnabled = useSettingsStore((s) => s.mockDataEnabled);

  useEffect(() => {
    if (didRun) return;
    didRun = true;

    const run = async () => {
      const today = new Date().toISOString().split('T')[0];
      const useMock = mockDataEnabled || !isTauriApp();

      let overdueCount = 0;
      let upcomingCount = 0;
      let dueTodayCount = 0;

      if (useMock) {
        const open = mockFollowUps.filter((f) => !f.completed);
        overdueCount = open.filter((f) => f.dueDate < today).length;
        dueTodayCount = open.filter((f) => f.dueDate === today).length;
        if (followUpReminderDays > 0) {
          const futureDate = new Date(Date.now() + followUpReminderDays * 86400000)
            .toISOString()
            .split('T')[0];
          upcomingCount = open.filter(
            (f) => f.dueDate > today && f.dueDate <= futureDate,
          ).length;
        }
      } else {
        const { queryOverdueFollowUpCount, queryUpcomingFollowUpCount, queryDueTodayFollowUpCount } = await import(
          '@/lib/db/queries/followups'
        );
        overdueCount = await queryOverdueFollowUpCount();
        dueTodayCount = await queryDueTodayFollowUpCount();
        if (followUpReminderDays > 0) {
          upcomingCount = await queryUpcomingFollowUpCount(followUpReminderDays);
        }
      }

      // Overdue follow-up alerts
      if (overdueAlertsOnLaunch && overdueCount > 0) {
        toast.warning(`${overdueCount} overdue follow-up${overdueCount > 1 ? 's' : ''}`, {
          description: 'Check your follow-ups to stay on track',
        });
      }

      // Follow-ups due today
      if (dueTodayCount > 0) {
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
        const opportunities = useMock
          ? mockOpportunities
          : await (await import('@/lib/db/queries/opportunities')).queryAllOpportunities();
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
  }, [followUpReminderDays, overdueAlertsOnLaunch, opportunityStaleReminderDays, mockDataEnabled]);
}
