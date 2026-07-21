import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { scheduleSlot: { include: { activity: true } } },
  });

  if (!booking) notFound();

  const { scheduleSlot } = booking;
  const { activity } = scheduleSlot;
  const total =
    activity.pricePerAdult * booking.numAdults +
    activity.pricePerChild * booking.numChildren;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 mb-6">
        <h1 className="text-xl font-bold text-emerald-800">
          ご予約ありがとうございます！
        </h1>
        <p className="text-sm text-emerald-700 mt-1">
          ご入力いただいたメールアドレスに確認メールをお送りしました。
        </p>
      </div>

      <dl className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden">
        <Row label="予約番号" value={booking.id} />
        <Row label="アクティビティ" value={activity.name} />
        <Row label="日時" value={`${scheduleSlot.date} ${scheduleSlot.startTime}`} />
        <Row
          label="人数"
          value={`大人${booking.numAdults}名 / 子供${booking.numChildren}名`}
        />
        <Row label="お支払い" value={`${total.toLocaleString()}円(当日現地決済)`} />
        <Row label="お名前" value={booking.customerName} />
        <Row label="電話番号" value={booking.customerPhone} />
        {booking.notes && <Row label="備考" value={booking.notes} />}
      </dl>

      <Link
        href="/"
        className="inline-block mt-8 text-emerald-700 hover:underline text-sm"
      >
        ← アクティビティ一覧に戻る
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex px-5 py-3 text-sm bg-white">
      <dt className="w-32 shrink-0 text-neutral-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
