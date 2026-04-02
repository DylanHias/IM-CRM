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
