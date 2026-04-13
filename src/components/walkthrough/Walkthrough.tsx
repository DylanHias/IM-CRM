'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Joyride, type EventData, STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { useRouter, usePathname } from 'next/navigation';
import { useSettingsStore } from '@/store/settingsStore';
import { useCustomerStore } from '@/store/customerStore';
import { onDataEvent } from '@/lib/dataEvents';
import { WalkthroughTooltip } from './WalkthroughTooltip';

function buildSteps(firstCustomerId: string | null) {
  const base = firstCustomerId ? `/customers?id=${firstCustomerId}` : '/customers';

  return [
    {
      target: '[data-sidebar="sidebar"]',
      title: 'Welcome to the Ingram Micro CRM',
      content: "Let's take a quick tour so you know where everything is. This won't take long.",
      placement: 'right' as const,
      data: { route: null },
    },
    {
      target: '[data-sidebar="menu"]',
      title: 'Navigation',
      content: 'Switch between all sections of the app from here — Customers, Follow-Ups, Opportunities and more.',
      placement: 'right' as const,
      data: { route: null },
    },
    {
      target: '[data-tour="page-customers"]',
      title: 'Your Customers',
      content: "All your accounts are listed here. Use the search bar and filters to quickly find who you're looking for.",
      placement: 'bottom' as const,
      data: { route: '/customers' },
    },
    {
      target: '.bookmark-btn',
      title: 'Favourites',
      content: 'Hover over any customer row and click the bookmark icon to add them to your favourites. Favourites appear pinned in the sidebar for quick access.',
      placement: 'right' as const,
      data: { route: '/customers' },
    },
    {
      target: '[data-tour="customer-detail"]',
      title: 'Customer Detail',
      content: "Click any customer to open their detail page. Everything about this account lives here — activities, contacts, follow-ups and opportunities.",
      placement: 'bottom' as const,
      data: { route: base },
    },
    {
      target: '[data-tour="tab-overview"]',
      title: 'Overview',
      content: 'The Overview tab shows key metrics and a timeline of recent interactions with this customer.',
      placement: 'bottom' as const,
      data: { route: `${base}&tab=overview` },
    },
    {
      target: '[data-tour="tab-activities"]',
      title: 'Activities',
      content: 'Log calls, meetings, visits and notes here. Every interaction you have with this customer gets recorded.',
      placement: 'bottom' as const,
      data: { route: `${base}&tab=activities` },
    },
    {
      target: '[data-tour="tab-contacts"]',
      title: 'Contacts',
      content: 'All contacts associated with this account, synced directly from Dynamics 365.',
      placement: 'bottom' as const,
      data: { route: `${base}&tab=contacts` },
    },
    {
      target: '[data-tour="tab-followups"]',
      title: 'Follow-Ups',
      content: 'Track your open tasks for this customer here. Never let a follow-up slip through the cracks.',
      placement: 'bottom' as const,
      data: { route: `${base}&tab=followups` },
    },
    {
      target: '[data-tour="tab-opportunities"]',
      title: 'Opportunities',
      content: 'Manage deals and track their progress through your sales pipeline for this customer.',
      placement: 'bottom' as const,
      data: { route: `${base}&tab=opportunities` },
    },
    {
      target: '[data-tour="page-followups"]',
      title: 'Your Follow-Ups',
      content: 'All your follow-up tasks across every customer in one place. Overdue items are highlighted so you can prioritise what needs attention first.',
      placement: 'bottom' as const,
      data: { route: '/followups' },
    },
    {
      target: '[data-tour="page-opportunities"]',
      title: 'Opportunities',
      content: 'All your opportunities across every customer. Filter, sort and manage your entire sales pipeline here.',
      placement: 'bottom' as const,
      data: { route: '/opportunities' },
    },
    {
      target: '[data-tour="page-revenue"]',
      title: 'Revenue Overview',
      content: "A bird's-eye view of all the customers revenue performance. Filter by cloud customers, sort by ARR and drill down into individual accounts.",
      placement: 'bottom' as const,
      data: { route: '/revenue-overview' },
    },
    {
      target: '[data-tour="export-button"]',
      title: 'Export to Excel',
      content: 'Export the current view to Excel at any time — handy for reporting or sharing with your team.',
      placement: 'left' as const,
      spotlightClicks: false,
      data: { route: '/revenue-overview' },
    },
    {
      target: 'a[href="/sync"]',
      title: 'Sync',
      content: 'This keeps your data up to date with Dynamics 365. Sync runs automatically in the background, but you can trigger it manually here.',
      placement: 'right' as const,
      data: { route: null },
    },
    {
      target: '[data-sidebar="footer"]',
      title: "You're all set!",
      content: 'Access your profile, settings, keyboard shortcuts and help docs from the footer. Press Ctrl+K anytime to quickly search or navigate.',
      placement: 'right' as const,
      data: { route: null },
    },
  ];
}

export function Walkthrough() {
  const hasCompletedWalkthrough = useSettingsStore((s) => s.hasCompletedWalkthrough);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const customers = useCustomerStore((s) => s.customers);
  const router = useRouter();
  const pathname = usePathname();

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const firstCustomerId = customers.length > 0 ? customers[0].id : null;
  const steps = useMemo(() => buildSteps(firstCustomerId), [firstCustomerId]);

  useEffect(() => {
    if (hasCompletedWalkthrough) return;
    return onDataEvent((e) => {
      if (e.entity === 'walkthrough' && e.action === 'updated') {
        setStepIndex(0);
        setRun(true);
      }
    });
  }, [hasCompletedWalkthrough]);

  const complete = useCallback(() => {
    setRun(false);
    updateSetting('hasCompletedWalkthrough', true);
  }, [updateSetting]);

  const handleEvent = useCallback((data: EventData) => {
    const { action, index, status, type } = data;

    if (type === EVENTS.STEP_AFTER) {
      const delta = action === ACTIONS.PREV ? -1 : 1;
      const nextIndex = index + delta;

      if (nextIndex >= steps.length) {
        complete();
        return;
      }

      if (nextIndex < 0) {
        setStepIndex(0);
        return;
      }

      const nextRoute = (steps[nextIndex].data as { route: string | null }).route;
      const currentUrl =
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : pathname;

      if (nextRoute && nextRoute !== currentUrl) {
        setRun(false);
        router.push(nextRoute);
        setTimeout(() => {
          setStepIndex(nextIndex);
          setRun(true);
        }, 500);
      } else {
        setStepIndex(nextIndex);
      }
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      const nextIndex = stepIndex + 1;
      if (nextIndex < steps.length) {
        setStepIndex(nextIndex);
      } else {
        complete();
      }
    } else if (status === STATUS.SKIPPED || status === STATUS.FINISHED) {
      complete();
    }
  }, [complete, pathname, router, stepIndex, steps]);

  if (hasCompletedWalkthrough) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      onEvent={handleEvent}
      tooltipComponent={WalkthroughTooltip}
      floatingOptions={{
        strategy: 'fixed',
        shiftOptions: { padding: 12 },
        flipOptions: { padding: 12 },
      }}
      options={{
        buttons: ['back', 'close', 'primary', 'skip'],
        overlayClickAction: false,
        skipBeacon: true,
        arrowColor: 'hsl(var(--card))',
        overlayColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 10000,
      }}
    />
  );
}
