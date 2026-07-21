import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-sm px-4 py-2 mb-6">
        ⚠ この管理画面には現在ログイン認証がありません。本番公開前に必ずBasic認証などを追加してください。
      </div>
      <nav className="flex gap-4 mb-8 text-sm border-b border-neutral-200 pb-3">
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
      </nav>
      {children}
    </div>
  );
}
