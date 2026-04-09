# Opportunities

Opportunities represent sales deals and potential revenue for your customers. They help you track your pipeline from initial prospecting to close.

## Viewing Opportunities

You can view opportunities in two ways:

- **Customer view** — Go to a customer's **Opportunities** tab to see deals for that specific customer
- **Global view** — Click **Opportunities** in the sidebar to see all opportunities across companies in one paginated list

Each opportunity row shows:

- **Subject** — The deal name or description
- **Company** — Which customer the deal belongs to
- **Stage & Probability** — Where the deal is in the sales process and its likelihood of closing
- **Primary Vendor** — The main vendor for the deal
- **Status** — Open (blue), Won (green), or Lost (red)
- **Estimated Revenue & Expiration** — The expected deal value and when it expires

## Searching, Sorting & Filtering

On the global Opportunities page you can:

- **Search** by subject, company name, or vendor
- **Sort** by created date, subject, revenue, expiration, or stage (ascending or descending)
- **Filter by Company** — the dropdown only shows companies that actually have opportunities
- **Filter by Stage** — narrow the list to a single stage

Active filters appear as badges you can click to clear individually, or use **Clear all** to reset everything. Your sort and filter choices are remembered between sessions.

## Pagination

The global Opportunities list is paginated. Use the page controls at the bottom to move between pages, and change the **Rows per page** dropdown to show 10, 25, 50, or 100 opportunities at a time. Your preference is remembered.

## Creating an Opportunity

1. Go to a customer's **Opportunities** tab (or the global Opportunities page)
2. Click **New Opportunity** or press **N**
3. Fill in the details:
   - **Subject** — Deal name (required)
   - **Status** — Open, Won, or Lost
   - **Stage** — Select the current sales stage (Prospecting, Qualification, Proposal, Negotiation, etc.)
   - **Probability** — Auto-filled based on the stage you select
   - **Sell Type** — Type of sale (New business, Add-on, etc.)
   - **Primary Vendor** — The main vendor for this deal
   - **Estimated Revenue** — Expected deal value
   - **Expiration Date** — When the opportunity expires
   - **Customer Need** — What the customer is looking for
   - **Related Contact** — Which person at the company is involved
4. Click **Save**

## Updating an Opportunity

Click the **pencil icon** to update any details. As a deal progresses, update the stage and status to keep your pipeline accurate.

## Stale Opportunities

If an opportunity has been open for too long without updates, you'll see a **warning icon**. This helps you identify deals that may need attention. The number of days before an opportunity is flagged as stale can be configured in **Settings > Notifications**.

## Deleting an Opportunity

Click the **trash icon** and confirm to remove an opportunity.

## Sync Status

Opportunities sync to Dynamics 365 automatically. When you create, update, or delete an opportunity while online, the change is pushed to D365 immediately. If you're offline, the change is queued and will sync when you reconnect. You'll see a small badge on opportunities that are:

- **Pending sync** — Waiting to be sent to D365
- **Sync error** — Failed to sync (will retry on next sync)

Check the **Sync** page for more details on sync status.
