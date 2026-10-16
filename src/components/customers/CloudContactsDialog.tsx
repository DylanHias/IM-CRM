'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { queryAllCloudBeluxUsers, type CloudBeluxUser } from '@/lib/db/queries/cloudBeluxUsers';
import { updateCustomerCloudOwners } from '@/lib/db/queries/customers';
import { directPushAccountCloudOwners } from '@/lib/sync/directPushService';
import { useCustomerStore } from '@/store/customerStore';
import { formatDisplayName } from '@/lib/utils/nameUtils';
import type { Customer } from '@/types/entities';

interface Props {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NONE = '__none__';

/** Edits the customer's cloud and services contacts and pushes them to Dynamics 365. */
export function CloudContactsDialog({ customer, open: editing, onOpenChange }: Props) {
  const setEditing = onOpenChange;
  const [users, setUsers] = useState<CloudBeluxUser[]>([]);
  const [csmId, setCsmId] = useState<string>(customer.customerSuccessManagerId ?? NONE);
  const [awsId, setAwsId] = useState<string>(customer.awsOwnerId ?? NONE);
  const [azureId, setAzureId] = useState<string>(customer.azureOwnerId ?? NONE);
  const [insideSalesId, setInsideSalesId] = useState<string>(customer.insideSalesOwnerId ?? NONE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing || !isTauriApp()) return;
    const load = async () => {
      try {
        const cloud = await queryAllCloudBeluxUsers();
        setUsers(cloud);
      } catch (err) {
        console.error('[customer] Failed to load team users:', err);
      }
    };
    load();
  }, [editing]);

  useEffect(() => {
    setCsmId(customer.customerSuccessManagerId ?? NONE);
    setAwsId(customer.awsOwnerId ?? NONE);
    setAzureId(customer.azureOwnerId ?? NONE);
    setInsideSalesId(customer.insideSalesOwnerId ?? NONE);
  }, [customer.customerSuccessManagerId, customer.awsOwnerId, customer.azureOwnerId, customer.insideSalesOwnerId]);

  const findName = (id: string): string | null => {
    if (id === NONE) return null;
    return users.find((u) => u.id === id)?.name ?? null;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const update = {
        customerSuccessManagerId: csmId === NONE ? null : csmId,
        customerSuccessManagerName: csmId === NONE ? null : findName(csmId),
        awsOwnerId: awsId === NONE ? null : awsId,
        awsOwnerName: awsId === NONE ? null : findName(awsId),
        azureOwnerId: azureId === NONE ? null : azureId,
        azureOwnerName: azureId === NONE ? null : findName(azureId),
        insideSalesOwnerId: insideSalesId === NONE ? null : insideSalesId,
        insideSalesOwnerName: insideSalesId === NONE ? null : findName(insideSalesId),
        accountManagerId: customer.accountManagerId,
        accountManagerName: customer.accountManagerName,
      };

      const pushResult = await directPushAccountCloudOwners(customer.id, {
        customerSuccessManagerId: update.customerSuccessManagerId,
        awsOwnerId: update.awsOwnerId,
        azureOwnerId: update.azureOwnerId,
        insideSalesOwnerId: update.insideSalesOwnerId,
        accountManagerId: update.accountManagerId,
      });
      if (!pushResult.success) {
        setError(pushResult.error);
        return;
      }

      if (isTauriApp()) {
        await updateCustomerCloudOwners(customer.id, update);
      }

      const store = useCustomerStore.getState();
      store.setCustomers(
        store.customers.map((c) => (c.id === customer.id ? { ...c, ...update } : c)),
      );
      setEditing(false);
    } catch (err) {
      console.error('[customer] Failed to save cloud-services contacts:', err);
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const options = [
    { value: NONE, label: '—' },
    ...users.map((u) => ({ value: u.id, label: formatDisplayName(u.name) })),
  ];

  return (
    <Dialog open={editing} onOpenChange={(open) => { if (!open) { setEditing(false); setError(null); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cloud and Services Contacts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Customer Success Manager</Label>
            <Combobox
              value={csmId}
              onValueChange={setCsmId}
              options={options}
              searchPlaceholder="Search Cloud Belux Sales..."
              emptyText="No users found."
            />
          </div>
          <div className="space-y-1">
            <Label>AWS Owner</Label>
            <Combobox
              value={awsId}
              onValueChange={setAwsId}
              options={options}
              searchPlaceholder="Search Cloud Belux Sales..."
              emptyText="No users found."
            />
          </div>
          <div className="space-y-1">
            <Label>Azure Owner</Label>
            <Combobox
              value={azureId}
              onValueChange={setAzureId}
              options={options}
              searchPlaceholder="Search Cloud Belux Sales..."
              emptyText="No users found."
            />
          </div>
          <div className="space-y-1">
            <Label>Inside Sales Owner</Label>
            <Combobox
              value={insideSalesId}
              onValueChange={setInsideSalesId}
              options={options}
              searchPlaceholder="Search Cloud Belux Sales..."
              emptyText="No users found."
            />
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
