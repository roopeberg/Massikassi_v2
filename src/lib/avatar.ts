/**
 * Deterministic per-participant color for the avatar badges used across the
 * event page (payment rows, balances, the settlement hero, the participant
 * list). Keyed by the user's position in the event's `users` list (creation
 * order), not anything derived from the name — two participants named the
 * same thing still get distinct colors, and a given participant's color
 * stays put as others are added.
 */
const PALETTE = [
  { bg: "#f5b544", text: "#12141c" }, // amber
  { bg: "#f2653f", text: "#fbf7f0" }, // orange
  { bg: "#4fd39a", text: "#12141c" }, // mint
  { bg: "#7d8cf5", text: "#12141c" }, // periwinkle
] as const;

export function avatarColors(index: number): { bg: string; text: string } {
  if (index < 0) return { bg: "#3a4152", text: "#f4f2ee" }; // fallback: unknown participant
  return PALETTE[index % PALETTE.length];
}

export function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
