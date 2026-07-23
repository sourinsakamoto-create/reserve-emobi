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
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await getSessionUser();
  const { month: monthParam } = await searchParams;

  const today = startOfDay(new Date());
  const viewedMonth = monthParam
    ? startOfMonth(new Date(`${monthParam}-01T00:00:00`))
    : startOfMonth(today);

  const gridStart = startOfWeek(startOfMonth(viewedMonth));
  const gridEnd = endOfWeek(endOfMonth(viewedMonth));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const availabilities = session
    ? await prisma.guideAvailability.findMany({
        where: {
          guideId: session.userId,
          date: { gte: format(gridStart, "yyyy-MM-dd"), lte: format(gridEnd, "yyyy-MM-dd") },
        },
      })
    : [];
  const availableSet = new Set(availabilities.map((a) => a.date));

  const isCurrentMonth = isSameMonth(viewedMonth, today);
  const prevMonthParam = format(subMonths(viewedMonth, 1), "yyyy-MM");
  const nextMonthParam = format(addMonths(viewedMonth, 1), "yyyy-MM");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">出勤可能日の設定</h1>
          <p className="text-sm text-neutral-500 mt-1">{session?.name} 様</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-neutral-500 hover:underline">
            ログアウト
          </button>
        </form>
      </div>

      <p className="text-sm text-neutral-600 mb-4">
        出勤できる日をクリックして緑色にしてください。もう一度クリックすると解除できます。
      </p>

      <div className="border border-neutral-200 rounded-lg p-4 bg-white max-w-md">
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
            const isAvailable = availableSet.has(dateStr);
            const disabled = !inMonth || isPast;

            return (
              <form key={dateStr} action={toggleGuideAvailabilityAction}>
                <input type="hidden" name="date" value={dateStr} />
                <input type="hidden" name="isAvailable" value={String(isAvailable)} />
                <button
                  type="submit"
                  disabled={disabled}
                  className={`w-full aspect-square rounded-lg text-sm flex items-center justify-center
                    ${!inMonth ? "text-neutral-300" : ""}
                    ${disabled ? "cursor-not-allowed text-neutral-300" : "cursor-pointer hover:bg-emerald-50"}
                    ${isAvailable ? "bg-emerald-700 text-white hover:bg-emerald-800" : ""}
                    ${isToday(day) && !isAvailable ? "font-bold text-emerald-700" : ""}
                  `}
                >
                  {format(day, "d")}
                </button>
              </form>
            );
          })}
        </div>
      </div>
    </div>
  );
}
