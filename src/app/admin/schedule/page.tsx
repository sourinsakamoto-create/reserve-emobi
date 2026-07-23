import Link from "next/link";
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
import { prisma } from "@/lib/prisma";
import { slotBookedCount } from "@/lib/booking";
import { calcVehiclesNeeded } from "@/lib/vehicles";
import { updateSlotAction, toggleSlotOpenAction, deleteSlotAction } from "./actions";
import BulkGenerateForm from "@/components/BulkGenerateForm";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ activityId?: string; view?: string; month?: string; date?: string }>;
}) {
  const activities = await prisma.activity.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  const {
    activityId: activityIdParam,
    view: viewParam,
    month: monthParam,
    date: dateParam,
  } = await searchParams;
  const activityId = activityIdParam || activities[0]?.id;
  const activity = activities.find((a) => a.id === activityId);
  const view = viewParam === "calendar" ? "calendar" : "list";

  const today = format(new Date(), "yyyy-MM-dd");
  const allSlots = activity
    ? await prisma.scheduleSlot.findMany({
        where: { activityId: activity.id, date: { gte: today }, deletedAt: null },
        include: { bookings: true, guideAvailabilities: true },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      })
    : [];
  const guideCoveredCount = allSlots.filter((s) => s.guideAvailabilities.length > 0).length;

  let selectedDate = dateParam;
  if (view === "calendar" && !selectedDate) {
    selectedDate = allSlots[0]?.date ?? today;
  }
  const slots = view === "calendar" ? allSlots.filter((s) => s.date === selectedDate) : allSlots;

  const todayDate = startOfDay(new Date());
  const viewedMonth = monthParam
    ? startOfMonth(new Date(`${monthParam}-01T00:00:00`))
    : startOfMonth(selectedDate ? new Date(`${selectedDate}T00:00:00`) : todayDate);
  const gridStart = startOfWeek(startOfMonth(viewedMonth));
  const gridEnd = endOfWeek(endOfMonth(viewedMonth));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const slotsByDate = new Map<string, typeof allSlots>();
  for (const slot of allSlots) {
    if (!slotsByDate.has(slot.date)) slotsByDate.set(slot.date, []);
    slotsByDate.get(slot.date)!.push(slot);
  }

  function viewHref(overrides: { view?: "list" | "calendar"; date?: string; month?: string }) {
    const params = new URLSearchParams();
    if (activity) params.set("activityId", activity.id);
    const targetView = overrides.view ?? view;
    if (targetView === "calendar") params.set("view", "calendar");
    if (targetView === "calendar" && (overrides.date ?? selectedDate)) {
      params.set("date", overrides.date ?? selectedDate!);
    }
    if (overrides.month) params.set("month", overrides.month);
    return `/admin/schedule?${params.toString()}`;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">日程・在庫管理</h1>
        <Link href="/admin/schedule/list" className="text-sm text-emerald-700 hover:underline">
          全アクティビティの日程を一覧で見る →
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {activities.map((a) => (
          <Link
            key={a.id}
            href={`/admin/schedule?activityId=${a.id}${view === "calendar" ? "&view=calendar" : ""}`}
            className={`text-sm rounded-full px-3 py-1 border ${
              a.id === activity?.id
                ? "bg-emerald-700 text-white border-emerald-700"
                : "border-neutral-300"
            }`}
          >
            {a.name}
          </Link>
        ))}
      </div>

      {!activity ? (
        <p className="text-sm text-neutral-500">先にアクティビティを作成してください。</p>
      ) : (
        <>
          <BulkGenerateForm activityId={activity.id} />

          <p className="text-sm text-neutral-600">
            設定済みの枠: {allSlots.length}件のうち、ガイドが配置され運行可能な枠:{" "}
            <span className="font-semibold text-emerald-700">{guideCoveredCount}件</span>
            (未配置: {allSlots.length - guideCoveredCount}件)
            <br />
            <span className="text-xs text-neutral-500">
              枠を作成しただけではスタッフが運行できるとは限りません。「運行可否」列で実際にガイドが配置されているかを確認してください。
            </span>
          </p>

          <div className="flex gap-2 text-sm">
            <Link
              href={viewHref({ view: "list" })}
              className={`rounded-full px-3 py-1 border ${
                view === "list" ? "bg-emerald-700 text-white border-emerald-700" : "border-neutral-300"
              }`}
            >
              リスト表示
            </Link>
            <Link
              href={viewHref({ view: "calendar" })}
              className={`rounded-full px-3 py-1 border ${
                view === "calendar" ? "bg-emerald-700 text-white border-emerald-700" : "border-neutral-300"
              }`}
            >
              カレンダー表示
            </Link>
          </div>

          {view === "calendar" && (
            <div className="border border-neutral-200 rounded-lg p-4 bg-white max-w-md">
              <div className="flex items-center justify-between mb-2">
                <Link
                  href={viewHref({ month: format(subMonths(viewedMonth, 1), "yyyy-MM") })}
                  className="px-2 py-1 text-sm rounded hover:bg-neutral-100"
                >
                  ←
                </Link>
                <span className="font-semibold text-sm">{format(viewedMonth, "yyyy年M月")}</span>
                <Link
                  href={viewHref({ month: format(addMonths(viewedMonth, 1), "yyyy-MM") })}
                  className="px-2 py-1 text-sm rounded hover:bg-neutral-100"
                >
                  →
                </Link>
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
                  const isPast = isBefore(day, todayDate);
                  const daySlots = slotsByDate.get(dateStr) ?? [];
                  const hasSlots = daySlots.length > 0;
                  const allCovered = hasSlots && daySlots.every((s) => s.guideAvailabilities.length > 0);
                  const someCovered = hasSlots && daySlots.some((s) => s.guideAvailabilities.length > 0);
                  const isSelected = selectedDate === dateStr;

                  return (
                    <Link
                      key={dateStr}
                      href={!inMonth || isPast ? "#" : viewHref({ date: dateStr, month: format(viewedMonth, "yyyy-MM") })}
                      aria-disabled={!inMonth || isPast}
                      className={`aspect-square rounded-lg text-xs flex flex-col items-center justify-center gap-0.5 relative border-2
                        ${!inMonth ? "text-neutral-300 border-transparent pointer-events-none" : ""}
                        ${isPast && inMonth ? "text-neutral-300 border-transparent pointer-events-none" : ""}
                        ${isSelected ? "bg-emerald-700 text-white border-emerald-700" : "border-transparent hover:bg-neutral-100"}
                        ${isToday(day) && !isSelected ? "font-bold text-emerald-700" : ""}
                      `}
                    >
                      <span>{format(day, "d")}</span>
                      {hasSlots && !isSelected && (
                        <span
                          className={`text-[9px] leading-none ${
                            allCovered ? "text-emerald-600" : someCovered ? "text-amber-600" : "text-neutral-400"
                          }`}
                        >
                          {daySlots.length}便
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                緑字: 全便ガイド配置済み / オレンジ字: 一部未配置 / グレー字: 全便未配置
              </p>
            </div>
          )}

          <div className="border border-neutral-200 rounded-lg overflow-x-auto bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 text-left">
                <tr>
                  <th className="px-3 py-2">日付</th>
                  <th className="px-3 py-2">時刻</th>
                  <th className="px-3 py-2">定員</th>
                  <th className="px-3 py-2">予約済</th>
                  <th className="px-3 py-2">残り</th>
                  <th className="px-3 py-2">販売状態</th>
                  <th className="px-3 py-2">運行可否</th>
                  <th className="px-3 py-2">必要車両</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {slots.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-4 text-center text-neutral-500">
                      {view === "calendar"
                        ? "この日には枠がありません。"
                        : "枠がありません。上のフォームから作成してください。"}
                    </td>
                  </tr>
                )}
                {slots.map((slot) => {
                  const booked = slotBookedCount(slot.bookings);
                  const remaining = slot.capacity - booked;
                  const guideCount = slot.guideAvailabilities.length;
                  const vehicles = calcVehiclesNeeded(booked, guideCount > 0);
                  return (
                    <tr key={slot.id} className="border-t border-neutral-100">
                      <td className="px-3 py-2">{slot.date}</td>
                      <td className="px-3 py-2">{slot.startTime}</td>
                      <td className="px-3 py-2">
                        <form action={updateSlotAction} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={slot.id} />
                          <input
                            type="number"
                            name="capacity"
                            defaultValue={slot.capacity}
                            min={booked}
                            className="w-16 border border-neutral-300 rounded px-2 py-1"
                          />
                          <button type="submit" className="text-xs text-emerald-700 hover:underline">
                            保存
                          </button>
                        </form>
                      </td>
                      <td className="px-3 py-2">{booked}</td>
                      <td className="px-3 py-2">{remaining}</td>
                      <td className="px-3 py-2">
                        <form action={toggleSlotOpenAction}>
                          <input type="hidden" name="id" value={slot.id} />
                          <input type="hidden" name="isOpen" value={String(slot.isOpen)} />
                          <button
                            type="submit"
                            className={`text-xs font-medium rounded-full px-2 py-1 ${
                              slot.isOpen
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-neutral-200 text-neutral-600"
                            }`}
                          >
                            {slot.isOpen ? "受付中" : "停止中"}
                          </button>
                        </form>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-xs font-medium rounded-full px-2 py-1 ${
                            guideCount > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {guideCount > 0 ? `運行可(${guideCount}名)` : "ガイド未配置"}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {booked > 0 || guideCount > 0
                          ? `${vehicles.total}台(客${vehicles.customerVehicles}+ガイド${vehicles.guideVehicles})`
                          : "-"}
                      </td>
                      <td className="px-3 py-2">
                        <form action={deleteSlotAction}>
                          <input type="hidden" name="id" value={slot.id} />
                          <ConfirmSubmitButton
                            className="text-xs text-red-600 hover:underline"
                            confirmMessage={
                              booked > 0
                                ? `この枠には現在${booked}名分の予約が入っています。削除するとそれらの予約はキャンセル扱いとなり、お客様(および担当ガイド)にキャンセルのメールが送信されます。よろしいですか？`
                                : undefined
                            }
                          >
                            削除
                          </ConfirmSubmitButton>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
