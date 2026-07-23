import Link from "next/link";
import { format } from "date-fns";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toggleGuideGateAction } from "./actions";

export const dynamic = "force-dynamic";

const SORT_OPTIONS = ["date", "activity", "unassigned"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const SORT_LABELS: Record<SortOption, string> = {
  date: "日時順",
  activity: "プラン順",
  unassigned: "ガイド未配置を優先",
};

const SORT_ORDER_BY: Record<SortOption, Prisma.ScheduleSlotOrderByWithRelationInput[]> = {
  date: [{ date: "asc" }, { startTime: "asc" }, { activity: { name: "asc" } }],
  activity: [{ activity: { name: "asc" } }, { date: "asc" }, { startTime: "asc" }],
  unassigned: [{ guideAvailabilities: { _count: "asc" } }, { date: "asc" }, { startTime: "asc" }],
};

export default async function AdminGuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const { sort: sortParam } = await searchParams;
  const sort: SortOption = SORT_OPTIONS.includes(sortParam as SortOption)
    ? (sortParam as SortOption)
    : "date";

  const [guides, slots, settings] = await Promise.all([
    prisma.staffUser.findMany({
      where: { role: "GUIDE", isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.scheduleSlot.findMany({
      where: { date: { gte: today }, deletedAt: null },
      include: { activity: true, guideAvailabilities: true },
      orderBy: SORT_ORDER_BY[sort],
    }),
    prisma.bookingSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  const gateEnabled = settings?.requireGuideAvailability ?? false;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">ガイドの出勤可能日</h1>

      <div className="border border-neutral-200 rounded-lg p-4 bg-white">
        <form action={toggleGuideGateAction} className="flex items-start gap-3">
          <input type="hidden" name="current" value={String(gateEnabled)} />
          <button
            type="submit"
            className={`shrink-0 text-xs font-medium rounded-full px-3 py-1 ${
              gateEnabled ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"
            }`}
          >
            {gateEnabled ? "制限: 有効(クリックで無効化)" : "制限: 無効(クリックで有効化)"}
          </button>
          <p className="text-sm text-neutral-600">
            有効にすると、担当ガイドが1人も登録されていない便はお客様が予約できなくなります。
            {gateEnabled ? (
              <span className="text-emerald-700 font-medium"> 現在この制限は有効です。</span>
            ) : (
              <span> 現在は無効なので、ガイドの登録状況にかかわらず今まで通り予約可能です。</span>
            )}
          </p>
        </form>
      </div>

      <p className="text-sm text-neutral-600">
        各ガイドが「担当可能」と設定した便(日時・アクティビティ)を、便×ガイドの表で確認できます。★は同じ便に複数のガイドが登録した場合に、先に登録して自動的に予約の担当として割り当てられるガイドです。
        (ガイドアカウントの追加は「スタッフ管理」から行えます)
      </p>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-neutral-500">並び替え:</span>
        {SORT_OPTIONS.map((option) => (
          <Link
            key={option}
            href={option === "date" ? "/admin/guides" : `/admin/guides?sort=${option}`}
            className={`rounded-full px-3 py-1 border ${
              sort === option ? "bg-emerald-700 text-white border-emerald-700" : "border-neutral-300"
            }`}
          >
            {SORT_LABELS[option]}
          </Link>
        ))}
      </div>

      {guides.length === 0 ? (
        <p className="text-sm text-neutral-500">
          ガイドアカウントがまだ登録されていません。「スタッフ管理」から役割を「ガイド」にして追加してください。
        </p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-neutral-500">今後の日程がまだ登録されていません。</p>
      ) : (
        <div className="border border-neutral-200 rounded-lg overflow-x-auto bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-left">
              <tr>
                <th className="px-3 py-2 sticky left-0 bg-neutral-100">日時・プラン</th>
                {guides.map((g) => (
                  <th key={g.id} className="px-3 py-2 text-center whitespace-nowrap">
                    {g.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => {
                const sortedAvailabilities = [...slot.guideAvailabilities].sort(
                  (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
                );
                const primaryGuideId = sortedAvailabilities[0]?.guideId;
                const availableGuideIds = new Set(slot.guideAvailabilities.map((a) => a.guideId));

                return (
                  <tr key={slot.id} className="border-t border-neutral-100">
                    <td className="px-3 py-2 whitespace-nowrap sticky left-0 bg-white">
                      {slot.date} {slot.startTime} / {slot.activity.name}
                    </td>
                    {guides.map((g) => {
                      const isAvailable = availableGuideIds.has(g.id);
                      const isPrimary = g.id === primaryGuideId;
                      return (
                        <td key={g.id} className="px-3 py-2 text-center">
                          {isAvailable ? (
                            <span
                              className={`inline-flex items-center justify-center rounded-full w-7 h-7 text-xs font-bold ${
                                isPrimary
                                  ? "bg-emerald-700 text-white"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                              title={isPrimary ? "担当(先に登録)" : "担当可能"}
                            >
                              {isPrimary ? "★" : "○"}
                            </span>
                          ) : (
                            <span className="text-neutral-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
