import { prisma } from "@/lib/prisma";
import { cancelBookingAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: { scheduleSlot: { include: { activity: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">予約一覧</h1>

      <div className="border border-neutral-200 rounded-lg overflow-x-auto bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left">
            <tr>
              <th className="px-3 py-2">状態</th>
              <th className="px-3 py-2">アクティビティ</th>
              <th className="px-3 py-2">日時</th>
              <th className="px-3 py-2">お客様</th>
              <th className="px-3 py-2">連絡先</th>
              <th className="px-3 py-2">人数</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-neutral-500">
                  予約はまだありません。
                </td>
              </tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-neutral-100">
                <td className="px-3 py-2">
                  <span
                    className={`text-xs font-medium rounded-full px-2 py-1 ${
                      b.status === "CONFIRMED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    {b.status === "CONFIRMED" ? "確定" : "キャンセル済"}
                  </span>
                </td>
                <td className="px-3 py-2">{b.scheduleSlot.activity.name}</td>
                <td className="px-3 py-2">
                  {b.scheduleSlot.date} {b.scheduleSlot.startTime}
                </td>
                <td className="px-3 py-2">{b.customerName}</td>
                <td className="px-3 py-2">
                  <div>{b.customerPhone}</div>
                  <div className="text-neutral-500">{b.customerEmail}</div>
                </td>
                <td className="px-3 py-2">
                  大人{b.numAdults} / 子供{b.numChildren}
                </td>
                <td className="px-3 py-2">
                  {b.status === "CONFIRMED" && (
                    <form action={cancelBookingAction}>
                      <input type="hidden" name="id" value={b.id} />
                      <button type="submit" className="text-xs text-red-600 hover:underline">
                        キャンセル
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
