/** 1-12 months, or forever. Shared by the create form and the event settings panel. */
export function RetentionSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-slate-300 px-2 py-1 text-sm"
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
