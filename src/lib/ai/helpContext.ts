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
  { title: 'Dashboard', content: today },
  { title: 'Getting Started', content: gettingStarted },
  { title: 'Customers', content: customers },
  { title: 'Activities', content: activities },
  { title: 'Follow-Ups', content: followUps },
  { title: 'Contacts', content: contacts },
  { title: 'Opportunities', content: opportunities },
  { title: 'Revenue Overview', content: revenueOverview },
  { title: 'Analytics', content: analytics },
  { title: 'Sync', content: sync },
  { title: 'Settings', content: settings },
  { title: 'Timeline', content: timeline },
  { title: 'Shortcuts', content: shortcuts },
];

let cached: string | null = null;

export function getHelpDocsContext(): string {
  if (cached) return cached;
  cached = HELP_DOCS.map(({ title, content }) => `## ${title}\n\n${content}`).join('\n\n---\n\n');
  return cached;
}
