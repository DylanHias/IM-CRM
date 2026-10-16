'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { rowSlideIn } from '@/lib/motion';
import { Search, Download, Building2, User, X, ArrowUp, ArrowDown, Loader2, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { SortMenu } from '@/components/ui/sort-menu';
import { FilterField, FilterPopover } from '@/components/ui/filter-popover';
import { ColumnPicker, useColumnConfig } from '@/components/ui/ColumnPicker';
import type { ColumnDef } from '@/components/ui/ColumnPicker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCustomers } from '@/hooks/useCustomers';
import { useCustomerStore } from '@/store/customerStore';
import { useRevenueStore } from '@/store/revenueStore';
import { usePaginationPreference } from '@/hooks/usePaginationPreference';
import { TablePagination } from '@/components/ui/TablePagination';
import { useShortcutListener } from '@/hooks/useShortcuts';
import { useSettingsStore } from '@/store/settingsStore';
import { getEffectiveArr, type EffectiveArr } from '@/lib/revenue/effectiveArr';
import { cn } from '@/lib/utils';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { normalizeCity, getUniqueCities, displayCity } from '@/lib/utils/cityProvince';
import { toast } from 'sonner';
import type { Customer, Contact } from '@/types/entities';

type SortField = 'name' | 'cloudCustomer' | 'arr';

function formatArr(value: number | null, currency: string | null): string {
  if (value === null) return '—';
  const cur = currency ?? 'EUR';
  try {
    return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${cur} ${value.toLocaleString('nl-BE', { maximumFractionDigits: 0 })}`;
  }
}

function getDisplayContact(customerId: string, contacts: Contact[]): Contact | undefined {
  const customerContacts = contacts.filter((c) => c.customerId === customerId);
  return (
    customerContacts.find((c) => c.isPrimary) ??
    customerContacts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  );
}

function getPhone(customer: Customer, contacts: Contact[]): string {
  const contact = getDisplayContact(customer.id, contacts);
  return contact?.phone ?? contact?.mobile ?? customer.phone ?? '—';
}

function getEmail(customer: Customer, contacts: Contact[]): string {
  const contact = getDisplayContact(customer.id, contacts);
  return contact?.email ?? customer.email ?? '—';
}

function getContactLabel(customer: Customer, contacts: Contact[]): { name: string; isCompany: boolean; isPrimary: boolean } {
  const contact = getDisplayContact(customer.id, contacts);
  if (contact) return { name: `${contact.firstName} ${contact.lastName}`, isCompany: false, isPrimary: contact.isPrimary };
  return { name: customer.name, isCompany: true, isPrimary: false };
}

const ARR_COLUMNS: (ColumnDef & { field: SortField | null; align: string })[] = [
  { id: 'name', field: 'name', label: 'Customer Name', align: 'text-left' },
  { id: 'contact', field: null, label: 'Contact', align: 'text-left' },
  { id: 'phone', field: null, label: 'Phone', align: 'text-left' },
  { id: 'email', field: null, label: 'Email', align: 'text-left' },
  { id: 'cloudCustomer', field: 'cloudCustomer', label: 'Cloud Customer', align: 'text-center' },
  { id: 'arr', field: 'arr', label: 'ARR', align: 'text-right' },
];

const ARR_COLUMN_MAP = new Map(ARR_COLUMNS.map((c) => [c.id, c]));

function renderArrCell(
  customer: Customer,
  columnId: string,
  contacts: Contact[],
  router: ReturnType<typeof useRouter>,
  effective: EffectiveArr | undefined,
) {
  switch (columnId) {
    case 'name':
      return (
        <button
          onClick={() => router.push(`/customers?id=${customer.id}&tab=revenue`)}
          className="font-medium text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors text-left"
        >
          {customer.name}
        </button>
      );
    case 'contact': {
      const label = getContactLabel(customer, contacts);
      return (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {label.isCompany ? (
            <Building2 size={12} className="text-warning shrink-0" />
          ) : label.isPrimary ? (
            <Star size={12} className="text-warning fill-warning shrink-0" />
          ) : (
            <User size={12} className="text-primary shrink-0" />
          )}
          {label.name}
        </span>
      );
    }
    case 'phone':
      return <span className="text-muted-foreground">{getPhone(customer, contacts)}</span>;
    case 'email':
      return <span className="text-muted-foreground">{getEmail(customer, contacts)}</span>;
    case 'cloudCustomer':
      return customer.cloudCustomer === true ? (
        <Badge variant="default" className="text-xs">Yes</Badge>
      ) : customer.cloudCustomer === false ? (
        <Badge variant="secondary" className="text-xs">No</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    case 'arr': {
      if (!effective || effective.value === null) {
        return <span className="text-muted-foreground tabular-nums">—</span>;
      }
      const dotClass =
        effective.source === 'powerbi' ? 'bg-success' :
        effective.source === 'd365' ? 'bg-muted-foreground/50' : 'bg-transparent';
      const tip =
        effective.source === 'powerbi'
          ? `Live from Power BI${effective.asOfMonth ? ` · ${new Date(effective.asOfMonth).toLocaleDateString()}` : ''}`
          : effective.source === 'd365'
          ? 'Synced from D365 (no live value)'
          : '';
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums">
                <span className={cn('size-1.5 rounded-full shrink-0', dotClass)} aria-hidden />
                {formatArr(effective.value, effective.currency)}
              </span>
            </TooltipTrigger>
            {tip && <TooltipContent><span className="text-xs">{tip}</span></TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      );
    }
    default:
      return null;
  }
}

/** "All customers" table on the Reports → Revenue tab: ARR per customer with search, filters, columns and export. */
export function RevenueCustomersPanel() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('arr');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterCloud, setFilterCloud] = useState<'all' | 'yes' | 'no'>('all');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'powerbi' | 'd365'>('all');
  const [arrMin, setArrMin] = useState('');
  const [arrMax, setArrMax] = useState('');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const { pageSize, setPageSize, pageSizeOptions } = usePaginationPreference('revenueOverview');
  const { visibleColumns } = useColumnConfig('revenueOverview', ARR_COLUMNS);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useShortcutListener('focus-search', useCallback(() => searchInputRef.current?.focus(), []));

  useCustomers();
  const { customers: allCustomers, allContacts } = useCustomerStore();
  const revenueByBcn = useRevenueStore((s) => s.byBcn);
  const revenueByResellerAccount = useRevenueStore((s) => s.byResellerAccount);
  const walkthroughActive = useSettingsStore((s) => s.walkthroughActive);

  const effectiveByCustomerId = useMemo(() => {
    const map = new Map<string, EffectiveArr>();
    for (const c of allCustomers) {
      const revenue =
        (c.bcn ? revenueByBcn.get(c.bcn) : undefined) ||
        (c.accountNumber ? revenueByResellerAccount.get(c.accountNumber) : undefined) ||
        null;
      map.set(c.id, getEffectiveArr(c, revenue, 'LC'));
    }
    return map;
  }, [allCustomers, revenueByBcn, revenueByResellerAccount]);

  const countryOptions = useMemo(() => {
    const codes = new Set<string>();
    for (const c of allCustomers) {
      if (c.addressCountry) codes.add(c.addressCountry);
    }
    return Array.from(codes).sort();
  }, [allCustomers]);

  const citySourceCustomers = useMemo(
    () => filterCountry !== '' ? allCustomers.filter((c) => c.addressCountry === filterCountry) : allCustomers,
    [allCustomers, filterCountry],
  );

  const cityOptions = useMemo(
    () => getUniqueCities(citySourceCustomers.map((c) => c.addressCity)),
    [citySourceCustomers],
  );

  const activeFilterCount =
    (filterCloud !== 'all' ? 1 : 0) +
    (filterCountry !== '' ? 1 : 0) +
    (filterCity !== '' ? 1 : 0) +
    (filterSource !== 'all' ? 1 : 0) +
    (arrMin !== '' ? 1 : 0) +
    (arrMax !== '' ? 1 : 0);

  function clearFilters() {
    setFilterCloud('all');
    setFilterCountry('');
    setFilterCity('');
    setFilterSource('all');
    setArrMin('');
    setArrMax('');
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const min = arrMin !== '' ? Number(arrMin) : null;
    const max = arrMax !== '' ? Number(arrMax) : null;
    const rows = allCustomers.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (filterCloud === 'yes' && c.cloudCustomer !== true) return false;
      if (filterCloud === 'no' && c.cloudCustomer !== false) return false;
      if (filterCountry !== '' && c.addressCountry !== filterCountry) return false;
      if (filterCity !== '' && normalizeCity(c.addressCity) !== filterCity) return false;
      const effective = effectiveByCustomerId.get(c.id);
      const arrValue = effective?.value ?? null;
      if (filterSource === 'powerbi' && effective?.source !== 'powerbi') return false;
      if (filterSource === 'd365' && effective?.source !== 'd365') return false;
      if (min !== null && (arrValue === null || arrValue < min)) return false;
      if (max !== null && (arrValue === null || arrValue > max)) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      switch (sortBy) {
        case 'arr': {
          const aArr = effectiveByCustomerId.get(a.id)?.value ?? null;
          const bArr = effectiveByCustomerId.get(b.id)?.value ?? null;
          // Unavailable ARR always sinks to the bottom, regardless of sort direction.
          if (aArr === null && bArr === null) return 0;
          if (aArr === null) return 1;
          if (bArr === null) return -1;
          const cmp = aArr - bArr;
          return sortDir === 'asc' ? cmp : -cmp;
        }
        case 'name': {
          const cmp = a.name.localeCompare(b.name);
          return sortDir === 'asc' ? cmp : -cmp;
        }
        case 'cloudCustomer': {
          const aVal = a.cloudCustomer === true ? 1 : a.cloudCustomer === false ? 0 : -1;
          const bVal = b.cloudCustomer === true ? 1 : b.cloudCustomer === false ? 0 : -1;
          const cmp = aVal - bVal;
          return sortDir === 'asc' ? cmp : -cmp;
        }
      }
    });
  }, [allCustomers, searchQuery, filterCloud, filterCountry, filterCity, filterSource, arrMin, arrMax, sortBy, sortDir, effectiveByCustomerId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  async function handleExport() {
    if (isExporting) return;

    const date = new Date().toISOString().split('T')[0];

    if (isTauriApp()) {
      // Ask where to save immediately — before any heavy processing
      const { save } = await import('@tauri-apps/plugin-dialog');
      const savePath = await save({
        defaultPath: `revenue-overview-${date}.xlsx`,
        filters: [{ name: 'Excel Spreadsheet', extensions: ['xlsx'] }],
      });
      if (!savePath) return;

      setIsExporting(true);
      const toastId = toast.loading('Exporting…');
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        // Pass the already-filtered/sorted IDs so the export is in lockstep with the
        // visible table — keeps complex filter logic (esp. city normalization) in JS.
        await invoke('export_revenue_overview', {
          params: {
            path: savePath,
            ids: filtered.map((c) => c.id),
          },
        });
        toast.success('Export complete', { id: toastId, description: savePath });
      } catch (err) {
        console.error('[data] Revenue Overview export failed:', err);
        toast.error('Export failed', { id: toastId, description: err instanceof Error ? err.message : String(err) });
      } finally {
        setIsExporting(false);
      }
    } else {
      // Browser fallback
      try {
        const rows = filtered.map((c) => ({
          'Customer Name': c.name,
          Contact: getContactLabel(c, allContacts).name,
          Phone: getPhone(c, allContacts),
          Email: getEmail(c, allContacts),
          'Cloud Customer': c.cloudCustomer === true ? 'Yes' : c.cloudCustomer === false ? 'No' : '',
          ARR: effectiveByCustomerId.get(c.id)?.value ?? '',
        }));

        const payload = JSON.stringify({ tables: [{ name: 'Revenue Overview', rows }], bookType: 'xlsx' });
        const encoded = new TextEncoder().encode(payload);
        const buf = encoded.buffer as ArrayBuffer;

        const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const worker = new Worker(new URL('../../lib/utils/exportWorker.ts', import.meta.url));
          worker.onmessage = (e: MessageEvent<ArrayBuffer>) => { resolve(e.data); worker.terminate(); };
          worker.onerror = (e) => { reject(new Error(e.message)); worker.terminate(); };
          worker.postMessage(buf, [buf]);
        });

        const blob = new Blob([buffer]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `revenue-overview-${date}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Export started');
      } catch (err) {
        console.error('[data] Revenue Overview export failed:', err);
        toast.error('Export failed');
      }
    }
  }

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
  }

  const sortLabel = sortBy === 'arr' ? 'ARR' : sortBy === 'name' ? 'name' : 'cloud';

  const chips: { key: string; label: string; clear: () => void }[] = [
    filterCountry !== '' && { key: 'country', label: `Country: ${filterCountry}`, clear: () => setFilterCountry('') },
    filterCity !== '' && { key: 'city', label: `City: ${displayCity(filterCity)}`, clear: () => setFilterCity('') },
    filterCloud !== 'all' && { key: 'cloud', label: `Cloud: ${filterCloud === 'yes' ? 'Yes' : 'No'}`, clear: () => setFilterCloud('all') },
    filterSource !== 'all' && { key: 'source', label: `Source: ${filterSource === 'powerbi' ? 'Live' : 'Synced'}`, clear: () => setFilterSource('all') },
    arrMin !== '' && { key: 'min', label: `ARR ≥ €${Number(arrMin).toLocaleString('nl-BE')}`, clear: () => setArrMin('') },
    arrMax !== '' && { key: 'max', label: `ARR ≤ €${Number(arrMax).toLocaleString('nl-BE')}`, clear: () => setArrMax('') },
  ].filter((c): c is { key: string; label: string; clear: () => void } => Boolean(c));

  return (
    <Panel data-tour="page-revenue">
      <PanelHeader title="All customers" sub={`${filtered.length} · sorted by ${sortLabel}`} className="flex-wrap gap-y-1.5 py-1.5">
        <div className="relative w-[200px]">
          <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-faint" />
          <Input
            ref={searchInputRef}
            placeholder="Search by name…"
            aria-label="Search customers by name"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="h-[26px] pl-7 pr-7 text-xs"
          />
          {searchQuery && (
            <button type="button" aria-label="Clear search" className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearchQuery('')}>
              <X size={12} />
            </button>
          )}
        </div>
        <SortMenu<SortField>
          aria-label="Sort customers"
          options={[
            { value: 'arr', label: 'ARR' },
            { value: 'name', label: 'Name' },
            { value: 'cloudCustomer', label: 'Cloud' },
          ]}
          value={sortBy}
          dir={sortDir}
          onChange={setSortBy}
          onDirChange={setSortDir}
        />
        <FilterPopover title="Filter customers" count={activeFilterCount} onClear={clearFilters}>
          <FilterField
            label="Country"
            value={filterCountry || null}
            allLabel="All countries"
            options={countryOptions.map((c) => ({ id: c, name: c }))}
            onChange={(v) => { setFilterCountry(v ?? ''); setFilterCity(''); setPage(1); }}
          />
          <FilterField
            label="City"
            value={filterCity || null}
            allLabel="All cities"
            options={cityOptions.map((c) => ({ id: c, name: displayCity(c) }))}
            onChange={(v) => { setFilterCity(v ?? ''); setPage(1); }}
          />
          <FilterField
            label="Cloud customer"
            value={filterCloud === 'all' ? null : filterCloud}
            allLabel="All"
            options={[{ id: 'yes', name: 'Yes' }, { id: 'no', name: 'No' }]}
            onChange={(v) => { setFilterCloud((v as 'yes' | 'no' | null) ?? 'all'); setPage(1); }}
          />
          <FilterField
            label="ARR source"
            value={filterSource === 'all' ? null : filterSource}
            allLabel="All"
            options={[{ id: 'powerbi', name: 'Live (Power BI)' }, { id: 'd365', name: 'Synced (D365)' }]}
            onChange={(v) => { setFilterSource((v as 'powerbi' | 'd365' | null) ?? 'all'); setPage(1); }}
          />
          <label className="grid min-w-0 gap-1">
            <span className="text-[11.5px] font-medium text-muted-foreground">ARR min (€)</span>
            <Input type="number" placeholder="Min" value={arrMin} onChange={(e) => { setArrMin(e.target.value); setPage(1); }} className="h-[26px] text-xs" />
          </label>
          <label className="grid min-w-0 gap-1">
            <span className="text-[11.5px] font-medium text-muted-foreground">ARR max (€)</span>
            <Input type="number" placeholder="Max" value={arrMax} onChange={(e) => { setArrMax(e.target.value); setPage(1); }} className="h-[26px] text-xs" />
          </label>
        </FilterPopover>
        <ColumnPicker tableKey="revenueOverview" columns={ARR_COLUMNS} />
        <Button
          variant="outline"
          size="sm"
          data-tour="export-button"
          onClick={walkthroughActive || isExporting ? undefined : handleExport}
          disabled={walkthroughActive || isExporting}
        >
          {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          {isExporting ? 'Exporting…' : 'Export to Excel'}
        </Button>
      </PanelHeader>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-1.5">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={c.clear}
              title="Remove filter"
              className="inline-flex h-5 items-center gap-1 rounded-full border border-border bg-sunken px-[7px] text-[11px] font-medium text-foreground-2 hover:border-border-strong"
            >
              {c.label}
              <X size={10} className="opacity-60" />
            </button>
          ))}
          <button type="button" onClick={clearFilters} className="ml-0.5 text-[11px] font-medium text-accent-foreground hover:underline">
            Clear all
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-surface-2">
              <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
              {visibleColumns.map((id) => {
                const col = ARR_COLUMN_MAP.get(id);
                if (!col) return null;
                return (
                  <th
                    key={id}
                    className={cn(
                      col.align, 'whitespace-nowrap px-3 py-2 text-xs font-medium text-muted-foreground',
                      col.field && 'cursor-pointer select-none transition-colors hover:text-foreground'
                    )}
                    onClick={col.field ? () => toggleSort(col.field!) : undefined}
                  >
                    <span className={cn('inline-flex items-center gap-1', col.align === 'text-right' && 'justify-end')}>
                      {col.label}
                      {col.field && sortBy === col.field && (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pagedRows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No customers match your search.
                </td>
              </tr>
            ) : (
              pagedRows.map((customer, index) => (
                <motion.tr key={customer.id} className="transition-colors hover:bg-surface-2" {...rowSlideIn(index)}>
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">{(safePage - 1) * pageSize + index + 1}</td>
                  {visibleColumns.map((id) => {
                    const col = ARR_COLUMN_MAP.get(id);
                    if (!col) return null;
                    return (
                      <td key={id} className={cn('px-3 py-2', col.align)}>
                        {renderArrCell(customer, id, allContacts, router, effectiveByCustomerId.get(customer.id))}
                      </td>
                    );
                  })}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border px-2">
        <TablePagination
          totalItems={filtered.length}
          page={safePage}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </Panel>
  );
}
