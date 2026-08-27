/**
 * 1-12 months, or forever. Shared by the create form and the event settings
 * panel — which sit on different grounds: the settings panel is a themed
 * surface, the landing form is the fixed cream "paper" card. Hence `className`,
 * defaulting to the themed styling.
 */
export function RetentionSelect({
  value,
  onChange,
  className = "h-11 rounded-full border border-line bg-surface-3 px-4 text-sm text-ink",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
        <option key={m} value={m}>
          {m} kk
        </option>
      ))}
      <option value="forever">Ikuisesti</option>
    </select>
  );
}
