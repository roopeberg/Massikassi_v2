/** 1-12 months, or forever. Shared by the create form and the event settings panel. */
export function RetentionSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  /** The two call sites sit on different grounds (a cream "paper" card vs. a
   * dark surface card), so the base cream styling is a default, not a fixed rule. */
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        className ??
        "rounded-xl bg-[var(--paper-input-bg)] px-2 py-1.5 text-sm text-[var(--paper-fg)] outline-none focus:ring-2 focus:ring-accent"
      }
    >
      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
        <option key={m} value={m}>
          {m} kk
        </option>
      ))}
      <option value="forever">Ikuisesti</option>
    </select>
  );
}
