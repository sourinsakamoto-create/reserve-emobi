import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const today = format(new Date(), "yyyy-MM-dd");

  const [activityCount, openSlotsToday, totalConfirmed, recentBookings] =
    await Promise.all([
      prisma.activity.count({ where: { isOnSale: true } }),
      prisma.scheduleSlot.count({ where: { date: today, isOpen: true } }),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.booking.findMany({
        where: { status: "CONFIRMED" },
        include: { scheduleSlot: { include: { activity: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">管理ダッシュボード</h1>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Stat label="販売中アクティビティ" value={activityCount} />
        <Stat label="本日の受付枠" value={openSlotsToday} />
        <Stat label="累計予約件数" value={totalConfirmed} />
      </div>

      <h2 className="font-semibold mb-3">直近の予約</h2>
      <ul className="divide-y divide-neutral-200 border border-neutral-200 rounded-lg bg-white">
        {recentBookings.length === 0 && (
          <li className="px-4 py-3 text-sm text-neutral-500">まだ予約はありません。</li>
        )}
        {recentBookings.map((b) => (
          <li key={b.id} className="px-4 py-3 text-sm flex justify-between">
            <span>
              {b.scheduleSlot.activity.name} - {b.scheduleSlot.date}{" "}
              {b.scheduleSlot.startTime} / {b.customerName}様
            </span>
            <span className="text-neutral-500">
              大人{b.numAdults} 子供{b.numChildren}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/admin/bookings"
        className="inline-block mt-4 text-emerald-700 text-sm hover:underline"
      >
        予約一覧をすべて見る →
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
