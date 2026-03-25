'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserRole } from '@/types/admin';

export function UserManagement() {
  const { users, isLoading, loadUsers, refreshUsersFromD365, updateUserRole } = useAdminStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setChangingRole(userId);
    try {
      await updateUserRole(userId, role);
    } finally {
      setChangingRole(null);
    }
  };

  const handleRefresh = async () => {
    if (!accessToken) return;
    await refreshUsersFromD365(accessToken);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Users</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span className="ml-1.5">Refresh from D365</span>
        </Button>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-left font-medium">Business Unit</th>
              <th className="px-3 py-2 text-left font-medium">Last Active</th>
              <th className="px-3 py-2 text-left font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="px-3 py-2">{user.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{user.email || '—'}</td>
                <td className="px-3 py-2 text-muted-foreground">{user.businessUnit || '—'}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    disabled={changingRole === user.id}
                    className="h-7 rounded-md border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  {isLoading ? 'Loading...' : 'No users found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
