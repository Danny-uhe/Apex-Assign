import type { CheckboxProps } from "./Checkbox.types";

export default function Checkbox({
  checked,
  onChange,
  label,
}: CheckboxProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400 select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-zinc-600 accent-orange-600"
      />
      <span>{label}</span>
    </label>
  );
}