"use client";

import { useActionState, useMemo, useState } from "react";
import { createBookingAction, type BookingActionState } from "@/app/activities/[slug]/actions";
import Calendar from "@/components/Calendar";

type SlotForForm = {
  id: string;
  date: string;
  startTime: string;
  remaining: number;
  isOpen: boolean;
  hasGuide: boolean;
  guideRequired: boolean;
};

const RENTAL_SITE_URL = "https://new-app.emobi.co.jp/";

function isSlotBookable(slot: SlotForForm) {
  return slot.isOpen && slot.remaining > 0 && (!slot.guideRequired || slot.hasGuide);
}

const initialState: BookingActionState = { status: "idle" };

export default function BookingForm({ slots }: { slots: SlotForForm[] }) {
  const [state, formAction, pending] = useActionState(createBookingAction, initialState);

  const availableDates = useMemo(() => {
    const set = new Set(slots.filter(isSlotBookable).map((s) => s.date));
    return Array.from(set).sort();
  }, [slots]);

  // Days where departures exist but none has a guide assigned (and guide
  // coverage is required) — no guided tour runs, but customers can still
  // use the normal self-service rental instead.
  const noGuideDates = useMemo(() => {
    const byDate = new Map<string, SlotForForm[]>();
    for (const s of slots) {
      if (!byDate.has(s.date)) byDate.set(s.date, []);
      byDate.get(s.date)!.push(s);
    }
    const result: string[] = [];
    for (const [date, daySlots] of byDate) {
      if (availableDates.includes(date)) continue;
      if (daySlots.some((s) => s.guideRequired) && daySlots.every((s) => !s.hasGuide)) {
        result.push(date);
      }
    }
    return result.sort();
  }, [slots, availableDates]);

  const [selectedDate, setSelectedDate] = useState(availableDates[0] ?? noGuideDates[0] ?? "");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");

  const slotsForDate = slots.filter((s) => s.date === selectedDate);
  const dayHasNoGuideSlot = slotsForDate.some((s) => s.guideRequired && !s.hasGuide);

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
        {availableDates.length === 0 && noGuideDates.length === 0 ? (
          <p className="text-sm text-neutral-500">現在予約可能な日程がありません。</p>
        ) : (
          <Calendar
            availableDates={availableDates}
            noGuideDates={noGuideDates}
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setSelectedSlotId("");
            }}
          />
        )}
      </div>

      {selectedDate && (
        <div>
          <h3 className="font-semibold mb-2">2. 時間を選択</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {slotsForDate.map((slot) => {
              const disabled = !isSlotBookable(slot);
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
                    {!slot.isOpen || slot.remaining <= 0
                      ? "満席/停止中"
                      : slot.guideRequired && !slot.hasGuide
                      ? "運行なし"
                      : `残り${slot.remaining}名`}
                  </span>
                </label>
              );
            })}
          </div>
          {fieldError("scheduleSlotId") && (
            <p className="text-xs text-red-600 mt-1">{fieldError("scheduleSlotId")}</p>
          )}
          {dayHasNoGuideSlot && (
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <p>この日はガイド不在のため、ガイド付きツアーの運行がございません。</p>
              <p className="mt-1">
                通常のレンタルは以下のサイトからご利用いただけます:{" "}
                <a
                  href={RENTAL_SITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  emobi レンタル予約サイト
                </a>
              </p>
            </div>
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
            備考
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
