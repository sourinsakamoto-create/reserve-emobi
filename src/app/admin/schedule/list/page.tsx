import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { slotBookedCount } from "@/lib/booking";

export const dynamic = "force-dynamic";

export default async function AdminScheduleListPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const showAll = range === "all";
  const today = format(new Date(), "yyyy-MM-dd");

  const slots = await prisma.scheduleSlot.findMany({
    where: {
      deletedAt: null,
      ...(showAll ? {} : { date: { gte: today } }),
    },
    include: { activity: true, bookings: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }, { activity: { name: "asc" } }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">登録済みの日程一覧(全アクティビティ)</h1>
        <Link href="/admin/schedule" className="text-sm text-emerald-700 hover:underline">
          ← アクティビティ別の管理画面に戻る
        </Link>
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href="/admin/schedule/list"
          className={`rounded-full px-3 py-1 border ${
            !showAll ? "bg-emerald-700 text-white border-emerald-700" : "border-neutral-300"
          }`}
        >
          今後の日程のみ
        </Link>
        <Link
          href="/admin/schedule/list?range=all"
          className={`rounded-full px-3 py-1 border ${
            showAll ? "bg-emerald-700 text-white border-emerald-700" : "border-neutral-300"
          }`}
        >
          過去分も含めて全て
        </Link>
      </div>

      <div className="border border-neutral-200 rounded-lg overflow-x-auto bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left">
            <tr>
              <th className="px-3 py-2">日付</th>
              <th className="px-3 py-2">時刻</th>
              <th className="px-3 py-2">アクティビティ</th>
              <th className="px-3 py-2">定員</th>
              <th className="px-3 py-2">予約済</th>
              <th className="px-3 py-2">残り</th>
              <th className="px-3 py-2">販売状態</th>
            </tr>
          </thead>
          <tbody>
            {slots.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-neutral-500">
                  該当する日程がありません。
                </td>
              </tr>
            )}
            {slots.map((slot) => {
              const booked = slotBookedCount(slot.bookings);
              const remaining = slot.capacity - booked;
              const isPast = slot.date < today;
              return (
                <tr
                  key={slot.id}
                  className={`border-t border-neutral-100 ${isPast ? "text-neutral-400" : ""}`}
                >
                  <td className="px-3 py-2">{slot.date}</td>
                  <td className="px-3 py-2">{slot.startTime}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/schedule?activityId=${slot.activityId}`}
                      className="hover:underline"
                    >
                      {slot.activity.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{slot.capacity}</td>
                  <td className="px-3 py-2">{booked}</td>
                  <td className="px-3 py-2">{remaining}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-xs font-medium rounded-full px-2 py-1 ${
                        slot.isOpen
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {slot.isOpen ? "受付中" : "停止中"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
