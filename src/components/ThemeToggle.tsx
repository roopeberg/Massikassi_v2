"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon, ThemeIcon } from "./icons";

/**
 * The round control in the nav. Three states: follow the OS (the default),
 * force light, force dark. "Follow the OS" stays reachable by cycling — a
 * two-state toggle would quietly lock the reader out of it after the first
 * click.
 *
 * All this does is set (or clear) `data-theme` on <html>; the colours are
 * `light-dark()` tokens in globals.css keyed off `color-scheme`, so with no
 * choice stored the OS preference wins on its own. The pre-paint script in
 * layout.tsx re-applies a stored choice on the next load.
 */

type Theme = "auto" | "light" | "dark";

const ORDER: Theme[] = ["auto", "light", "dark"];

const LABELS: Record<Theme, string> = {
  auto: "järjestelmän mukaan",
  light: "vaalea",
  dark: "tumma",
};

const ICONS: Record<Theme, (props: { className?: string }) => React.ReactElement> = {
  auto: ThemeIcon,
  light: SunIcon,
  dark: MoonIcon,
};

/* The stored choice is external state React doesn't own, so it's read through
   useSyncExternalStore rather than mirrored into an effect: that gives a server
   snapshot ("auto" — the server can't know the choice) distinct from the
   client's, which is precisely the hydration case this hook exists for. */

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // `storage` fires in *other* tabs, keeping them in sync; `listeners` covers
  // this one, whose own writes don't trigger the event.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): Theme {
  try {
    const stored = localStorage.getItem("theme");
    return stored === "light" || stored === "dark" ? stored : "auto";
  } catch {
    // Storage can be unavailable (private mode, blocked site data) — that only
    // means the choice can't be remembered, not that the toggle should break.
    return "auto";
  }
}

function getServerSnapshot(): Theme {
  return "auto";
}

function store(next: Theme) {
  if (next === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = next;
  try {
    if (next === "auto") localStorage.removeItem("theme");
    else localStorage.setItem("theme", next);
  } catch {
    // Applies to this page regardless; it just won't survive a reload.
  }
  listeners.forEach((l) => l());
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const Icon = ICONS[theme];

  return (
    <button
      type="button"
      onClick={() => store(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length])}
      aria-label={`Väriteema: ${LABELS[theme]}. Vaihda.`}
      title={`Väriteema: ${LABELS[theme]}`}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-ink-soft transition-colors hover:text-ink"
    >
      <Icon className="h-[19px] w-[19px]" />
    </button>
  );
}
