# Customers

The Customers page is your central hub for managing all your customer accounts. It shows your customer list on the left and the selected customer on the right, so you can move through accounts without leaving the page.

## The Toolbar

At the top you'll find:

- **Customer count** — how many customers match, out of the total
- **All / Cloud / Non-cloud** — limit the list to cloud customers, non-cloud customers or everyone. This is remembered and stays as it is when you clear filters.
- **Favorites** — show only the customers you bookmarked
- **Filters** — open every filter in a small panel (see below). A number shows how many filters are on.

## The Customer List

Each row shows:

- The company's initials and name
- A coloured **health** dot with the score, the **city** and how long ago the **last activity** was
- The yearly recurring revenue (**ARR**) on the right

Click a row to open that customer on the right. Use the **↑** and **↓** keys to move through the list (it turns the page for you), and **Enter** to jump to the customer's tabs. Drag the thin line between the list and the customer to make the list wider or narrower.

Below the list, the pager shows which customers you're looking at (for example "11–20 of 63") with buttons for the previous and next page.

### Right-click menu

Right-click a customer in the list to open it, add an activity, follow-up or opportunity, add or remove it from favorites, copy its account number, or open it in Dynamics 365.

## Health Score

Each customer gets an automatic health score between 0 and 100 that shows at a glance how engaged the relationship is. Hover the score at the top of a customer to see the breakdown.

The score combines three signals:

- **Recency** (40%) — how long since the last contact or activity
- **Pipeline** (30%) — how many open opportunities the account has
- **Frequency** (30%) — how many activities were logged in the last 90 days

Scores are grouped into three tiers:

- **Healthy** (green, 70+) — recently engaged, active pipeline
- **At risk** (amber, 40–69) — slipping; check in soon
- **Critical** (red, under 40) — cold or no recent contact

The score updates automatically after every activity, opportunity, or sync.

## Searching

Use the **Search customers…** box at the top of the list to find customers by name, account number, BCN, city, email, or industry. Results update as you type. Press **/** to jump to the search box.

## Sorting

Click the sort button next to the search box to change how customers are ordered:

- **Last activity** — Most recently active customers first (default)
- **Health** — Highest or lowest health score first
- **Name** — Alphabetical order
- **City** — Grouped by location
- **Industry** — Grouped by industry

In the same menu you can switch between descending and ascending.

## Filtering

Press **F** or click **Filters** in the toolbar. You can filter by:

- **Status** — Active or Inactive
- **Owner** — the assigned sales rep
- **Industry**, **Segment**, **Country** and **City**
- **Customer Success Manager**, **AWS owner**, **Azure owner**, **Inside sales owner** and **Account manager**
- **Health** — Healthy, At risk, or Critical
- **Activity** — customers without any activity for a while

Active filters show as small labels above the list — click one to remove it, or click **Clear all** to reset.

### Match all or match any

As soon as two or more filters are on, the filter panel shows how they combine:

- **Match all** — a customer must meet *every* filter to show up. This is the default.
- **Match any** — a customer shows up if it meets *at least one* filter. Useful for questions like "show me everything in Belgium plus everything in Retail".

Your choice is remembered between sessions. The search box always applies on top of your filters, in both modes.

## Bookmarking Favorites

Hover over a customer row and click the **bookmark icon** to mark it as a favorite. Favorites appear in the sidebar and can be shown on their own with the **Favorites** button.

## The Selected Customer

The top of the customer shows its name and status, with its email, phone and website underneath. Click the email or phone to copy it, or the website to open it. On the right:

- **Open in Dynamics** — opens the account in Dynamics 365 in your browser
- **Follow-up** — add a follow-up for this customer
- **Log activity** — log a meeting, visit, call or note

Below that, a row of numbers shows the **health** score, **ARR** (live Power BI numbers when available, otherwise Dynamics 365), and the number of **activities**, **open follow-ups** and **contacts**.

The tabs underneath show everything else:

### Overview
Recent activity for this customer, the primary contact with their email and phone, and the open opportunities.

### Activities
All logged interactions with this customer. Read more in the **Activities** help section.

### Contacts
The people at this customer's company. Read more in the **Contacts** help section.

### Follow-Ups
Tasks and reminders for this customer. Read more in the **Follow-Ups** help section.

### Opportunities
Sales deals for this customer. Read more in the **Opportunities** help section.

### Revenue
ARR and how it moved over time. Read more in the **Revenue Overview** help section.

### Details
Every company field the CRM holds, grouped into **Company**, **Identifiers**, **Contact** and **Account team**. Click any field to copy it.

- **Edit** on Identifiers changes the **MPN ID** and **APN ID**.
- **Edit** on Account team lets you assign a **Customer Success Manager**, **AWS owner**, **Azure owner** and **Inside sales owner** from the Cloud Belux Sales team.

Both save back to Dynamics 365 immediately.

## Navigation Tips

- Use the **Favorites** and **Recent** sections in the sidebar to jump back to customers
- Press number keys (**1-9**) to quickly navigate between sidebar pages
- Use **Ctrl+K** to search for a specific customer or action
