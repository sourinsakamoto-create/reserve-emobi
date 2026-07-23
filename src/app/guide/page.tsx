import { getSessionUser } from "@/lib/session";
import { logoutAction } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function GuidePage() {
  const session = await getSessionUser();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-xl font-bold mb-2">ガイド用ページ</h1>
      <p className="text-neutral-600 mb-6">
        {session?.name} 様、ようこそ。ガイド向けの出勤可能日設定などの機能は準備中です。
      </p>
      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100"
        >
          ログアウト
        </button>
      </form>
    </div>
  );
}
