"use client";

import { useActionState, useMemo, useState } from "react";
import { createBookingAction, type BookingActionState } from "@/app/activities/[slug]/actions";

type SlotForForm = {
  id: string;
  date: string;
  startTime: string;
  remaining: number;
  isOpen: boolean;
};

const initialState: BookingActionState = { status: "idle" };

export default function BookingForm({ slots }: { slots: SlotForForm[] }) {
  const [state, formAction, pending] = useActionState(createBookingAction, initialState);

  const dates = useMemo(() => {
    const set = new Set(slots.map((s) => s.date));
    return Array.from(set).sort();
  }, [slots]);

  const [selectedDate, setSelectedDate] = useState(dates[0] ?? "");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");

  const slotsForDate = slots.filter((s) => s.date === selectedDate);

  const fieldError = (name: string) => state.fieldErrors?.[name];

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "error" && state.message && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {state.message}
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-2">1. 日付を選択</h3>
        {dates.length === 0 ? (
          <p className="text-sm text-neutral-500">現在予約可能な日程がありません。</p>
        ) : (
          <select
            className="border border-neutral-300 rounded-lg px-3 py-2 w-full sm:w-64"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSlotId("");
            }}
          >
            {dates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedDate && (
        <div>
          <h3 className="font-semibold mb-2">2. 時間を選択</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {slotsForDate.map((slot) => {
              const disabled = !slot.isOpen || slot.remaining <= 0;
              return (
                <label
                  key={slot.id}
                  className={`border rounded-lg px-3 py-2 text-sm flex items-center justify-between cursor-pointer ${
                    disabled
                      ? "opacity-40 cursor-not-allowed bg-neutral-100"
                      : selectedSlotId === slot.id
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-neutral-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="scheduleSlotIdRadio"
                      value={slot.id}
                      disabled={disabled}
                      checked={selectedSlotId === slot.id}
                      onChange={() => setSelectedSlotId(slot.id)}
                    />
                    {slot.startTime}
                  </span>
                  <span className="text-xs">
                    {disabled ? "満席/停止中" : `残り${slot.remaining}名`}
                  </span>
                </label>
              );
            })}
          </div>
          {fieldError("scheduleSlotId") && (
            <p className="text-xs text-red-600 mt-1">{fieldError("scheduleSlotId")}</p>
          )}
        </div>
      )}

      <input type="hidden" name="scheduleSlotId" value={selectedSlotId} />

      <div>
        <h3 className="font-semibold mb-2">3. 人数</h3>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <label className="text-sm">
            大人
            <input
              type="number"
              name="numAdults"
              min={1}
              defaultValue={state.values?.numAdults ?? "1"}
              className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
            />
            {fieldError("numAdults") && (
              <p className="text-xs text-red-600 mt-1">{fieldError("numAdults")}</p>
            )}
          </label>
          <label className="text-sm">
            子供
            <input
              type="number"
              name="numChildren"
              min={0}
              defaultValue={state.values?.numChildren ?? "0"}
              className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">4. お客様情報</h3>
        <div className="grid gap-4 max-w-md">
          <label className="text-sm">
            お名前<span className="text-red-600">*</span>
            <input
              name="customerName"
              defaultValue={state.values?.customerName}
              className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
            />
            {fieldError("customerName") && (
              <p className="text-xs text-red-600 mt-1">{fieldError("customerName")}</p>
            )}
          </label>
          <label className="text-sm">
            フリガナ
            <input
              name="customerKana"
              defaultValue={state.values?.customerKana}
              className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
            />
          </label>
          <label className="text-sm">
            メールアドレス<span className="text-red-600">*</span>
            <input
              type="email"
              name="customerEmail"
              defaultValue={state.values?.customerEmail}
              className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
            />
            {fieldError("customerEmail") && (
              <p className="text-xs text-red-600 mt-1">{fieldError("customerEmail")}</p>
            )}
          </label>
          <label className="text-sm">
            電話番号<span className="text-red-600">*</span>
            <input
              name="customerPhone"
              defaultValue={state.values?.customerPhone}
              className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
            />
            {fieldError("customerPhone") && (
              <p className="text-xs text-red-600 mt-1">{fieldError("customerPhone")}</p>
            )}
          </label>
          <label className="text-sm">
            備考(送迎場所のご希望など)
            <textarea
              name="notes"
              defaultValue={state.values?.notes}
              rows={3}
              className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
            />
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending || !selectedSlotId}
        className="rounded-lg bg-emerald-700 text-white px-6 py-3 font-medium hover:bg-emerald-800 disabled:opacity-50"
      >
        {pending ? "送信中..." : "この内容で予約する"}
      </button>
    </form>
  );
}
