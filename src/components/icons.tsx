/**
 * Small flat line icons for the landing page's "how it works" steps.
 * Hand-drawn to match this app's plain slate/Tailwind look — not an attempt
 * to recreate the illustrated mascot style from the reference mockup, which
 * isn't something this project has the assets or tools to reproduce.
 */

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function NotebookIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" {...common} {...props}>
      <rect x="10" y="6" width="28" height="36" rx="3" />
      <path d="M10 14h4M10 22h4M10 30h4" />
      <path d="M20 30l4-2 12-12a2.8 2.8 0 0 0-4-4L20 26l-2 6z" />
    </svg>
  );
}

export function ReceiptIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" {...common} {...props}>
      <path d="M12 5h24v38l-4-3-4 3-4-3-4 3-4-3-4 3V5z" />
      <path d="M17 15h14M17 22h14M17 29h8" />
    </svg>
  );
}

export function TransferIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" {...common} {...props}>
      <circle cx="14" cy="16" r="6" />
      <circle cx="34" cy="16" r="6" />
      <path d="M6 40c0-7 4-11 8-11s8 4 8 11" />
      <path d="M26 40c0-7 4-11 8-11s8 4 8 11" />
      <path d="M19 26h10M25 22l4 4-4 4" />
    </svg>
  );
}

/** A simple flat stand-in for the mockup's illustrated money-bag mascot. */
export function ReceiptIllustration(props: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={props.className} aria-hidden="true">
      <rect x="30" y="20" width="80" height="120" rx="4" fill="white" stroke="#0f172a" strokeWidth="3" />
      {[38, 52, 66, 80, 94, 108, 122].map((y) => (
        <line key={y} x1="42" y1={y} x2={y % 2 === 0 ? 86 : 74} y2={y} stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
      ))}
      <circle cx="140" cy="120" r="38" fill="#0f172a" />
      <text x="140" y="132" textAnchor="middle" fontSize="34" fontWeight="700" fill="white">
        €
      </text>
      <circle cx="112" cy="165" r="16" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" />
      <circle cx="140" cy="172" r="16" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" />
    </svg>
  );
}
