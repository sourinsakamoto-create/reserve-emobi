import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { toggleGuideGateAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminGuidesPage() {
  const today = format(new Date(), "yyyy-MM-dd");

  const [guides, settings] = await Promise.all([
    prisma.staffUser.findMany({
      where: { role: "GUIDE", isActive: true },
      orderBy: { name: "asc" },
      include: {
        availabilities: {
          where: { scheduleSlot: { date: { gte: today } } },
          include: { scheduleSlot: { include: { activity: true } } },
          orderBy: { scheduleSlot: { date: "asc" } },
          take: 60,
        },
      },
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
        各ガイドが自分で「出勤可能」と設定した便(日時・アクティビティ)です。予約の担当ガイドを決める際の参考にしてください。
        同じ便に複数のガイドが登録した場合、先に登録した人が自動的に予約の担当として割り当てられます。
        (ガイドアカウントの追加は「スタッフ管理」から行えます)
      </p>

      {guides.length === 0 ? (
        <p className="text-sm text-neutral-500">
          ガイドアカウントがまだ登録されていません。「スタッフ管理」から役割を「ガイド」にして追加してください。
        </p>
      ) : (
        <ul className="space-y-4">
          {guides.map((guide) => (
            <li key={guide.id} className="border border-neutral-200 rounded-lg p-4 bg-white">
              <h2 className="font-semibold mb-2">
                {guide.name} <span className="text-xs text-neutral-400">{guide.email}</span>
              </h2>
              {guide.availabilities.length === 0 ? (
                <p className="text-sm text-neutral-500">出勤可能な便がまだ登録されていません。</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {guide.availabilities.map((a) => (
                    <span
                      key={a.id}
                      className="text-xs bg-emerald-100 text-emerald-800 rounded-full px-2 py-1"
                    >
                      {a.scheduleSlot.date} {a.scheduleSlot.startTime} / {a.scheduleSlot.activity.name}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
