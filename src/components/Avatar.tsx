"use client";

import { createContext, useContext } from "react";

/*
 * The design gives every participant a coloured initial disc, in four colours
 * (`--avatar-1..4` in globals.css, with a darker set in the light theme).
 *
 * Colours are handed out by the person's position in the event's user list, so
 * a group of four gets four different colours — the artboard's whole point,
 * since the discs stand in for names in the compact mobile rows. A name hash
 * would have been stateless but collides constantly at this palette size (with
 * four people it's more likely than not that two of them clash).
 */

const PALETTE_SIZE = 4;

/** Ordered participant names for the event being rendered. */
const AvatarPaletteContext = createContext<ReadonlyMap<string, number> | null>(null);

export function AvatarPaletteProvider({ names, children }: { names: string[]; children: React.ReactNode }) {
  const palette = new Map<string, number>();
  for (const name of names) {
    if (!palette.has(name)) palette.set(name, (palette.size % PALETTE_SIZE) + 1);
  }
  return <AvatarPaletteContext.Provider value={palette}>{children}</AvatarPaletteContext.Provider>;
}

/** Stable fallback for a name the provider doesn't know (or no provider). */
function hashIndex(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return (hash % PALETTE_SIZE) + 1;
}

function usePaletteIndex(name: string) {
  const palette = useContext(AvatarPaletteContext);
  return palette?.get(name) ?? hashIndex(name);
}

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

/**
 * Size comes from a `--sz` custom property so callers can vary it per
 * breakpoint (`[--sz:38px] sm:[--sz:46px]`) — mobile and desktop use different
 * discs for the same avatar. Passing `size` pins it inline instead, for the
 * places that don't change.
 */
export function Avatar({
  name,
  size,
  className = "",
  ring = false,
}: {
  name: string;
  size?: number;
  className?: string;
  /** Canvas-coloured border, for the overlapping stack in the page header. */
  ring?: boolean;
}) {
  const i = usePaletteIndex(name);

  return (
    <span
      title={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${className}`}
      style={{
        background: `var(--avatar-${i}-bg)`,
        color: `var(--avatar-${i}-fg)`,
        ...(size === undefined ? {} : { ["--sz" as string]: `${size}px` }),
        width: "var(--sz, 34px)",
        height: "var(--sz, 34px)",
        // Tracks the artboard's ratio (13px type in a 34px disc) at every size.
        fontSize: "calc(var(--sz, 34px) * 0.38)",
        ...(ring ? { border: "2px solid var(--canvas)" } : {}),
      }}
    >
      {initial(name)}
    </span>
  );
}

/** Overlapping row of avatars, as under the event title. */
export function AvatarStack({ names, size = 26 }: { names: string[]; size?: number }) {
  return (
    <span className="flex items-center">
      {names.map((name, i) => (
        <span key={name} style={i === 0 ? undefined : { marginLeft: -8 }}>
          <Avatar name={name} size={size} ring />
        </span>
      ))}
    </span>
  );
}
