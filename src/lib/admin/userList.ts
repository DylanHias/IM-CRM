import { isHardcodedAdmin } from '@/lib/auth/adminConfig';
import type { CrmUser } from '@/types/admin';

export function isAdminUser(user: Pick<CrmUser, 'email' | 'role'>): boolean {
  return user.role === 'admin' || (!!user.email && isHardcodedAdmin(user.email));
}

function completeness(user: CrmUser): number {
  return (
    (user.title ? 1 : 0) +
    (user.businessUnit ? 1 : 0) +
    (user.profilePhoto ? 1 : 0) +
    (user.lastActiveAt ? 1 : 0) +
    (user.analyticsTracked ? 1 : 0)
  );
}

// The same person can have multiple rows (an MSAL "self" row and a D365 row share
// an email but use different IDs). Collapse them to the most complete row, keeping
// first-appearance order so sorting stays stable.
export function dedupeUsersByEmail(users: CrmUser[]): CrmUser[] {
  const indexByEmail = new Map<string, number>();
  const result: CrmUser[] = [];

  for (const user of users) {
    const key = user.email?.trim().toLowerCase();
    if (!key) {
      result.push(user);
      continue;
    }
    const existingIndex = indexByEmail.get(key);
    if (existingIndex === undefined) {
      indexByEmail.set(key, result.length);
      result.push(user);
    } else if (completeness(user) > completeness(result[existingIndex])) {
      result[existingIndex] = user;
    }
  }

  return result;
}
