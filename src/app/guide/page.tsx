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
import { getSessionUser } from "@/lib/session";
import { logoutAction } from "@/app/login/actions";
import { toggleGuideAvailabilityAction } from "./actions";

export const dynamic = "force-dynamic";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>;
}) {
  const session = await getSessionUser();
  const { month: monthParam, date: dateParam } = await searchParams;

  const today = startOfDay(new Date());
  const viewedMonth = monthParam
    ? startOfMonth(new Date(`${monthParam}-01T00:00:00`))
    : startOfMonth(today);

  const gridStart = startOfWeek(startOfMonth(viewedMonth));
  const gridEnd = endOfWeek(endOfMonth(viewedMonth));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  let selectedDate = dateParam;
  if (!selectedDate) {
    // Default to today if it has slots, otherwise the nearest upcoming date
    // that does (seed/admin-generated schedules often start tomorrow).
    const todayStr = format(today, "yyyy-MM-dd");
    const nextSlot = await prisma.scheduleSlot.findFirst({
      where: { date: { gte: todayStr } },
      orderBy: { date: "asc" },
    });
    selectedDate = nextSlot?.date ?? todayStr;
  }

  const [myAvailabilitiesInMonth, slotsForSelectedDate] = session
    ? await Promise.all([
        prisma.guideAvailability.findMany({
          where: {
            guideId: session.userId,
            scheduleSlot: {
              date: { gte: format(gridStart, "yyyy-MM-dd"), lte: format(gridEnd, "yyyy-MM-dd") },
            },
          },
          include: { scheduleSlot: true },
        }),
        prisma.scheduleSlot.findMany({
          where: { date: selectedDate },
          include: { activity: true, guideAvailabilities: { where: { guideId: session.userId } } },
          orderBy: [{ startTime: "asc" }, { activity: { name: "asc" } }],
        }),
      ])
    : [[], []];

  const datesWithAvailability = new Set(myAvailabilitiesInMonth.map((a) => a.scheduleSlot.date));

  const isCurrentMonth = isSameMonth(viewedMonth, today);
  const prevMonthParam = format(subMonths(viewedMonth, 1), "yyyy-MM");
  const nextMonthParam = format(addMonths(viewedMonth, 1), "yyyy-MM");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">出勤可能な便の設定</h1>
          <p className="text-sm text-neutral-500 mt-1">{session?.name} 様</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-neutral-500 hover:underline">
            ログアウト
          </button>
        </form>
      </div>

      <p className="text-sm text-neutral-600 mb-4">
        日付をクリックすると、その日の便(アクティビティ・時間)が一覧表示されます。担当できる便のボタンを押して緑色にしてください。
      </p>

      <div className="border border-neutral-200 rounded-lg p-4 bg-white max-w-md mb-6">
        <div className="flex items-center justify-between mb-2">
          {isCurrentMonth ? (
            <span className="px-2 py-1 text-sm opacity-30">←</span>
          ) : (
            <Link
              href={`/guide?month=${prevMonthParam}`}
              className="px-2 py-1 text-sm rounded hover:bg-neutral-100"
            >
              ←
            </Link>
          )}
          <span className="font-semibold text-sm">{format(viewedMonth, "yyyy年M月")}</span>
          <Link
            href={`/guide?month=${nextMonthParam}`}
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
            const isPast = isBefore(day, today);
            const hasAvailability = datesWithAvailability.has(dateStr);
            const isSelected = selectedDate === dateStr;
            const disabled = !inMonth || isPast;

            return (
              <Link
                key={dateStr}
                href={disabled ? "#" : `/guide?month=${monthParam ?? format(viewedMonth, "yyyy-MM")}&date=${dateStr}`}
                aria-disabled={disabled}
                className={`aspect-square rounded-lg text-sm flex items-center justify-center relative
                  ${!inMonth ? "text-neutral-300" : ""}
                  ${disabled ? "pointer-events-none text-neutral-300" : "cursor-pointer hover:bg-emerald-50"}
                  ${isSelected ? "bg-emerald-700 text-white hover:bg-emerald-700" : ""}
                  ${isToday(day) && !isSelected ? "font-bold text-emerald-700" : ""}
                `}
              >
                {format(day, "d")}
                {hasAvailability && !isSelected && inMonth && !isPast && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="border border-neutral-200 rounded-lg p-4 bg-white">
        <h2 className="font-semibold mb-3">{selectedDate} の便</h2>
        {slotsForSelectedDate.length === 0 ? (
          <p className="text-sm text-neutral-500">この日はまだ便が設定されていません。</p>
        ) : (
          <ul className="space-y-2">
            {slotsForSelectedDate.map((slot) => {
              const isAvailable = slot.guideAvailabilities.length > 0;
              return (
                <li key={slot.id}>
                  <form action={toggleGuideAvailabilityAction}>
                    <input type="hidden" name="scheduleSlotId" value={slot.id} />
                    <input type="hidden" name="isAvailable" value={String(isAvailable)} />
                    <button
                      type="submit"
                      className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm ${
                        isAvailable
                          ? "bg-emerald-700 text-white border-emerald-700"
                          : "border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      <span>
                        {slot.startTime} - {slot.activity.name}
                      </span>
                      <span className="text-xs">{isAvailable ? "担当可能" : "未設定"}</span>
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
