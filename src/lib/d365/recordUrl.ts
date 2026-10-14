export type D365Entity = 'account' | 'contact' | 'opportunity';

/** Link to a record in the Dynamics 365 web app, or null when no org URL is configured. */
export function d365RecordUrl(entity: D365Entity, id: string): string | null {
  const base = (process.env.NEXT_PUBLIC_D365_BASE_URL ?? '').replace(/\/+$/, '');
  if (!base || !id) return null;
  return `${base}/main.aspx?pagetype=entityrecord&etn=${entity}&id=${encodeURIComponent(id)}`;
}
