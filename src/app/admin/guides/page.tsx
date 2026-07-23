import { format } from "date-fns";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminGuidesPage() {
  const today = format(new Date(), "yyyy-MM-dd");

  const guides = await prisma.staffUser.findMany({
    where: { role: "GUIDE", isActive: true },
    orderBy: { name: "asc" },
    include: {
      availabilities: {
        where: { date: { gte: today } },
        orderBy: { date: "asc" },
        take: 60,
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">ガイドの出勤可能日</h1>
      <p className="text-sm text-neutral-600">
        各ガイドが自分で「出勤可能」と設定した日程です。予約の担当ガイドを決める際の参考にしてください。
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
                <p className="text-sm text-neutral-500">出勤可能日がまだ設定されていません。</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {guide.availabilities.map((a) => (
                    <span
                      key={a.id}
                      className="text-xs bg-emerald-100 text-emerald-800 rounded-full px-2 py-1"
                    >
                      {a.date}
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
