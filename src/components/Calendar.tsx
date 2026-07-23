"use client";

import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function Calendar({
  availableDates,
  noGuideDates = [],
  selectedDate,
  onSelectDate,
}: {
  availableDates: string[];
  /** Dates with no guide-covered departures, but self-service rental is still an option. */
  noGuideDates?: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const availableSet = new Set(availableDates);
  const noGuideSet = new Set(noGuideDates);
  const initialMonth = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
  const [viewedMonth, setViewedMonth] = useState(startOfMonth(initialMonth));

  const today = startOfDay(new Date());
  const gridStart = startOfWeek(startOfMonth(viewedMonth));
  const gridEnd = endOfWeek(endOfMonth(viewedMonth));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="border border-neutral-200 rounded-lg p-3 bg-white max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setViewedMonth((m) => subMonths(m, 1))}
          disabled={isSameMonth(viewedMonth, today) || isBefore(viewedMonth, today)}
          className="px-2 py-1 text-sm rounded hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="前の月"
        >
          ←
        </button>
        <span className="font-semibold text-sm">{format(viewedMonth, "yyyy年M月")}</span>
        <button
          type="button"
          onClick={() => setViewedMonth((m) => addMonths(m, 1))}
          className="px-2 py-1 text-sm rounded hover:bg-neutral-100"
          aria-label="次の月"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-neutral-500 mb-1">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, viewedMonth);
          const isPast = isBefore(day, today);
          const hasAvailability = availableSet.has(dateStr);
          const hasNoGuideRental = !hasAvailability && noGuideSet.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const disabled = !inMonth || isPast || (!hasAvailability && !hasNoGuideRental);
          const showVariant = inMonth && !isPast && !isSelected;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(dateStr)}
              className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-center gap-0.5 relative border-2
                ${!inMonth ? "text-neutral-300 border-transparent" : ""}
                ${disabled ? "cursor-not-allowed text-neutral-300 border-transparent" : "cursor-pointer"}
                ${
                  isSelected
                    ? "bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-700"
                    : showVariant && hasAvailability
                    ? "bg-emerald-100 border-emerald-500 text-emerald-900 font-bold hover:bg-emerald-200"
                    : !disabled
                    ? "border-transparent hover:bg-emerald-50"
                    : ""
                }
                ${isToday(day) && !isSelected && !showVariant ? "font-bold text-emerald-700" : ""}
              `}
            >
              <span>{format(day, "d")}</span>
              {showVariant && hasAvailability && (
                <span className="text-[9px] leading-none">予約可</span>
              )}
              {showVariant && hasNoGuideRental && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-neutral-500 mt-2">
        緑色の日はガイド付きツアーが予約可能です。オレンジの点がついた日はガイドの運行はありませんが、通常のレンタルはご利用いただけます。
      </p>
    </div>
  );
}
