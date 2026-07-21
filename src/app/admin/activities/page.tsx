import { prisma } from "@/lib/prisma";
import { updateActivityAction, toggleActivitySaleAction } from "./actions";
import ActivityCreateForm from "@/components/ActivityCreateForm";

export const dynamic = "force-dynamic";

export default async function AdminActivitiesPage() {
  const activities = await prisma.activity.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">アクティビティ・販売設定</h1>

      <ul className="space-y-4">
        {activities.map((activity) => (
          <li key={activity.id} className="border border-neutral-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">
                {activity.name}{" "}
                <span className="text-xs text-neutral-400">/{activity.slug}</span>
              </h2>
              <form action={toggleActivitySaleAction}>
                <input type="hidden" name="id" value={activity.id} />
                <input type="hidden" name="isOnSale" value={String(activity.isOnSale)} />
                <button
                  type="submit"
                  className={`text-xs font-medium rounded-full px-3 py-1 ${
                    activity.isOnSale
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {activity.isOnSale ? "販売中(クリックで停止)" : "販売停止中(クリックで再開)"}
                </button>
              </form>
            </div>

            <form
              action={updateActivityAction}
              className="grid gap-3 sm:grid-cols-2"
            >
              <input type="hidden" name="id" value={activity.id} />
              <label className="text-sm">
                名称
                <input
                  name="name"
                  defaultValue={activity.name}
                  className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
                />
              </label>
              <label className="text-sm">
                所要時間(分)
                <input
                  type="number"
                  name="durationMinutes"
                  defaultValue={activity.durationMinutes}
                  className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                説明
                <textarea
                  name="description"
                  defaultValue={activity.description}
                  rows={2}
                  className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
                />
              </label>
              <label className="text-sm">
                大人料金(円)
                <input
                  type="number"
                  name="pricePerAdult"
                  defaultValue={activity.pricePerAdult}
                  className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
                />
              </label>
              <label className="text-sm">
                子供料金(円)
                <input
                  type="number"
                  name="pricePerChild"
                  defaultValue={activity.pricePerChild}
                  className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
                />
              </label>
              <label className="text-sm">
                デフォルト定員(新規枠作成時の初期値)
                <input
                  type="number"
                  name="defaultCapacity"
                  defaultValue={activity.defaultCapacity}
                  className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
                />
              </label>
              <button
                type="submit"
                className="sm:col-span-2 justify-self-start rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100"
              >
                保存
              </button>
            </form>
          </li>
        ))}
      </ul>

      <ActivityCreateForm />
    </div>
  );
}
