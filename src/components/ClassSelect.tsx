import type { SelectHTMLAttributes } from "react";

/** Class/grade dropdown. A child's existing class that isn't in the list is kept as an option so it doesn't vanish. */
export default function ClassSelect({
  levels,
  value,
  emptyLabel = "No class",
  ...rest
}: { levels: string[]; value: string; emptyLabel?: string } & Omit<SelectHTMLAttributes<HTMLSelectElement>, "value">) {
  const options = value && !levels.includes(value) ? [value, ...levels] : levels;
  return (
    <select {...rest} value={value}>
      <option value="">{emptyLabel}</option>
      {options.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}
