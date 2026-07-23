import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MyBookingLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; phone?: string }>;
}) {
  const { email, phone } = await searchParams;
  const submitted = Boolean(email && phone);

  const bookings = submitted
    ? await prisma.booking.findMany({
        where: {
          customerEmail: email!.trim(),
          customerPhone: phone!.trim(),
        },
        include: { scheduleSlot: { include: { activity: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-bold mb-2">予約を確認する</h1>
      <p className="text-sm text-neutral-600 mb-6">
        ご予約時に入力したメールアドレスと電話番号を入力すると、これまでのご予約を確認できます。
      </p>

      <form className="grid gap-4 max-w-md border border-neutral-200 rounded-lg p-4 bg-white mb-8">
        <label className="text-sm">
          メールアドレス
          <input
            type="email"
            name="email"
            required
            defaultValue={email}
            className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
          />
        </label>
        <label className="text-sm">
          電話番号
          <input
            name="phone"
            required
            defaultValue={phone}
            className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
          />
        </label>
        <button
          type="submit"
          className="justify-self-start rounded-lg bg-emerald-700 text-white px-6 py-2 font-medium hover:bg-emerald-800"
        >
          予約を検索する
        </button>
      </form>

      {submitted && (
        <div>
          <h2 className="font-semibold mb-3">検索結果</h2>
          {bookings.length === 0 ? (
            <p className="text-sm text-neutral-500">
              入力されたメールアドレス・電話番号に一致する予約が見つかりませんでした。ご入力内容をご確認ください。
            </p>
          ) : (
            <ul className="space-y-2">
              {bookings.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/booking/${b.id}`}
                    className="flex items-center justify-between border border-neutral-200 rounded-lg px-4 py-3 bg-white hover:bg-neutral-50"
                  >
                    <span>
                      {b.scheduleSlot.activity.name} - {b.scheduleSlot.date} {b.scheduleSlot.startTime}
                    </span>
                    <span
                      className={`text-xs font-medium rounded-full px-2 py-1 ${
                        b.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-200 text-neutral-500"
                      }`}
                    >
                      {b.status === "CONFIRMED" ? "確定" : "キャンセル済"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
