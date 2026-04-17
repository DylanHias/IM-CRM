import today from '../../../docs/help/today.md';
import gettingStarted from '../../../docs/help/getting-started.md';
import customers from '../../../docs/help/customers.md';
import activities from '../../../docs/help/activities.md';
import followUps from '../../../docs/help/follow-ups.md';
import contacts from '../../../docs/help/contacts.md';
import opportunities from '../../../docs/help/opportunities.md';
import revenueOverview from '../../../docs/help/revenue-overview.md';
import analytics from '../../../docs/help/analytics.md';
import sync from '../../../docs/help/sync.md';
import settings from '../../../docs/help/settings.md';
import timeline from '../../../docs/help/timeline.md';
import shortcuts from '../../../docs/help/shortcuts.md';

const HELP_DOCS = [
  {
    title: 'Dashboard',
    content: today,
    keywords: ['dashboard', 'today', 'due', 'overview', 'home'],
  },
  {
    title: 'Getting Started',
    content: gettingStarted,
    keywords: ['start', 'setup', 'install', 'login', 'sign in', 'first time', 'begin', 'how to use'],
  },
  {
    title: 'Customers',
    content: customers,
    keywords: ['customer', 'account', 'company', 'companies', 'organization', 'client'],
  },
  {
    title: 'Activities',
    content: activities,
    keywords: ['activit', 'meeting', 'call', 'email', 'task', 'log', 'note', 'appointment'],
  },
  {
    title: 'Follow-Ups',
    content: followUps,
    keywords: ['follow', 'followup', 'follow-up', 'reminder', 'pending', 'due'],
  },
  {
    title: 'Contacts',
    content: contacts,
    keywords: ['contact', 'person', 'people', 'colleague', 'individual'],
  },
  {
    title: 'Opportunities',
    content: opportunities,
    keywords: ['opportunit', 'deal', 'pipeline', 'sales', 'quote', 'proposal', 'win', 'lose'],
  },
  {
    title: 'Revenue Overview',
    content: revenueOverview,
    keywords: ['revenue', 'invoice', 'billing', 'payment', 'finance', 'money', 'euro', 'amount'],
  },
  {
    title: 'Analytics',
    content: analytics,
    keywords: ['analytic', 'report', 'chart', 'graph', 'statistic', 'performance', 'metric', 'trend'],
  },
  {
    title: 'Sync',
    content: sync,
    keywords: ['sync', 'synchroni', 'd365', 'dynamics', 'import', 'export', 'update', 'refresh'],
  },
  {
    title: 'Settings',
    content: settings,
    keywords: ['setting', 'preference', 'config', 'theme', 'dark mode', 'light mode', 'language', 'notification'],
  },
  {
    title: 'Timeline',
    content: timeline,
    keywords: ['timeline', 'history', 'chronolog', 'recent'],
  },
  {
    title: 'Shortcuts',
    content: shortcuts,
    keywords: ['shortcut', 'keyboard', 'hotkey', 'key binding', 'ctrl', 'cmd'],
  },
];

export function getRelevantHelpDocs(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  const matched = HELP_DOCS.filter(({ keywords }) =>
    keywords.some((kw) => lower.includes(kw))
  );
  const docs = matched.length > 0 ? matched : HELP_DOCS.slice(0, 2); // fallback: dashboard + getting-started
  return docs.map(({ title, content }) => `## ${title}\n\n${content}`).join('\n\n---\n\n');
}
