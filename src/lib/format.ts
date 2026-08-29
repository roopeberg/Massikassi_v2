const TIME_ZONE = "Europe/Helsinki";

/** "12,34 €"-style formatting — input already in the currency's base unit
 * (euros), not cents. */
export function formatEuros(amount: number): string {
  return amount.toLocaleString("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Same as formatEuros, but for a cents value (dues/settlement amounts). */
export function formatCents(cents: number): string {
  return formatEuros(cents / 100);
}

/**
 * "29.8.2026" / "29.8.2026 klo 18.23" — timezone pinned to Europe/Helsinki
 * rather than left to whatever zone the runtime happens to be in.
 *
 * Server rendering (Docker, typically UTC) and the visitor's browser
 * (whatever zone they're actually in) otherwise format the *same* Date
 * differently — near a day/hour boundary this is a real, silent React
 * hydration mismatch (client and server produce different text for the
 * same server-rendered node). React's recovery from that is to discard and
 * fully re-render the affected subtree client-side, which — since it can
 * reach all the way up to <html> — also wipes out whatever the
 * pre-hydration theme-choice script (layout.tsx) had just set there,
 * silently reverting anyone with a stored dark/light preference back to
 * "auto" on every page load. Pinning the zone makes the formatted string
 * a pure function of the Date value alone, identical on both sides.
 */
export function formatDay(date: Date | string): string {
  return new Date(date).toLocaleDateString("fi-FI", { timeZone: TIME_ZONE });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("fi-FI", { dateStyle: "short", timeStyle: "short", timeZone: TIME_ZONE });
}
