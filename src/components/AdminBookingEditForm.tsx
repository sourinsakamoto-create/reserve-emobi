"use client";

import { useActionState, useMemo, useState } from "react";
import {
  updateBookingAction,
  type BookingEditActionState,
} from "@/app/admin/bookings/[id]/edit/actions";

type SlotForForm = {
  id: string;
  date: string;
  startTime: string;
  remaining: number;
  isOpen: boolean;
};

type BookingForForm = {
  id: string;
  scheduleSlotId: string;
  customerName: string;
  customerKana: string | null;
  customerEmail: string;
  customerPhone: string;
  numAdults: number;
  numChildren: number;
  notes: string | null;
};

const initialState: BookingEditActionState = { status: "idle" };

export default function AdminBookingEditForm({
  booking,
  slots,
}: {
  booking: BookingForForm;
  slots: SlotForForm[];
}) {
  const [state, formAction, pending] = useActionState(updateBookingAction, initialState);

  const dates = useMemo(() => {
    const set = new Set(slots.map((s) => s.date));
    return Array.from(set).sort();
  }, [slots]);

  const currentSlot = slots.find((s) => s.id === booking.scheduleSlotId);
  const [selectedDate, setSelectedDate] = useState(currentSlot?.date ?? dates[0] ?? "");
  const [selectedSlotId, setSelectedSlotId] = useState(booking.scheduleSlotId);

  const slotsForDate = slots.filter((s) => s.date === selectedDate);
  const fieldError = (name: string) => state.fieldErrors?.[name];

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="bookingId" value={booking.id} />

      {state.status === "error" && state.message && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {state.message}
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-2">日付</h3>
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
      </div>

      <div>
        <h3 className="font-semibold mb-2">時間</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {slotsForDate.map((slot) => {
            const isCurrent = slot.id === booking.scheduleSlotId;
            // The slot this booking already occupies always has room for it,
            // even though `remaining` was computed excluding this booking.
            const disabled = !slot.isOpen && !isCurrent ? true : !isCurrent && slot.remaining <= 0;
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
                  {isCurrent ? "現在の予約枠" : disabled ? "満席/停止中" : `残り${slot.remaining}名`}
                </span>
              </label>
            );
          })}
        </div>
        {fieldError("scheduleSlotId") && (
          <p className="text-xs text-red-600 mt-1">{fieldError("scheduleSlotId")}</p>
        )}
      </div>

      <input type="hidden" name="scheduleSlotId" value={selectedSlotId} />

      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <label className="text-sm">
          大人
          <input
            type="number"
            name="numAdults"
            min={1}
            defaultValue={booking.numAdults}
            className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
          />
        </label>
        <label className="text-sm">
          子供
          <input
            type="number"
            name="numChildren"
            min={0}
            defaultValue={booking.numChildren}
            className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
          />
        </label>
      </div>

      <div className="grid gap-4 max-w-md">
        <label className="text-sm">
          お名前
          <input
            name="customerName"
            defaultValue={booking.customerName}
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
            defaultValue={booking.customerKana ?? ""}
            className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
          />
        </label>
        <label className="text-sm">
          メールアドレス
          <input
            type="email"
            name="customerEmail"
            defaultValue={booking.customerEmail}
            className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
          />
          {fieldError("customerEmail") && (
            <p className="text-xs text-red-600 mt-1">{fieldError("customerEmail")}</p>
          )}
        </label>
        <label className="text-sm">
          電話番号
          <input
            name="customerPhone"
            defaultValue={booking.customerPhone}
            className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
          />
          {fieldError("customerPhone") && (
            <p className="text-xs text-red-600 mt-1">{fieldError("customerPhone")}</p>
          )}
        </label>
        <label className="text-sm">
          備考
          <textarea
            name="notes"
            defaultValue={booking.notes ?? ""}
            rows={3}
            className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending || !selectedSlotId}
        className="rounded-lg bg-emerald-700 text-white px-6 py-3 font-medium hover:bg-emerald-800 disabled:opacity-50"
      >
        {pending ? "保存中..." : "変更を保存する(お客様に変更メールが送られます)"}
      </button>
    </form>
  );
}
