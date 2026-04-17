// Compact knowledge base for the AI assistant.
// Kept intentionally dense to minimize prompt tokens and improve response speed.
// The human-readable versions live in docs/help/*.md.

interface HelpSection {
  title: string;
  content: string;
  keywords: string[];
}

const SECTIONS: HelpSection[] = [
  {
    title: 'Dashboard',
    keywords: ['dashboard', 'today', 'due', 'overview', 'home', 'map', 'metric', 'recent'],
    content: `DASHBOARD: Home screen. Metric cards: follow-ups due today, activities last 7 days, open pipeline value. Due Today card: today's incomplete follow-ups — click circle to complete, click title to open customer. Recent Activities: 10 latest activities, click to open customer. Open Opportunities: all open deals sorted by revenue, click to open. Belgium map: dot per city, size = customer count, hover for count. Search bar searches customers/contacts/opportunities/activities; press / to focus.`,
  },
  {
    title: 'Getting Started',
    keywords: ['start', 'setup', 'install', 'login', 'sign in', 'first time', 'begin', 'how to use', 'navigate'],
    content: `GETTING STARTED: Sign in with Microsoft account. First launch triggers D365 sync (a few minutes). Dashboard is home screen. Sidebar navigation: Customers, Sync, Follow-Ups, Opportunities, Revenue Overview, Timeline. Recent Customers section in sidebar for quick access. Ctrl+K = command palette. ? = all shortcuts. N = new item. / = focus search. 1–6 = navigate sidebar pages. Profile photo in sidebar = user menu (settings, help, shortcuts, logout). Works offline — changes queue and sync when back online.`,
  },
  {
    title: 'Customers',
    keywords: ['customer', 'account', 'company', 'companies', 'organization', 'client', 'search', 'filter', 'sort'],
    content: `CUSTOMERS: Full customer list. Click row to open detail page. Search by name (press / to focus). Sort: Last Activity / Name / City / Industry, toggle asc/desc. Filter (press F): Status, Owner, Industry, Segment, Country, No recent activity, Favorites. Bookmark: hover row > bookmark icon; find via Favorites filter. Customer detail tabs: Overview (profile, ARR, cloud status, notes), Activities, Contacts, Follow-Ups, Opportunities.`,
  },
  {
    title: 'Activities',
    keywords: ['activit', 'meeting', 'call', 'visit', 'email', 'task', 'log', 'note', 'appointment', 'kanban'],
    content: `ACTIVITIES: Logged interactions — Meeting, Visit, Call, Note. Create: Customer > Activities tab > "Log Activity" or press N. Fields: Type, Subject (required), Description, Date/Time (Meeting/Visit = start+end, Call/Note = date only), Contact (optional). View: timeline newest-first, shows type icon, subject, description preview, date, contact, creator. Edit: pencil icon. Delete: trash icon. Kanban board: Open / Completed / Rejected / Expired columns — drag to change status, empty columns collapse. Notes appear above kanban in list view. Date filter top-right. Default type: Settings > Data & Defaults. Auto-syncs to D365.`,
  },
  {
    title: 'Follow-Ups',
    keywords: ['follow', 'followup', 'follow-up', 'reminder', 'pending', 'due', 'task', 'overdue'],
    content: `FOLLOW-UPS: Tasks/reminders for customers. Create from Customer > Follow-Ups tab or global Follow-Ups sidebar page (press N). Fields: Title (required), Description, Due Date (required). Customer view: Open (sorted by due date) / Completed. Global view: Overdue (red) / Upcoming / Completed — all paginated. Complete: click checkbox. Edit: pencil. Delete: trash. Red badge on sidebar link = overdue count. Alerts in Settings > Notifications: reminder days in advance (0–14), overdue/due-today alerts on launch. Syncs to D365.`,
  },
  {
    title: 'Contacts',
    keywords: ['contact', 'person', 'people', 'stakeholder', 'individual', 'primary'],
    content: `CONTACTS: People at customer companies. View: Customer > Contacts tab — shows name, title, email, phone. Search by name. Add (press N): First/Last Name (required), Title, Email, Phone, Mobile, Notes. Edit: pencil. Delete: trash. Primary contact: star icon on a contact card (one per customer) — appears in Revenue Overview with star. Link contact to an activity when logging. Two-way sync with D365 (pull/push/delete).`,
  },
  {
    title: 'Opportunities',
    keywords: ['opportunit', 'deal', 'pipeline', 'sales', 'quote', 'proposal', 'win', 'lose', 'stage', 'revenue'],
    content: `OPPORTUNITIES: Sales deals. Views: Customer > Opportunities tab (per customer) or global Opportunities sidebar page (all). Shows subject, company, stage/probability, vendor, status (Open/Won/Lost), revenue, expiration. Search by subject/company/vendor. Sort: created date/subject/revenue/expiration/stage. Filter: company, stage, status, expiration. Paginated (10/25/50/100). Create (press N): Subject (required), Status, Stage, Probability (auto-filled), Sell Type, Primary Vendor, Revenue, Expiration, Customer Need, Contact. Edit: pencil. Delete: trash. Stale warning if no updates for N days (Settings > Notifications). Syncs to D365.`,
  },
  {
    title: 'Revenue Overview',
    keywords: ['revenue', 'invoice', 'arr', 'billing', 'payment', 'finance', 'money', 'euro', 'amount', 'cloud'],
    content: `REVENUE OVERVIEW: ARR financial dashboard. Table: customer name, primary contact, phone, email, cloud status, language, ARR (EUR). Search by customer name. Filter: Cloud Customer (Yes/No/All), Language, ARR range (min/max). Sort: ARR / Name / Cloud / Language. Column picker to show/hide columns. Export to Excel (respects active filters and columns). Paginated (10/25/50/100).`,
  },
  {
    title: 'Analytics',
    keywords: ['analytic', 'report', 'chart', 'graph', 'statistic', 'performance', 'metric', 'trend', 'insight'],
    content: `ANALYTICS: Four tabs. Personal: activities logged, follow-up completion rate + avg time, open pipeline value, win rate, activity timeline chart — period picker (7d/30d/3m/6m/1y). Pipeline: stage funnel, forecast by month (total + probability-weighted), expiring soon (7/30d), avg deal size by sell type and vendor. Customers: no-recent-activity counts (30/60/90d), contact coverage, cloud adoption %, ARR distribution buckets, ARR by industry/segment/country (dropdown), top 10 customers by ARR. Activity: type mix (self vs team), call direction breakdown, activity by day-of-week, 10 most active customers.`,
  },
  {
    title: 'Sync',
    keywords: ['sync', 'synchroni', 'd365', 'dynamics', 'import', 'export', 'update', 'refresh', 'offline', 'pending'],
    content: `SYNC: Two-way with Microsoft D365. Pull: downloads customers/contacts/opportunities from D365. Push: uploads local activities/follow-ups/opportunities to D365. Auto-sync: configurable interval 5–120 min, optional on-launch sync (Settings > Sync). Manual: Sync sidebar page > Run Full Sync (disabled offline). Sync page shows: last sync time, pending counts (activities/follow-ups/opportunities), online/offline status, pending queue table (type/name/action), sync history (type/status/time/records/errors). Pending items show badge on their lists. Sidebar badge = pending count. Fully usable offline — changes queue automatically.`,
  },
  {
    title: 'Settings',
    keywords: ['setting', 'preference', 'config', 'theme', 'dark mode', 'light mode', 'appearance', 'notification', 'keybinding'],
    content: `SETTINGS (6 tabs). General: check for updates, autostart, clear database, reset settings, version info. Appearance: theme (Light/Dark/System), accent color (Blue/Purple/Green/Orange/Red/Pink), sidebar default state, sidebar item order and visibility. Data & Defaults: default activity type, default customer sort, no-recent-activity threshold (7–365d). Notifications: follow-up reminder (0–14d before due), overdue/due-today alerts on launch, sync/connectivity/update notifications, stale opportunity threshold (7–180d). Sync: auto-sync on launch, sync interval, pending sync interval (all 5–120 min). Keybindings: view/customize all shortcuts, conflict detection, reset individual or all.`,
  },
  {
    title: 'Timeline',
    keywords: ['timeline', 'history', 'chronolog', 'recent', 'feed', 'all activities'],
    content: `TIMELINE: Chronological feed of all activities, follow-ups, and opportunities across every customer. Each event shows type, subject, customer, and details. Click customer name to open their detail page. Search by subject or customer name (updates as you type). Access via sidebar, Ctrl+K, or assigned number shortcut.`,
  },
  {
    title: 'Shortcuts',
    keywords: ['shortcut', 'keyboard', 'hotkey', 'key binding', 'ctrl', 'cmd', 'keybinding'],
    content: `SHORTCUTS: Ctrl+K = command palette (search anything, run any action). N = new item (activities/follow-ups/contacts/opportunities). / = focus search bar. ? = show all shortcuts. 1–6 = navigate sidebar pages. F = open filter panel (on pages with filters). Esc = close panels/dialogs. Customize in Settings > Keybindings: click shortcut > press new key > conflict detection warns on duplicates. Reset individual or all shortcuts to defaults.`,
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
