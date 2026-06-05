// Knowledge base for the AI assistant (Iris). The doc-backed sections import the
// real user-facing help files from docs/help/*.md verbatim — the same source the
// in-app Help page renders — so Iris always answers from the canonical docs and
// can never drift out of sync with them. Only the keyword-matched sections are
// injected per message, keeping prompt size in check.
//
// A few topics have no standalone help doc yet (the Iris assistant itself, the
// profile card, and the easter eggs). Those are kept as short inline notes below
// so Iris can still answer about them; everything else comes from the docs.

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

interface HelpSection {
  title: string;
  content: string;
  keywords: string[];
}

const SECTIONS: HelpSection[] = [
  {
    title: 'Dashboard',
    keywords: ['dashboard', 'today', 'due', 'overview', 'home', 'map', 'belgium', 'metric', 'metric card', 'recent', 'recent activity', 'landing', 'widget', 'next 7 days', 'week', 'strip', 'stale', 'pipeline', 'quick add'],
    content: today,
  },
  {
    title: 'Getting Started',
    keywords: ['start', 'setup', 'install', 'login', 'sign in', 'first time', 'begin', 'how to use', 'navigate', 'walkthrough', 'tour', 'offline'],
    content: gettingStarted,
  },
  {
    title: 'Customers',
    keywords: ['customer', 'account', 'company', 'companies', 'organization', 'client', 'search', 'filter', 'sort', 'health', 'health score', 'cloud', 'bookmark', 'favorite', 'owner'],
    content: customers,
  },
  {
    title: 'Activities',
    keywords: ['activit', 'meeting', 'call', 'visit', 'email', 'task', 'log', 'note', 'appointment', 'kanban', 'interaction'],
    content: activities,
  },
  {
    title: 'Follow-Ups',
    keywords: ['follow', 'followup', 'follow-up', 'reminder', 'pending', 'due', 'task', 'overdue', 'upcoming'],
    content: followUps,
  },
  {
    title: 'Contacts',
    keywords: ['contact', 'person', 'people', 'stakeholder', 'individual', 'primary', 'decision maker'],
    content: contacts,
  },
  {
    title: 'Opportunities',
    keywords: ['opportunit', 'deal', 'pipeline', 'sales', 'quote', 'proposal', 'win', 'lose', 'lost', 'won', 'stage', 'revenue', 'vendor', 'stale'],
    content: opportunities,
  },
  {
    title: 'Revenue Overview',
    keywords: ['revenue', 'arr', 'billing', 'payment', 'finance', 'money', 'euro', 'amount', 'cloud', 'language', 'export'],
    content: revenueOverview,
  },
  {
    title: 'Analytics',
    keywords: ['analytic', 'report', 'chart', 'graph', 'statistic', 'performance', 'metric', 'trend', 'insight', 'forecast', 'funnel', 'win rate'],
    content: analytics,
  },
  {
    title: 'Sync',
    keywords: ['sync', 'synchroni', 'd365', 'dynamics', 'import', 'export', 'update', 'refresh', 'offline', 'pending', 'power bi', 'scope', 'queue'],
    content: sync,
  },
  {
    title: 'Settings',
    keywords: ['setting', 'preference', 'config', 'theme', 'dark mode', 'light mode', 'appearance', 'notification', 'keybinding', 'accent', 'font', 'density', 'autostart', 'update'],
    content: settings,
  },
  {
    title: 'Timeline',
    keywords: ['timeline', 'history', 'chronolog', 'recent', 'feed', 'all activities'],
    content: timeline,
  },
  {
    title: 'Shortcuts',
    keywords: ['shortcut', 'keyboard', 'hotkey', 'key binding', 'ctrl', 'cmd', 'keybinding', 'command palette'],
    content: shortcuts,
  },
  // ── Topics without a standalone help doc — short inline notes ──
  {
    title: 'Assistant (Iris)',
    keywords: ['iris', 'assistant', 'chatbot', 'sparkles', 'who are you', 'what can you do'],
    content: `ASSISTANT (Iris): The app's built-in AI helper — that's me. I'm opened from the sparkles button on the right edge of the window, which slides out a chat panel. I answer questions about how this CRM works and look up live details about your customers, contacts, opportunities, activities and revenue from your local data. I run on a local AI model (Ollama) that downloads once on first use (progress is shown). I can only READ data — I never change anything. Use the clear button to reset the chat and the stop button to halt a reply. I only help with this CRM and your data, not unrelated topics.`,
  },
  {
    title: 'Profile & Account',
    keywords: ['profile', 'avatar', 'photo', 'birthday', 'job title', 'log out', 'logout', 'sign out', 'user menu', 'my info'],
    content: `PROFILE: Click your photo and name at the bottom of the sidebar to open your profile card. It shows your photo, name, role, job title, email, location and birthday — all pulled from your Microsoft 365 / Dynamics 365 account (edit your details there or in Settings). From this card you can open Account settings, Help, Keyboard shortcuts, and — for admins only — the Admin panel and Debug page, or Log out. The current app version is shown at the bottom.`,
  },
  {
    title: 'Easter Eggs',
    keywords: ['easter egg', 'confetti', 'celebration', 'whale', 'konami', 'cobweb'],
    content: `EASTER EGGS: Small celebrations, on by default — toggle them off in Settings, and they automatically respect the Reduce motion setting. Marking an opportunity Won pops confetti: the first win of the day, plus a bigger fireworks-and-stars burst for "whale" deals worth €1,000,000+. Entering the Konami code (Up Up Down Down Left Right Left Right B A) arms "Sales Mode" so your next won deal gets a hero's welcome. On your birthday you get a surprise message and confetti cannons. Opportunities left untouched for months slowly grow cobwebs as a gentle nudge to follow up.`,
  },
];

export function getRelevantHelpDocs(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  const matched = SECTIONS.filter(({ keywords }) =>
    keywords.some((kw) => lower.includes(kw))
  );
  const docs = matched.length > 0 ? matched : SECTIONS.slice(0, 2);
  return docs.map(({ content }) => content).join('\n\n');
}
