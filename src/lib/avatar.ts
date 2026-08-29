/**
 * Deterministic per-participant color for the avatar badges used across the
 * event page (payment rows, balances, the settlement hero, the participant
 * list). Keyed by the user's position in the event's `users` list (creation
 * order), not anything derived from the name — two participants named the
 * same thing still get distinct colors, and a given participant's color
 * stays put as others are added.
 *
 * Returns CSS custom-property references (globals.css), not hex — each
 * token is a light-dark() pair, so the same avatar is correctly colored in
 * both themes with no light/dark branching here.
 */
const PALETTE = [
  { bg: "var(--avatar-1-bg)", fg: "var(--avatar-1-fg)" },
  { bg: "var(--avatar-2-bg)", fg: "var(--avatar-2-fg)" },
  { bg: "var(--avatar-3-bg)", fg: "var(--avatar-3-fg)" },
  { bg: "var(--avatar-4-bg)", fg: "var(--avatar-4-fg)" },
] as const;

const FALLBACK = { bg: "var(--avatar-fallback-bg)", fg: "var(--avatar-fallback-fg)" };

export function avatarColors(index: number): { bg: string; fg: string } {
  if (index < 0) return FALLBACK; // unknown participant
  return PALETTE[index % PALETTE.length];
}

export function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
