# Table QoL: Sticky Headers + Column Visibility/Reordering

**Scope**: InvoiceList and ARR Overview tables only.

## 1. Sticky Table Headers

Add `position: sticky; top: 0; z-index: 10` to `<thead>` on both tables. Background uses existing `bg-muted/30` so rows scroll cleanly underneath.

## 2. Column Visibility & Reordering

### Column Config

Each table defines columns as an ordered array:

```ts
interface ColumnDef<F> {
  id: string;              // unique key (e.g. 'invoiceNumber')
  field: F | null;         // sortable field or null
  label: string;
  align: 'text-left' | 'text-center' | 'text-right';
  defaultVisible: boolean; // true for all initially
}
```

InvoiceList columns: `invoiceNumber`, `invoiceDate`, `invoiceDueDate`, `invoiceStatus`, `invoiceAmountInclTax`, `customerOrderNumber`.

ARR Overview columns: `name`, `contact`, `phone`, `email`, `cloudCustomer`, `language`, `arr`. The `#` (row number) column is always visible and not configurable.

### Settings Persistence

Add to `settingsStore`:

```ts
tableColumns: Record<string, { order: string[]; hidden: string[] }>;
```

Defaults to `{}` — when empty, tables use their built-in default order with all columns visible. Persisted via existing Zustand persist + DB mechanism.

Added to `DATA_DEFAULTS` and included in `SETTINGS_KEYS`.

### ColumnPicker Component

`src/components/ui/ColumnPicker.tsx` — reusable Popover:

- **Trigger**: Small icon button (Columns icon from lucide) placed next to existing table controls
- **Content**: List of columns with:
  - Eye/EyeOff toggle per column for visibility
  - GripVertical drag handle for reordering (native HTML drag-and-drop)
  - "Reset" link at bottom to clear saved preferences
- Calls `updateSetting('tableColumns', ...)` on every change

### Rendering

Both tables derive their visible, ordered columns by:
1. Reading `tableColumns[tableKey]` from settings store
2. Falling back to default column order if no preference saved
3. Filtering out hidden columns
4. If saved order is missing new columns (e.g. after app update), appending them at the end

Both `<thead>` and `<tbody>` render cells in the derived order.

### InvoiceList Changes

- Extract inline column array to a `INVOICE_COLUMNS` constant
- Add ColumnPicker button next to the filter bar
- Render thead/tbody cells based on derived column order
- Cell rendering uses a `renderCell(inv, columnId)` function

### ARR Overview Changes

- Extract inline column array to `ARR_COLUMNS` constant
- Add ColumnPicker button next to existing sort/filter controls
- Same pattern: derived column order, `renderCell(customer, columnId)` function
- `#` row-number column stays fixed (not part of column config)
