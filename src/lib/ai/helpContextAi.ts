// Compact knowledge base for the AI assistant — covers every page and feature
// in the app so Iris can answer questions about anything in it. Kept dense to
// limit prompt tokens, but detailed enough to answer accurately. Only the
// keyword-matched sections are injected per message, so adding sections is cheap.
// The human-readable versions live in docs/help/*.md — keep this in sync with them.

interface HelpSection {
  title: string;
  content: string;
  keywords: string[];
}

const SECTIONS: HelpSection[] = [
  {
    title: 'Dashboard',
    keywords: ['dashboard', 'today', 'due', 'overview', 'home', 'map', 'belgium', 'metric', 'metric card', 'recent', 'recent activity', 'landing', 'widget', 'next 7 days', 'week', 'strip', 'stale', 'pipeline', 'quick add'],
    content: `DASHBOARD: The home/landing screen (set which page opens on launch in Settings > Appearance > Sidebar & navigation > Default landing tab). TOP: a greeting with your name and today's date, plus a "Quick add" button (top-right) — a dropdown with "Log activity" and "New follow-up" (each asks you to pick a customer, then opens the new-item form) and "New opportunity" (opens the new-opportunity form). Below it a full-width "Search everything" bar searches customers, contacts, opportunities, activities and follow-ups at once — type for instant results grouped by category, arrow keys to navigate, Enter to open; press / to focus it. MAIN ROW (three columns): (1) a BELGIUM MAP with a dot per city where you have customers — dot size = customer count, hover for the exact number, click a city to open Customers filtered to it; (2) four METRIC CARDS — "Total Activities" (all-time count, with % change vs the last 7 days), "Opportunities" (all-time count, % vs last 7 days), "Open Pipeline" (total value of your open deals in euro, % vs 7 days ago) and "My Customers" (number of accounts you manage); (3) two stacked panels — "Recent Activity" (your latest 15 activities and opportunity updates, newest first; each row shows a type icon, subject, customer, status badge and date — click to open that customer's Activities or Opportunities tab) and "Stale Opportunities" (your open deals untouched for 30+ days, each with a days-stale badge and value — click to open; cobwebs creep in on very stale deals as a playful nudge). BOTTOM — the "NEXT 7 DAYS" widget: a strip of seven day-columns starting today (today is highlighted). Each column lists your incomplete follow-ups due that day (up to 3, then "+N more"), showing the follow-up title and its customer; click one to jump to that customer's Follow-Ups tab. The badge in the strip header is the total follow-ups due across the week; empty days show a dash.`,
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
    content: `SHORTCUTS: Ctrl+K (Cmd+K on Mac) = command palette — type any action or page name to jump instantly; arrow keys to navigate, Enter to select. The command palette also searches customers (by name, account number, BCN, city) and contacts (by name, email, job title) and jumps straight to them. N = new item (activity/follow-up/contact/opportunity). / = focus search bar. ? = show all shortcuts. Number keys 1–6 = navigate sidebar pages (mapped to your sidebar order). Ctrl+B (Cmd+B) = collapse/expand the sidebar. F = open filter panel on pages with filters. Esc = close panels/dialogs. CUSTOMIZE in Settings > Keybindings: click a shortcut, press the new combination — conflict detection warns on duplicates; reset individual shortcuts or all to defaults.`,
  },
  {
    title: 'Assistant (Iris)',
    keywords: ['iris', 'assistant', 'chatbot', 'sparkles', 'who are you', 'what can you do'],
    content: `ASSISTANT (Iris): The app's built-in AI helper — that's me. I'm available to admins only, opened from the sparkles button on the right edge of the window, which slides out a chat panel. I answer questions about how this CRM works and look up live details about your customers, contacts, opportunities, activities and revenue from your local data. I run on a local AI model (Ollama) that downloads once on first use (progress is shown). I can only READ data — I never change anything. Use the clear button to reset the chat and the stop button to halt a reply. I only help with this CRM and your data, not unrelated topics.`,
  },
  {
    title: 'Profile & Account',
    keywords: ['profile', 'avatar', 'photo', 'birthday', 'job title', 'log out', 'logout', 'sign out', 'user menu', 'my info'],
    content: `PROFILE: Click your photo and name at the bottom of the sidebar to open your profile card. It shows your photo, name, role, job title, email, location and birthday — all pulled from your Microsoft 365 / Dynamics 365 account (edit your details there or in Settings). From this card you can open Account settings, Help, Keyboard shortcuts, and — for admins only — the Admin panel and Debug page, or Log out. The current app version is shown at the bottom.`,
  },
  {
    title: 'Notifications & Updates',
    keywords: ['notification', 'toast', 'updater', 'update available', 'new version', 'autostart', 'walkthrough', 'tour', 'reminder', 'status pill'],
    content: `ALERTS & UPDATES: On launch you can be alerted to overdue and due-today follow-ups and stale opportunities (toggle in Settings > Notifications). Toasts confirm syncs and connectivity changes; the title bar shows a live Online/Offline status pill. The app checks for updates automatically — when one is ready an "Update available" button appears in the sidebar footer (with download progress); installing it restarts the app and then shows the new version's changelog. Settings > General has an Autostart-on-startup option. A one-time guided walkthrough runs on first launch and can be replayed from settings. Everything works offline — changes queue locally and sync on reconnect.`,
  },
  {
    title: 'Admin & Debug',
    keywords: ['admin', 'administrator', 'database', 'sql', 'user management', 'power bi discovery', 'debug', 'developer console'],
    content: `ADMIN (admins only): The Admin panel (opened from your profile menu) has tabs for system Analytics, User management, Data export/import, a Database explorer (inspect tables and run read-only queries), a Power BI schema viewer and discovery tools, and Revenue sync configuration. The Debug page adds a live app console, sync logs/stats, and revenue-cache utilities. Regular users never see these pages.`,
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
