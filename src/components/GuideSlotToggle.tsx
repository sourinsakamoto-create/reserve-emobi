"use client";

import { useState } from "react";

export default function GuideSlotToggle({
  slotId,
  label,
  defaultChecked,
}: {
  slotId: string;
  label: string;
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <label
      className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm cursor-pointer ${
        checked ? "bg-emerald-700 text-white border-emerald-700" : "border-neutral-300 hover:bg-neutral-50"
      }`}
    >
      <span>{label}</span>
      <input
        type="checkbox"
        name="checkedSlotIds"
        value={slotId}
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="sr-only"
      />
      <span className="text-xs">{checked ? "担当可能" : "未設定"}</span>
    </label>
  );
}
