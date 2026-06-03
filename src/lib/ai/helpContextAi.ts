// Compact knowledge base for the AI assistant.
// Kept dense to limit prompt tokens, but detailed enough to answer accurately.
// The human-readable versions live in docs/help/*.md — keep this in sync with them.

interface HelpSection {
  title: string;
  content: string;
  keywords: string[];
}

const SECTIONS: HelpSection[] = [
  {
    title: 'Dashboard',
    keywords: ['dashboard', 'today', 'due', 'overview', 'home', 'map', 'metric', 'recent', 'landing'],
    content: `DASHBOARD: The home/landing screen (configurable in Settings > Appearance > Default landing tab). Top: a greeting with today's date and a full-width "Search everything" bar that searches customers, contacts, opportunities, and activities at once — type for instant results grouped by category, arrow keys to navigate, Enter to open; press / to focus it. Three metric cards: (1) follow-ups due today (yours, not completed), (2) activities you logged in the last 7 days, (3) total pipeline value across all open opportunities. Cards below: "Due Today" lists your incomplete follow-ups due today — click the circle to complete instantly, click the title to open that customer's follow-ups tab; "Recent Activities" shows the 10 most recent activities system-wide, click a row to open that customer; "Open Opportunities" lists all Open deals sorted by estimated revenue (highest first), click to open. A Belgium map shows a dot per city where you have customers — dot size = customer count, hover for the exact number.`,
  },
  {
    title: 'Getting Started',
    keywords: ['start', 'setup', 'install', 'login', 'sign in', 'first time', 'begin', 'how to use', 'navigate', 'walkthrough', 'tour', 'offline'],
    content: `GETTING STARTED: Sign in with your Microsoft account. The first launch runs an initial sync pulling your data from Dynamics 365 (a few minutes), then offers a ~1-minute guided walkthrough (skippable). You land on the Dashboard. The left sidebar is the main navigation: Customers, Sync, Follow-Ups, Opportunities, Revenue Overview, Timeline (and Analytics/Insights). Collapse it via the button at the bottom to show icons only. A "Recent Customers" section under the nav lets you jump back to recently viewed customers and expand quick links to their tabs. Your Microsoft 365 profile photo at the bottom opens the user menu: Account settings, Help, Keyboard shortcuts, Log out. Quick actions: Ctrl+K (Cmd+K on Mac) = command palette (search customers/contacts or run any action); ? = all shortcuts; N = new item on most pages; / = focus search; number keys 1–6 = jump between sidebar pages. Works fully offline — changes are saved locally and sync automatically when you reconnect; sidebar badges show how many items are waiting.`,
  },
  {
    title: 'Customers',
    keywords: ['customer', 'account', 'company', 'companies', 'organization', 'client', 'search', 'filter', 'sort', 'health', 'health score', 'cloud', 'bookmark', 'favorite', 'owner'],
    content: `CUSTOMERS: Full customer list. Each row shows company name + Active/Inactive badge, industry, city, assigned owner, a health score, and last activity date. Click a row to open the detail page. HEALTH SCORE: an automatic 0–100 engagement rating (hover for breakdown) combining Recency (40%, time since last contact), Pipeline (30%, open opportunities), Frequency (30%, activities in last 90 days). Tiers: Healthy (green, 70+), At risk (amber, 40–69), Critical (red, <40). Recomputes after every activity/opportunity/sync. SEARCH (press /): by name, account number, BCN, city, email, or industry. SORT: Last Activity (default), Health, Name, City, Industry — toggle asc/desc. FILTER (press F): Status, Owner, Industry, Segment, Country, No recent activity, Health tier, Favorites — combinable; active filters show as removable badges, "Clear all" resets. BOOKMARK: hover a row, click the bookmark icon; find via the Favorites filter. DETAIL TABS: Overview (profile, status, industry, location, owner, ARR, editable phone/email/website, notes, a Health card with the 3 sub-scores, a "Cloud Customer: Yes" indicator when flagged, and a "Cloud and Services Contacts" card to assign Customer Success Manager / AWS Owner / Azure Owner / Inside Sales Owner from the Cloud Belux Sales team — saves to D365 immediately), Activities, Contacts, Follow-Ups, Opportunities.`,
  },
  {
    title: 'Activities',
    keywords: ['activit', 'meeting', 'call', 'visit', 'email', 'task', 'log', 'note', 'appointment', 'kanban', 'interaction'],
    content: `ACTIVITIES: Records of customer interactions. Four types, each color-coded: Meeting (scheduled, in-person or virtual), Visit (physical site visit), Call (phone), Note (internal update, not a direct interaction). LOG: customer's Activities tab > "Log Activity" or press N. Fields: Type; Subject (required); Description (notes/outcomes/next steps); Date/Time (Meetings & Visits take a start AND end time, Calls & Notes take just a date); Contact (optional — link a specific person). Set a default type in Settings > Data & Defaults. VIEW: timeline newest-first showing type icon/color, subject, description preview, date/time, linked contact, and creator. Edit via pencil, delete via trash (confirm). KANBAN BOARD: Meetings/Visits/Calls show in 4 columns — Open, Completed, Rejected, Expired — drag cards between columns to change status; empty columns auto-collapse (click header to toggle); headers show counts. Notes appear in a separate list above the board. A date filter (top-right) narrows by time range. Activities auto-sync to D365; a badge marks items Pending sync or Sync error (retries next sync).`,
  },
  {
    title: 'Follow-Ups',
    keywords: ['follow', 'followup', 'follow-up', 'reminder', 'pending', 'due', 'task', 'overdue', 'upcoming'],
    content: `FOLLOW-UPS: Action items/reminders tied to a customer. CREATE from a customer's Follow-Ups tab ("Add Follow-Up" or N) or the global Follow-Ups sidebar page ("New Follow-Up", then pick the customer). Fields: Title (required), Description, Due Date (required). CUSTOMER VIEW: Open (sorted by due date) and Completed. GLOBAL VIEW: Overdue (highlighted red), Upcoming (not yet due), Completed — each section paginated. Complete by clicking the checkbox (moves to Completed). Edit via pencil, delete via trash (confirm). ALERTS: a red badge on the Follow-Ups sidebar link shows the overdue count; on launch you can be alerted to overdue/due-today items (Settings > Notifications), and you can set a reminder 0–14 days before the due date. Syncs to D365 with Pending/error badges like activities.`,
  },
  {
    title: 'Contacts',
    keywords: ['contact', 'person', 'people', 'stakeholder', 'individual', 'primary', 'decision maker'],
    content: `CONTACTS: The people at a customer's company. VIEW on the customer's Contacts tab — shows name, job title, email, phone; search by name. ADD ("Add Contact" or N). Fields: First Name (required), Last Name (required), Job Title (syncs to D365 Job Functions), Country (Belgium/Netherlands/Luxembourg), Contact Type (from D365), Cloud Contact (Yes/No flag), Email, Phone (office), Mobile (cell), Notes. Edit via pencil, delete via trash (confirm). PRIMARY CONTACT: one per customer — hover a contact card and click the star; it appears atop the Revenue Overview with a star icon. Setting a new primary clears the old one; syncs to D365. When logging an activity you can link the involved contact to track interaction history. Two-way D365 sync: pull (appears after sync), push (added/edited contacts sent immediately or on next sync if offline), delete (also removes from D365).`,
  },
  {
    title: 'Opportunities',
    keywords: ['opportunit', 'deal', 'pipeline', 'sales', 'quote', 'proposal', 'win', 'lose', 'lost', 'won', 'stage', 'revenue', 'vendor', 'stale'],
    content: `OPPORTUNITIES: Sales deals / potential revenue. VIEW two ways: per-customer (customer's Opportunities tab) or global (Opportunities sidebar page, paginated). Each row: Subject (deal name), Company, Stage & Probability, Primary Vendor, Status (Open=blue, Won=green, Lost=red), Estimated Revenue & Expiration. GLOBAL PAGE: search by subject/company/vendor or opportunity ID (OPP-…); sort by created date/subject/revenue/expiration/stage (asc/desc); filter by Company (dropdown lists only companies that have deals), Stage, Status, Expiration (expired vs active), and by Primary or Secondary Owner; filters show as removable badges, "Clear all" resets; choices persist between sessions. Rows-per-page: 10/25/50/100 (remembered). CREATE ("New Opportunity" or N). Fields: Subject (required), Status (Open/Won/Lost), Stage (Prospecting, Qualification, Proposal, Negotiation, etc.), Probability (auto-filled from stage), Sell Type (New business, Add-on, etc.), Primary Vendor, Estimated Revenue, Expiration Date, Customer Need, Related Contact. Edit via pencil — keep stage/status current. STALE: a warning icon flags deals open too long without updates (threshold in Settings > Notifications, 7–180 days). Delete via trash (confirm). Auto-syncs to D365 on create/update/delete (queued if offline); Pending/error badges shown.`,
  },
  {
    title: 'Revenue Overview',
    keywords: ['revenue', 'arr', 'billing', 'payment', 'finance', 'money', 'euro', 'amount', 'cloud', 'language', 'export'],
    content: `REVENUE OVERVIEW: ARR (Annual Recurring Revenue) financial dashboard for all customers — useful for pipeline reviews, quota, and reporting. Table columns: Customer name, Contact (most recent contact person), Phone, Email, Cloud Customer (Yes/No), Language (preferred), ARR (in Euro, pulled from the Power BI dashboard on every sync). Search by customer name. FILTER: Cloud Customer (Yes/No/All), Language, ARR range (min and/or max) — active filters show as removable badges. SORT: ARR (default highest first), Name, Cloud Customer, Language. COLUMN PICKER: choose visible columns (saved). EXPORT: download the current view as Excel (.xlsx) — respects active filters and column selection. Paginated: 10/25/50/100 rows per page.`,
  },
  {
    title: 'Analytics',
    keywords: ['analytic', 'report', 'chart', 'graph', 'statistic', 'performance', 'metric', 'trend', 'insight', 'forecast', 'funnel', 'win rate'],
    content: `ANALYTICS: Visual overview from already-synced local data, four tabs. PERSONAL (period picker: 7d/30d/3m/6m/1y): My Activities (count vs previous period), Follow-Up Completion (count + avg time to complete), Open Pipeline (total open opportunity value), Win Rate (% of closed deals won), Activity Timeline (day-by-day chart). PIPELINE (team-wide, no names): Stage Funnel (open deals per stage Prospecting→Purchased), Forecast by Month (total and probability-weighted revenue by expiration), Expiring Soon (deals closing in 7/30 days), avg deal size By Sell Type / By Vendor. CUSTOMERS: No Recent Activity (active customers idle 30/60/90 days), Contact Coverage (customers with ≥1 contact), Cloud Adoption (% cloud customers by segment), ARR Distribution (No ARR, <€10k, €10k–50k, €50k–200k, €200k+), ARR by industry/segment/country (dropdown), Top 10 by ARR. ACTIVITY: Activity Type Mix (you vs team totals), Call Direction (Outgoing/Incoming/Unknown), Activity by Day of Week, 10 Most Active Customers.`,
  },
  {
    title: 'Sync',
    keywords: ['sync', 'synchroni', 'd365', 'dynamics', 'import', 'export', 'update', 'refresh', 'offline', 'pending', 'power bi', 'scope', 'queue'],
    content: `SYNC: Two-way sync with Microsoft Dynamics 365. PULL downloads customers, contacts, and opportunities from D365 plus ARR from the Power BI dashboard. PUSH uploads your locally created/updated activities, follow-ups, and opportunities. AUTO-SYNC runs in the background; configure in Settings > Sync: Pause auto-sync, Auto-sync on launch, Sync on window focus (debounced to once per 5 min), Sync interval (5–120 min), Pending push interval (5–120 min), Power BI refresh interval (30–720 min), Show sync toasts; quick-preset buttons set common values, out-of-range values are clamped and shown. SYNC SCOPE toggles (Settings > Sync > Sync scope): "Customers & activities (D365)", "Revenue & insights (Power BI)", "Push pending changes" — turning one off skips it in every sync; manual buttons honor scopes too. HISTORY RETENTION: auto-cleaned on start, keep 7–365 days (default 90). MANUAL: Sync sidebar page > "Run Full Sync" (disabled offline). The page shows last sync time, pending counts (activities/follow-ups/opportunities), online/offline status, a paginated Pending Queue (type, name, action create/update/delete), and a Sync History table (type, status Running/Success/Partial/Error, start time, records pulled/pushed, error details). The Sync sidebar link shows an orange badge of pending items. Fully usable offline — changes queue and sync on reconnect.`,
  },
  {
    title: 'Settings',
    keywords: ['setting', 'preference', 'config', 'theme', 'dark mode', 'light mode', 'appearance', 'notification', 'keybinding', 'accent', 'font', 'density', 'autostart', 'update'],
    content: `SETTINGS (six tabs; open from the user menu or its shortcut). GENERAL: check for updates (download & install), Autostart on computer startup, Clear database (re-sync afterward), Reset settings, Version info (app + DB version, copyable). APPEARANCE — Theme & colors: Theme (Light/Dark/System, hover to preview), Auto-theme by time of day (dark in evening/light in morning, configurable hours), Accent color (Blue/Purple/Green/Orange/Red/Pink, hover to preview), Custom accent hex (e.g. #ff6b35), High contrast; Layout & typography: Density (Comfortable/Cozy/Compact), Font size (Small/Medium/Large), UI font (DM Sans/System/Serif/Monospace), Table row density, Reduce motion; Sidebar & navigation: Default landing tab, Remember last sidebar state, Sidebar expanded by default, Sidebar order (drag to reorder, eye icon to show/hide tabs); plus Reset all and per-section resets. DATA & DEFAULTS: Default activity type, Default customer sort, No-recent-activity threshold (7–365 days). NOTIFICATIONS: Follow-up reminder (0–14 days before due), Overdue alerts on launch, Due-today alerts on launch, Sync notifications, Connectivity alerts, Update alerts, Stale opportunity reminder (7–180 days). SYNC: see the Sync section. KEYBINDINGS: view all shortcuts by section, customize (click a shortcut, press a new combo), conflict detection, reset individual or all.`,
  },
  {
    title: 'Timeline',
    keywords: ['timeline', 'history', 'chronolog', 'recent', 'feed', 'all activities'],
    content: `TIMELINE: One chronological feed of all activities, follow-ups, and opportunities across every customer. Activities = meetings/calls/visits/notes; follow-ups show open or done; opportunities show stage, primary vendor, and estimated revenue. Each event shows the customer it belongs to — click the customer name to open their detail page. Filter via the search bar (by subject or customer name; updates as you type). Open it from the sidebar, the command palette (Ctrl+K → "Go to Timeline"), or its assigned number shortcut.`,
  },
  {
    title: 'Shortcuts',
    keywords: ['shortcut', 'keyboard', 'hotkey', 'key binding', 'ctrl', 'cmd', 'keybinding', 'command palette'],
    content: `SHORTCUTS: Ctrl+K (Cmd+K on Mac) = command palette — type any action or page name to jump instantly; arrow keys to navigate, Enter to select. N = new item (activity/follow-up/contact/opportunity). / = focus search bar. ? = show all shortcuts. Number keys 1–6 = navigate sidebar pages (mapped to your sidebar order). F = open filter panel on pages with filters. Esc = close panels/dialogs. CUSTOMIZE in Settings > Keybindings: click a shortcut, press the new combination — conflict detection warns on duplicates; reset individual shortcuts or all to defaults.`,
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
