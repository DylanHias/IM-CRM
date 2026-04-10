'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
  Search, Download, Building2, User, X,
  SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColumnPicker, useColumnConfig } from '@/components/ui/ColumnPicker';
import type { ColumnDef } from '@/components/ui/ColumnPicker';
import { useCustomers } from '@/hooks/useCustomers';
import { useCustomerStore } from '@/store/customerStore';
import { usePaginationPreference } from '@/hooks/usePaginationPreference';
import { TablePagination } from '@/components/ui/TablePagination';
import { useShortcutListener } from '@/hooks/useShortcuts';
import { cn } from '@/lib/utils';
import { exportFile } from '@/lib/utils/exportFile';
import type { Customer, Contact } from '@/types/entities';

type SortField = 'name' | 'cloudCustomer' | 'arr';

function formatArr(value: number | null): string {
  if (value === null) return '—';
  return `€ ${value.toLocaleString('nl-BE')}`;
}

function getMostRecentContact(customerId: string, contacts: Contact[]): Contact | undefined {
  return contacts
    .filter((c) => c.customerId === customerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}

function getPhone(customer: Customer, contacts: Contact[]): string {
  const contact = getMostRecentContact(customer.id, contacts);
  return contact?.phone ?? contact?.mobile ?? customer.phone ?? '—';
}

function getEmail(customer: Customer, contacts: Contact[]): string {
  const contact = getMostRecentContact(customer.id, contacts);
  return contact?.email ?? customer.email ?? '—';
}

function getContactLabel(customer: Customer, contacts: Contact[]): { name: string; isCompany: boolean } {
  const contact = getMostRecentContact(customer.id, contacts);
  if (contact) return { name: `${contact.firstName} ${contact.lastName}`, isCompany: false };
  return { name: customer.name, isCompany: true };
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

function renderArrCell(customer: Customer, columnId: string, contacts: Contact[], router: ReturnType<typeof useRouter>) {
  switch (columnId) {
    case 'name':
      return (
        <button
          onClick={() => router.push(`/customers?id=${customer.id}`)}
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
    case 'arr':
      return <span className="font-semibold tabular-nums">{formatArr(customer.arr)}</span>;
    default:
      return null;
  }
}

export default function RevenueOverviewPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>('arr');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterCloud, setFilterCloud] = useState<'all' | 'yes' | 'no'>('all');
  const [arrMin, setArrMin] = useState('');
  const [arrMax, setArrMax] = useState('');
  const [page, setPage] = useState(1);
  const { pageSize, setPageSize, pageSizeOptions } = usePaginationPreference('revenueOverview');
  const { visibleColumns } = useColumnConfig('revenueOverview', ARR_COLUMNS);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useShortcutListener('focus-search', useCallback(() => searchInputRef.current?.focus(), []));
  useShortcutListener('toggle-filters', useCallback(() => setShowFilters((v) => !v), []));

  useCustomers();
  const { customers: allCustomers, allContacts } = useCustomerStore();

  const activeFilterCount =
    (filterCloud !== 'all' ? 1 : 0) +
    (arrMin !== '' ? 1 : 0) +
    (arrMax !== '' ? 1 : 0);

  function clearFilters() {
    setFilterCloud('all');
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
      if (min !== null && (c.arr === null || c.arr < min)) return false;
      if (max !== null && (c.arr === null || c.arr > max)) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'arr':
          if (a.arr === null && b.arr === null) cmp = 0;
          else if (a.arr === null) cmp = 1;
          else if (b.arr === null) cmp = -1;
          else cmp = a.arr - b.arr;
          break;
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'cloudCustomer': {
          const aVal = a.cloudCustomer === true ? 1 : a.cloudCustomer === false ? 0 : -1;
          const bVal = b.cloudCustomer === true ? 1 : b.cloudCustomer === false ? 0 : -1;
          cmp = aVal - bVal;
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [allCustomers, searchQuery, filterCloud, arrMin, arrMax, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  async function handleExport() {
    try {
      const rows = filtered.map((c) => ({
        'Customer Name': c.name,
        Contact: getContactLabel(c, allContacts).name,
        Phone: getPhone(c, allContacts),
        Email: getEmail(c, allContacts),
        'Cloud Customer': c.cloudCustomer === true ? 'Yes' : c.cloudCustomer === false ? 'No' : '',
        'ARR (€)': c.arr ?? '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Revenue Overview');

      const date = new Date().toISOString().split('T')[0];
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
      await exportFile({
        defaultName: `revenue-overview-${date}.xlsx`,
        filterLabel: 'Excel Spreadsheet',
        extensions: ['xlsx'],
        data: buffer,
      });
    } catch (err) {
      console.error('[data] Revenue Overview export failed:', err);
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
  const dirLabel = sortDir === 'asc' ? 'low to high' : 'high to low';

  return (
    <div data-tour="page-revenue" className="space-y-3">
          {/* Title */}
          <div>
            <h2 className="text-xl font-semibold text-foreground">Revenue Overview</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length} customer{filtered.length !== 1 ? 's' : ''} · sorted by {sortLabel} ({dirLabel})
            </p>
          </div>

          {/* Row 1: Search + Sort + Filters + Export */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <Input
                ref={searchInputRef}
                placeholder="Search by name…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-9 h-9 pr-8 bg-card shadow-sm border-border/70 rounded-lg"
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)}>
                <SelectTrigger className="h-9 w-[140px] gap-1">
                  <ArrowUpDown size={13} className="text-muted-foreground flex-shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arr">ARR</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="cloudCustomer">Cloud</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 flex-shrink-0"
                onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              </Button>
            </div>

            <Button
              variant={showFilters || activeFilterCount > 0 ? 'default' : 'outline'}
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => setShowFilters((v) => !v)}
            >
              <SlidersHorizontal size={13} />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 bg-primary-foreground text-primary text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={clearFilters}>
                <X size={13} className="mr-1" />
                Clear all
              </Button>
            )}

            <ColumnPicker tableKey="revenueOverview" columns={ARR_COLUMNS} />

            <button
              data-tour="export-button"
              onClick={handleExport}
              className={cn(
                'ml-auto flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium',
                'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
              )}
            >
              <Download size={14} />
              Export to Excel
            </button>
          </div>

          {/* Row 2: Collapsible filter panel */}
          {showFilters && (
            <div className="bg-card border border-border/70 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 shadow-sm">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Cloud Customer</label>
                <Select value={filterCloud} onValueChange={(v) => { setFilterCloud(v as 'all' | 'yes' | 'no'); setPage(1); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">ARR min (€)</label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={arrMin}
                  onChange={(e) => { setArrMin(e.target.value); setPage(1); }}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">ARR max (€)</label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={arrMax}
                  onChange={(e) => { setArrMax(e.target.value); setPage(1); }}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          {/* Row 3: Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {filterCloud !== 'all' && (
                <Badge
                  variant="secondary"
                  className="gap-1 cursor-pointer hover:bg-secondary"
                  onClick={() => setFilterCloud('all')}
                >
                  Cloud: {filterCloud} <X size={10} />
                </Badge>
              )}
              {arrMin !== '' && (
                <Badge
                  variant="secondary"
                  className="gap-1 cursor-pointer hover:bg-secondary"
                  onClick={() => setArrMin('')}
                >
                  ARR ≥ €{Number(arrMin).toLocaleString('nl-BE')} <X size={10} />
                </Badge>
              )}
              {arrMax !== '' && (
                <Badge
                  variant="secondary"
                  className="gap-1 cursor-pointer hover:bg-secondary"
                  onClick={() => setArrMax('')}
                >
                  ARR ≤ €{Number(arrMax).toLocaleString('nl-BE')} <X size={10} />
                </Badge>
              )}
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b border-border/70 bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">#</th>
                    {visibleColumns.map((id) => {
                      const col = ARR_COLUMN_MAP.get(id);
                      if (!col) return null;
                      return (
                        <th
                          key={id}
                          className={cn(
                            col.align, 'px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap',
                            col.field && 'cursor-pointer select-none hover:text-foreground transition-colors'
                          )}
                          onClick={col.field ? () => toggleSort(col.field!) : undefined}
                        >
                          <span className={cn('inline-flex items-center gap-1', col.align === 'text-right' && 'justify-end')}>
                            {col.label}
                            {col.field && sortBy === col.field && (
                              sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                            )}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumns.length + 1} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No customers match your search.
                      </td>
                    </tr>
                  ) : (
                    pagedRows.map((customer, index) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">{(safePage - 1) * pageSize + index + 1}</td>
                        {visibleColumns.map((id) => {
                          const col = ARR_COLUMN_MAP.get(id);
                          if (!col) return null;
                          return (
                            <td key={id} className={cn('px-4 py-3', col.align)}>
                              {renderArrCell(customer, id, allContacts, router)}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <TablePagination
            totalItems={filtered.length}
            page={safePage}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
    </div>
  );
}
