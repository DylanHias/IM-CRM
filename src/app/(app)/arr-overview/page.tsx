'use client';

import { useState, useMemo } from 'react';
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
import { useCustomers } from '@/hooks/useCustomers';
import { useCustomerStore } from '@/store/customerStore';
import { cn } from '@/lib/utils';
import type { Customer, Contact } from '@/types/entities';

type SortField = 'name' | 'bcn' | 'cloudCustomer' | 'language' | 'arr';

function formatArr(value: number | null): string {
  if (value === null) return '—';
  return `€ ${value.toLocaleString('nl-BE')}`;
}

function getMostRecentContact(customerId: string, contacts: Contact[]): Contact | undefined {
  return contacts
    .filter((c) => c.customerId === customerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}

type ContactField = { value: string; isFallback: boolean; contactName: string | null };

function getPhone(customer: Customer, contacts: Contact[]): ContactField {
  const contact = getMostRecentContact(customer.id, contacts);
  const fromContact = contact?.phone ?? contact?.mobile ?? null;
  if (fromContact && contact) return { value: fromContact, isFallback: false, contactName: `${contact.firstName} ${contact.lastName}` };
  return { value: customer.phone ?? '—', isFallback: true, contactName: null };
}

function getEmail(customer: Customer, contacts: Contact[]): ContactField {
  const contact = getMostRecentContact(customer.id, contacts);
  if (contact?.email) return { value: contact.email, isFallback: false, contactName: `${contact.firstName} ${contact.lastName}` };
  return { value: customer.email ?? '—', isFallback: true, contactName: null };
}

function ContactCell({ field }: { field: ContactField }) {
  return <span>{field.value}</span>;
}

function getContactLabel(customer: Customer, contacts: Contact[]): { name: string; isCompany: boolean } {
  const contact = getMostRecentContact(customer.id, contacts);
  if (contact) return { name: `${contact.firstName} ${contact.lastName}`, isCompany: false };
  return { name: customer.name, isCompany: true };
}

export default function ArrOverviewPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>('arr');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterCloud, setFilterCloud] = useState<'all' | 'yes' | 'no'>('all');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [arrMin, setArrMin] = useState('');
  const [arrMax, setArrMax] = useState('');

  useCustomers();
  const { customers: allCustomers, allContacts } = useCustomerStore();

  const languageOptions = useMemo(() => {
    const langs = new Set(allCustomers.map((c) => c.language).filter(Boolean) as string[]);
    return Array.from(langs).sort();
  }, [allCustomers]);

  const activeFilterCount =
    (filterCloud !== 'all' ? 1 : 0) +
    (filterLanguage !== 'all' ? 1 : 0) +
    (arrMin !== '' ? 1 : 0) +
    (arrMax !== '' ? 1 : 0);

  function clearFilters() {
    setFilterCloud('all');
    setFilterLanguage('all');
    setArrMin('');
    setArrMax('');
  }

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const min = arrMin !== '' ? Number(arrMin) : null;
    const max = arrMax !== '' ? Number(arrMax) : null;
    const rows = allCustomers.filter((c) => {
      if (q && !(
        c.name.toLowerCase().includes(q) ||
        (c.bcn ?? '').toLowerCase().includes(q) ||
        (c.language ?? '').toLowerCase().includes(q)
      )) return false;
      if (filterCloud === 'yes' && c.cloudCustomer !== true) return false;
      if (filterCloud === 'no' && c.cloudCustomer !== false) return false;
      if (filterLanguage !== 'all' && c.language !== filterLanguage) return false;
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
        case 'bcn':
          cmp = (a.bcn ?? '').localeCompare(b.bcn ?? '');
          break;
        case 'cloudCustomer': {
          const aVal = a.cloudCustomer === true ? 1 : a.cloudCustomer === false ? 0 : -1;
          const bVal = b.cloudCustomer === true ? 1 : b.cloudCustomer === false ? 0 : -1;
          cmp = aVal - bVal;
          break;
        }
        case 'language':
          cmp = (a.language ?? '').localeCompare(b.language ?? '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [allCustomers, searchQuery, filterCloud, filterLanguage, arrMin, arrMax, sortBy, sortDir]);

  function handleExport() {
    const rows = filtered.map((c) => ({
      'Customer Name': c.name,
      BCN: c.bcn ?? '',
      Contact: getContactLabel(c, allContacts).name,
      Phone: getPhone(c, allContacts).value,
      Email: getEmail(c, allContacts).value,
      'Cloud Customer': c.cloudCustomer === true ? 'Yes' : c.cloudCustomer === false ? 'No' : '',
      Language: c.language ?? '',
      'ARR (€)': c.arr ?? '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ARR Overview');

    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `arr-overview-${date}.xlsx`);
  }

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'name' || field === 'bcn' || field === 'language' ? 'asc' : 'desc');
    }
  }

  const sortLabel = sortBy === 'arr' ? 'ARR' : sortBy === 'name' ? 'name' : sortBy === 'bcn' ? 'BCN' : sortBy === 'cloudCustomer' ? 'cloud' : 'language';
  const dirLabel = sortDir === 'asc' ? 'low to high' : 'high to low';

  return (
    <div className="space-y-3">
          {/* Title */}
          <div>
            <h2 className="text-xl font-semibold text-foreground">ARR Overview</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length} customer{filtered.length !== 1 ? 's' : ''} · sorted by {sortLabel} ({dirLabel})
            </p>
          </div>

          {/* Row 1: Search + Sort + Filters + Export */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <Input
                placeholder="Search name, BCN or language…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  <SelectItem value="bcn">BCN</SelectItem>
                  <SelectItem value="cloudCustomer">Cloud</SelectItem>
                  <SelectItem value="language">Language</SelectItem>
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

            <button
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
                <Select value={filterCloud} onValueChange={(v) => setFilterCloud(v as 'all' | 'yes' | 'no')}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Language</label>
                <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All languages</SelectItem>
                    {languageOptions.map((lang) => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">ARR min (€)</label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={arrMin}
                  onChange={(e) => setArrMin(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">ARR max (€)</label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={arrMax}
                  onChange={(e) => setArrMax(e.target.value)}
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
              {filterLanguage !== 'all' && (
                <Badge
                  variant="secondary"
                  className="gap-1 cursor-pointer hover:bg-secondary"
                  onClick={() => setFilterLanguage('all')}
                >
                  {filterLanguage} <X size={10} />
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
                <thead>
                  <tr className="border-b border-border/70 bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">#</th>
                    {([
                      { field: 'name' as SortField, label: 'Customer Name', align: 'text-left' },
                      { field: 'bcn' as SortField, label: 'BCN', align: 'text-left' },
                      { field: null, label: 'Contact', align: 'text-left' },
                      { field: null, label: 'Phone', align: 'text-left' },
                      { field: null, label: 'Email', align: 'text-left' },
                      { field: 'cloudCustomer' as SortField, label: 'Cloud Customer', align: 'text-center' },
                      { field: 'language' as SortField, label: 'Language', align: 'text-left' },
                      { field: 'arr' as SortField, label: 'ARR', align: 'text-right' },
                    ] as const).map(({ field, label, align }) => (
                      <th
                        key={label}
                        className={cn(
                          align, 'px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap',
                          field && 'cursor-pointer select-none hover:text-foreground transition-colors'
                        )}
                        onClick={field ? () => toggleSort(field) : undefined}
                      >
                        <span className={cn('inline-flex items-center gap-1', align === 'text-right' && 'justify-end')}>
                          {label}
                          {field && sortBy === field && (
                            sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No customers match your search.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((customer, index) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">{index + 1}</td>
                        <td className="px-4 py-3 font-medium">
                          <button
                            onClick={() => router.push(`/customers/${customer.id}`)}
                            className="text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors text-left"
                          >
                            {customer.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {customer.bcn ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {(() => {
                            const label = getContactLabel(customer, allContacts);
                            return (
                              <span className="flex items-center gap-1.5">
                                {label.isCompany ? (
                                  <Building2 size={12} className="text-warning shrink-0" />
                                ) : (
                                  <User size={12} className="text-primary shrink-0" />
                                )}
                                {label.name}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <ContactCell field={getPhone(customer, allContacts)} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <ContactCell field={getEmail(customer, allContacts)} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {customer.cloudCustomer === true ? (
                            <Badge variant="default" className="text-xs">Yes</Badge>
                          ) : customer.cloudCustomer === false ? (
                            <Badge variant="secondary" className="text-xs">No</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{customer.language ?? '—'}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {formatArr(customer.arr)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
    </div>
  );
}
