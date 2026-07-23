import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { slotBookedCount } from "@/lib/booking";
import { calcVehiclesNeeded } from "@/lib/vehicles";

export const dynamic = "force-dynamic";

export default async function AdminScheduleListPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; guide?: string }>;
}) {
  const { range, guide } = await searchParams;
  const showAll = range === "all";
  const unassignedOnly = guide === "unassigned";
  const today = format(new Date(), "yyyy-MM-dd");

  const allSlots = await prisma.scheduleSlot.findMany({
    where: {
      deletedAt: null,
      ...(showAll ? {} : { date: { gte: today } }),
    },
    include: { activity: true, bookings: true, guideAvailabilities: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }, { activity: { name: "asc" } }],
  });

  const guideCoveredCount = allSlots.filter((s) => s.guideAvailabilities.length > 0).length;
  const slots = unassignedOnly
    ? allSlots.filter((s) => s.guideAvailabilities.length === 0)
    : allSlots;

  function hrefFor(overrides: { range?: boolean; guide?: boolean }) {
    const params = new URLSearchParams();
    const wantAll = overrides.range ?? showAll;
    const wantUnassigned = overrides.guide ?? unassignedOnly;
    if (wantAll) params.set("range", "all");
    if (wantUnassigned) params.set("guide", "unassigned");
    const qs = params.toString();
    return `/admin/schedule/list${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">登録済みの日程一覧(全アクティビティ)</h1>
        <Link href="/admin/schedule" className="text-sm text-emerald-700 hover:underline">
          ← アクティビティ別の管理画面に戻る
        </Link>
      </div>

      <p className="text-sm text-neutral-600">
        表示中の枠: {allSlots.length}件のうち、ガイドが配置され運行可能な枠:{" "}
        <span className="font-semibold text-emerald-700">{guideCoveredCount}件</span>
        (未配置: {allSlots.length - guideCoveredCount}件)
        <br />
        <span className="text-xs text-neutral-500">
          枠の設定日(在庫)と、実際にガイドが配置されて運行できる日は別物です。「運行可否」列で実際に予約を受けられる状態かを確認してください。
        </span>
      </p>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href={hrefFor({ range: false })}
          className={`rounded-full px-3 py-1 border ${
            !showAll ? "bg-emerald-700 text-white border-emerald-700" : "border-neutral-300"
          }`}
        >
          今後の日程のみ
        </Link>
        <Link
          href={hrefFor({ range: true })}
          className={`rounded-full px-3 py-1 border ${
            showAll ? "bg-emerald-700 text-white border-emerald-700" : "border-neutral-300"
          }`}
        >
          過去分も含めて全て
        </Link>
        <span className="mx-1 text-neutral-300">|</span>
        <Link
          href={hrefFor({ guide: false })}
          className={`rounded-full px-3 py-1 border ${
            !unassignedOnly ? "bg-emerald-700 text-white border-emerald-700" : "border-neutral-300"
          }`}
        >
          すべて表示
        </Link>
        <Link
          href={hrefFor({ guide: true })}
          className={`rounded-full px-3 py-1 border ${
            unassignedOnly ? "bg-amber-600 text-white border-amber-600" : "border-neutral-300"
          }`}
        >
          ガイド未配置のみ表示
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
              <th className="px-3 py-2">運行可否</th>
              <th className="px-3 py-2">必要車両</th>
            </tr>
          </thead>
          <tbody>
            {slots.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-4 text-center text-neutral-500">
                  該当する日程がありません。
                </td>
              </tr>
            )}
            {slots.map((slot) => {
              const booked = slotBookedCount(slot.bookings);
              const remaining = slot.capacity - booked;
              const isPast = slot.date < today;
              const guideCount = slot.guideAvailabilities.length;
              const vehicles = calcVehiclesNeeded(booked, guideCount > 0);
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
