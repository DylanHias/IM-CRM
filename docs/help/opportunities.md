# Pipeline

Opportunities represent sales deals and potential revenue for your customers. They help you track your pipeline from initial prospecting to close.

## Viewing Opportunities

You can view opportunities in two places:

- **Customer view** — Go to a customer's **Opportunities** tab to see deals for that specific customer, with how many are open and their total value.
- **Pipeline** — Click **Pipeline** in the sidebar to see all opportunities across companies.

The Pipeline toolbar shows how many deals are open, their total value and their **weighted** value (each deal's value multiplied by its probability).

### List view

The list shows each deal's company, subject, stage and when it expires ("in 12d", or in red when it's overdue), with its value on the right. Won and Lost deals show their status.

Click a deal to see it on the right:

- The deal name, its status and the company (click the company to open it)
- A stage bar showing how far the deal has come
- **Annual revenue**, **Estimated MRR**, **Probability** and **Weighted** value
- **Deal** details (vendor, type, expiration, country) and **People** (contact, BCN, owners)
- The **Customer need**, and the latest activity with the company

Use **Edit** to change the deal, or **Won** / **Lost** to close it. Double-click a deal in the list to edit it straight away.

### Board view

Switch to **Board** in the toolbar to see one column per stage, each with the number of deals and their total value. Lost deals are left out. Click a card to edit it. Deals in **Billing Rejection** get a red border.

### Right-click menu

Right-click a deal in the list or on the board to open it, close it as Won or Lost, copy its opportunity ID or open it in Dynamics 365.

## Searching, Sorting & Filtering

On the Pipeline page you can:

- **Search** by subject, company name, vendor or opportunity ID, using the box above the list
- **Sort** with the button next to the search box, by created date, subject, revenue, expiration, or stage (ascending or descending)
- **Mine** — show only the opportunities you created
- **Filters** — open the filter panel to filter by **Stage**, **Status** (Open, Won, Lost), **Expiration** (expired or not), **Company**, **Primary owner** and **Secondary owner**. Choosing a stage on the board shows only that stage's column.

Your sort and filter choices are remembered between sessions.

### Match all or match any

As soon as two or more filters are on, the filter panel shows how they combine:

- **Match all** — an opportunity must meet *every* filter to show up. This is the default.
- **Match any** — an opportunity shows up if it meets *at least one* filter. Useful for questions like "show me everything at Qualified stage plus everything owned by Sarah".

Your choice is remembered between sessions. The search box always applies on top of your filters, in both modes.

## Pages

The list shows a page of deals at a time. The pager under the list shows which deals you're looking at, with buttons for the previous and next page.

## Creating an Opportunity

1. Go to a customer's **Opportunities** tab, the **Pipeline** page, or use **New** at the top of the sidebar
2. Click **New opportunity** or press **N**
3. The form opens with a list of steps on the left. Work through them with **Next** and **Back**, or click any step to jump straight to it:
   - **Customer** — the customer, the contact at that company, the BCN (filled in from the customer) and an optional secondary owner
   - **Deal** — the subject, the stage (click a stage; the chance of winning fills in by itself), single or cross sell, type, opportunity type and what the customer needs
   - **Vendor** — the primary vendor. Picking AWS or Microsoft adds the extra fields that vendor needs; they become required from the Qualified stage
   - **Financials** — country, currency, monthly and yearly revenue (fill in one and the other is worked out for you), the expected margin and the expiration date
   - **Review** — everything at a glance, with an **Edit** link per part
4. Each step shows how many required fields it has. The bottom of the form counts how many required fields are filled in.
5. Click **Create opportunity**. If something is still missing, the form jumps to **Review**, lists what is needed, and marks the steps that need attention in red.

## Updating an Opportunity

Click **Edit** on a deal (or double-click it in the list) to open the same form. It starts on **Review**, so you can check the deal and jump to the part you want to change. Click **Save** when you're done. While a deal is open, **Close as Won** and **Close as Lost** sit at the bottom of the steps list.

## Stale Opportunities

If an opportunity has been open for too long without updates, you'll see a **warning icon**. This helps you identify deals that may need attention. The number of days before an opportunity is flagged as stale can be configured in **Settings > Notifications**.

## Deleting an Opportunity

Click the **trash icon** and confirm to remove an opportunity.

## Sync Status

Opportunities sync to Dynamics 365 automatically. When you create, update, or delete an opportunity while online, the change is pushed to D365 immediately. If you're offline, the change is queued and will sync when you reconnect. You'll see a small badge on opportunities that are:

- **Pending sync** — Waiting to be sent to D365
- **Sync error** — Failed to sync (will retry on next sync)

Check the **Sync** page for more details on sync status.
