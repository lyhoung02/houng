/** Maps known raw error codes surfaced by the Nokor hooks to a localized
 *  message, passing anything unrecognized through unchanged. Today the only
 *  code is `rate_limited`, raised by the migration 0028 rate-limit triggers. */
export function nokorErrorText(
  raw: string | null | undefined,
  strings: { rateLimited: string },
): string | null {
  if (!raw) return null;
  if (raw === "rate_limited") return strings.rateLimited;
  return raw;
}
