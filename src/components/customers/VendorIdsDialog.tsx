'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Edits the customer's MPN / APN IDs and pushes them to Dynamics 365. */
export function VendorIdsDialog({ customer, open: editing, onOpenChange }: Props) {
  const setEditing = onOpenChange;
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

  return (
    <Dialog open={editing} onOpenChange={(open) => { if (!open) { setEditing(false); setError(null); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vendor IDs</DialogTitle>
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
  );
}
