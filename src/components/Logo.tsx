const SIZES = {
  sm: "text-xs",
  lg: "text-2xl sm:text-3xl",
} as const;

/**
 * A clean redo of the original massikassi's blocky pixel-font "MASSIKASSI"
 * wordmark (public/img/massikassi_logo.png in the old repo) — same retro
 * feel via Press Start 2P, not a re-export of the old low-res PNG.
 */
export function Logo({ size = "lg" }: { size?: keyof typeof SIZES }) {
  return (
    <span className={`font-[family-name:var(--font-logo)] tracking-tight text-slate-900 ${SIZES[size]}`}>
      massikassi
    </span>
  );
}
