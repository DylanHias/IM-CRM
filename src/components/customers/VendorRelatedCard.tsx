'use client';

import { useEffect, useState } from 'react';
import { Tag, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { updateCustomerVendorIds } from '@/lib/db/queries/customers';
import { directPushAccountVendorIds } from '@/lib/sync/directPushService';
import { useCustomerStore } from '@/store/customerStore';
import type { Customer } from '@/types/entities';

interface Props {
  customer: Customer;
}

export function VendorRelatedCard({ customer }: Props) {
  const [editing, setEditing] = useState(false);
  const [mpnId, setMpnId] = useState<string>(customer.mpnId ?? '');
  const [apnId, setApnId] = useState<string>(customer.apnId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMpnId(customer.mpnId ?? '');
    setApnId(customer.apnId ?? '');
  }, [customer.mpnId, customer.apnId]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const update = {
        mpnId: mpnId.trim() === '' ? null : mpnId.trim(),
        apnId: apnId.trim() === '' ? null : apnId.trim(),
      };

      const pushResult = await directPushAccountVendorIds(customer.id, update);
      if (!pushResult.success) {
        setError(pushResult.error);
        return;
      }

      if (isTauriApp()) {
        await updateCustomerVendorIds(customer.id, update);
      }

      const store = useCustomerStore.getState();
      store.setCustomers(
        store.customers.map((c) => (c.id === customer.id ? { ...c, ...update } : c)),
      );
      setEditing(false);
    } catch (err) {
      console.error('[customer] Failed to save vendor IDs:', err);
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const rows = [
    { label: 'MPN ID', value: customer.mpnId },
    { label: 'APN ID', value: customer.apnId },
  ];

  return (
    <>
      <div className="bg-card rounded-xl border border-border/70 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Tag size={15} className="text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Vendor Related</span>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-muted-foreground hover:text-primary transition-colors"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
        </div>
        <div className="divide-y divide-border/40">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center px-5 py-3">
              <span className="text-[13px] text-muted-foreground w-[120px] flex-shrink-0">{row.label}</span>
              <span className="text-[13px] font-medium text-foreground flex-1 min-w-0 truncate">
                {row.value ? row.value : <span className="text-muted-foreground">—</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={editing} onOpenChange={(open) => { if (!open) { setEditing(false); setError(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vendor Related</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>MPN ID</Label>
              <Input value={mpnId} onChange={(e) => setMpnId(e.target.value)} placeholder="MPN ID" />
            </div>
            <div className="space-y-1">
              <Label>APN ID</Label>
              <Input value={apnId} onChange={(e) => setApnId(e.target.value)} placeholder="APN ID" />
            </div>
            {error && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setEditing(false)} className="flex-1" disabled={saving}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} className="flex-1" disabled={saving}>
                {saving ? <><Loader2 size={15} className="animate-spin mr-2" />Saving...</> : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
