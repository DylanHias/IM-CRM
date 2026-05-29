export const HARDCODED_ADMIN_EMAILS = [
  'dylan.hias@ingrammicro.com',
  'karim.elouch@ingrammicro.com',
  'cyril.delander@ingrammicro.com',
];

export function isHardcodedAdmin(email: string): boolean {
  return HARDCODED_ADMIN_EMAILS.includes(email.toLowerCase());
}
