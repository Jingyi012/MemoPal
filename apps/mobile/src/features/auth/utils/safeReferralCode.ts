/** Referral codes are public share tokens, but accept only the server's generated format. */
export function getSafeReferralCode(value: unknown): string {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().toUpperCase();
  return /^[A-Z0-9]{8,10}$/.test(normalized) ? normalized : '';
}
