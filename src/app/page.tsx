import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const activities = await prisma.activity.findMany({
    where: { isOnSale: true, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">トゥクトゥクアクティビティ一覧</h1>
      <p className="text-neutral-600 mb-8">
        ご希望のコースを選んで、日時・人数をご入力のうえご予約ください。
      </p>

      {activities.length === 0 ? (
        <p className="text-neutral-500">現在ご予約いただけるアクティビティはありません。</p>
      ) : (
        <ul className="space-y-6">
          {activities.map((activity) => {
            const hasDiscount =
              activity.originalPriceAdult != null &&
              activity.originalPriceAdult > activity.pricePerAdult;
            return (
              <li
                key={activity.id}
                className="border border-neutral-200 rounded-xl bg-white shadow-sm overflow-hidden"
              >
                <div className="flex flex-col flex-1 p-6">
                  <h2 className="text-xl font-semibold">{activity.name}</h2>
                  {activity.highlights && (
                    <p className="text-sm text-emerald-700 font-medium mt-1">
                      {activity.highlights}
                    </p>
                  )}
                  <p className="text-sm text-neutral-600 mt-3 flex-1 whitespace-pre-line line-clamp-4">
                    {activity.description}
                  </p>
                  <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                    <dl className="text-sm text-neutral-700 space-y-1">
                      <div className="flex gap-2">
                        <dt className="text-neutral-500">所要時間:</dt>
                        <dd>{activity.durationMinutes}分</dd>
                      </div>
                      <div className="flex gap-2 items-baseline">
                        <dt className="text-neutral-500">料金:</dt>
                        <dd>
                          {hasDiscount && (
                            <span className="line-through text-neutral-400 mr-2">
                              {activity.originalPriceAdult!.toLocaleString()}円
                            </span>
                          )}
                          <span className={hasDiscount ? "text-red-600 font-semibold" : ""}>
                            大人 {activity.pricePerAdult.toLocaleString()}円
                          </span>{" "}
                          / 子供 {activity.pricePerChild.toLocaleString()}円
                        </dd>
                      </div>
                    </dl>
                    <Link
                      href={`/activities/${activity.slug}`}
                      className="inline-block text-center rounded-lg bg-emerald-700 text-white px-6 py-2 font-medium hover:bg-emerald-800"
                    >
                      日程を見て予約する
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
