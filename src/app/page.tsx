import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const activities = await prisma.activity.findMany({
    where: { isOnSale: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">トゥクトゥクアクティビティ一覧</h1>
      <p className="text-neutral-600 mb-8">
        ご希望のコースを選んで、日時・人数をご入力のうえご予約ください。
      </p>

      {activities.length === 0 ? (
        <p className="text-neutral-500">現在ご予約いただけるアクティビティはありません。</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {activities.map((activity) => (
            <li
              key={activity.id}
              className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm flex flex-col"
            >
              <h2 className="text-lg font-semibold">{activity.name}</h2>
              <p className="text-sm text-neutral-600 mt-2 flex-1">
                {activity.description}
              </p>
              <dl className="mt-4 text-sm text-neutral-700 space-y-1">
                <div className="flex justify-between">
                  <dt>所要時間</dt>
                  <dd>{activity.durationMinutes}分</dd>
                </div>
                <div className="flex justify-between">
                  <dt>料金</dt>
                  <dd>
                    大人 {activity.pricePerAdult.toLocaleString()}円 / 子供{" "}
                    {activity.pricePerChild.toLocaleString()}円
                  </dd>
                </div>
              </dl>
              <Link
                href={`/activities/${activity.slug}`}
                className="mt-4 inline-block text-center rounded-lg bg-emerald-700 text-white py-2 font-medium hover:bg-emerald-800"
              >
                日程を見て予約する
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
