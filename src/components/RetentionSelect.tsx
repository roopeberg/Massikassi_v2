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
      className="rounded-xl bg-[#efeae0] px-2 py-1.5 text-sm text-[#12141c] outline-none focus:ring-2 focus:ring-[#f5b544]"
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
