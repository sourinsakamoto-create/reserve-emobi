import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { slotBookedCount } from "@/lib/booking";
import { updateSlotAction, toggleSlotOpenAction, deleteSlotAction } from "./actions";
import BulkGenerateForm from "@/components/BulkGenerateForm";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

export const dynamic = "force-dynamic";

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ activityId?: string }>;
}) {
  const activities = await prisma.activity.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  const { activityId: activityIdParam } = await searchParams;
  const activityId = activityIdParam || activities[0]?.id;
  const activity = activities.find((a) => a.id === activityId);

  const today = format(new Date(), "yyyy-MM-dd");
  const slots = activity
    ? await prisma.scheduleSlot.findMany({
        where: { activityId: activity.id, date: { gte: today }, deletedAt: null },
        include: { bookings: true },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      })
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">日程・在庫管理</h1>
        <Link href="/admin/schedule/list" className="text-sm text-emerald-700 hover:underline">
          登録済みの日程を一覧で見る →
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {activities.map((a) => (
          <Link
            key={a.id}
            href={`/admin/schedule?activityId=${a.id}`}
            className={`text-sm rounded-full px-3 py-1 border ${
              a.id === activity?.id
                ? "bg-emerald-700 text-white border-emerald-700"
                : "border-neutral-300"
            }`}
          >
            {a.name}
          </Link>
        ))}
      </div>

      {!activity ? (
        <p className="text-sm text-neutral-500">先にアクティビティを作成してください。</p>
      ) : (
        <>
          <BulkGenerateForm activityId={activity.id} />

          <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 text-left">
                <tr>
                  <th className="px-3 py-2">日付</th>
                  <th className="px-3 py-2">時刻</th>
                  <th className="px-3 py-2">定員</th>
                  <th className="px-3 py-2">予約済</th>
                  <th className="px-3 py-2">残り</th>
                  <th className="px-3 py-2">販売状態</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {slots.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-neutral-500">
                      枠がありません。上のフォームから作成してください。
                    </td>
                  </tr>
                )}
                {slots.map((slot) => {
                  const booked = slotBookedCount(slot.bookings);
                  const remaining = slot.capacity - booked;
                  return (
                    <tr key={slot.id} className="border-t border-neutral-100">
                      <td className="px-3 py-2">{slot.date}</td>
                      <td className="px-3 py-2">{slot.startTime}</td>
                      <td className="px-3 py-2">
                        <form action={updateSlotAction} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={slot.id} />
                          <input
                            type="number"
                            name="capacity"
                            defaultValue={slot.capacity}
                            min={booked}
                            className="w-16 border border-neutral-300 rounded px-2 py-1"
                          />
                          <button type="submit" className="text-xs text-emerald-700 hover:underline">
                            保存
                          </button>
                        </form>
                      </td>
                      <td className="px-3 py-2">{booked}</td>
                      <td className="px-3 py-2">{remaining}</td>
                      <td className="px-3 py-2">
                        <form action={toggleSlotOpenAction}>
                          <input type="hidden" name="id" value={slot.id} />
                          <input type="hidden" name="isOpen" value={String(slot.isOpen)} />
                          <button
                            type="submit"
                            className={`text-xs font-medium rounded-full px-2 py-1 ${
                              slot.isOpen
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-neutral-200 text-neutral-600"
                            }`}
                          >
                            {slot.isOpen ? "受付中" : "停止中"}
                          </button>
                        </form>
                      </td>
                      <td className="px-3 py-2">
                        <form action={deleteSlotAction}>
                          <input type="hidden" name="id" value={slot.id} />
                          <ConfirmSubmitButton
                            className="text-xs text-red-600 hover:underline"
                            confirmMessage={
                              booked > 0
                                ? `この枠には現在${booked}名分の予約が入っています。削除するとそれらの予約はキャンセル扱いとなり、お客様(および担当ガイド)にキャンセルのメールが送信されます。よろしいですか？`
                                : undefined
                            }
                          >
                            削除
                          </ConfirmSubmitButton>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
