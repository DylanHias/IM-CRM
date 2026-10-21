/**
 * Converts "Last, First" format to "First Last".
 * Returns the name unchanged if no comma is present.
 */
export function formatDisplayName(name: string): string {
  if (name.includes(',')) {
    const [last, first] = name.split(',').map((s) => s.trim());
    return `${first} ${last}`;
  }
  return name;
}

/**
 * The given name, handling Azure AD's "Last, First" format.
 * Returns `fallback` when the name is missing or blank.
 */
export function firstNameOf(name: string | null | undefined, fallback: string): string {
  if (!name?.trim()) return fallback;
  return formatDisplayName(name).split(' ')[0] || fallback;
}
