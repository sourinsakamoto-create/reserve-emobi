import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { logoutAction } from "@/app/login/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <nav className="flex gap-4 text-sm">
          <Link href="/admin" className="font-medium hover:underline">
            ダッシュボード
          </Link>
          <Link href="/admin/activities" className="font-medium hover:underline">
            アクティビティ・販売設定
          </Link>
          <Link href="/admin/schedule" className="font-medium hover:underline">
            日程・在庫管理
          </Link>
          <Link href="/admin/bookings" className="font-medium hover:underline">
            予約一覧
          </Link>
          <Link href="/admin/staff" className="font-medium hover:underline">
            スタッフ管理
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm text-neutral-600">
          <span>{session?.name} 様</span>
          <form action={logoutAction}>
            <button type="submit" className="text-neutral-500 hover:underline">
              ログアウト
            </button>
          </form>
        </div>
      </div>
      <hr className="border-neutral-200 mb-8" />
      {children}
    </div>
  );
}
