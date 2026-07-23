import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { toggleStaffActiveAction, resetStaffPasswordAction } from "./actions";
import StaffCreateForm from "@/components/StaffCreateForm";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const [staff, session] = await Promise.all([
    prisma.staffUser.findMany({ orderBy: { createdAt: "asc" } }),
    getSessionUser(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">スタッフ管理</h1>

      <ChangePasswordForm />

      <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left">
            <tr>
              <th className="px-3 py-2">名前</th>
              <th className="px-3 py-2">メールアドレス</th>
              <th className="px-3 py-2">役割</th>
              <th className="px-3 py-2">状態</th>
              <th className="px-3 py-2">パスワード再設定</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-t border-neutral-100">
                <td className="px-3 py-2">
                  {s.name} {s.id === session?.userId && <span className="text-xs text-neutral-400">(自分)</span>}
                </td>
                <td className="px-3 py-2">{s.email}</td>
                <td className="px-3 py-2">{s.role === "ADMIN" ? "管理者" : "ガイド"}</td>
                <td className="px-3 py-2">
                  <span
                    className={`text-xs font-medium rounded-full px-2 py-1 ${
                      s.isActive ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {s.isActive ? "有効" : "無効"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <form action={resetStaffPasswordAction} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={s.id} />
                    <input
                      type="text"
                      name="newPassword"
                      placeholder="新パスワード(8文字以上)"
                      minLength={8}
                      className="w-40 border border-neutral-300 rounded px-2 py-1 text-xs"
                    />
                    <button type="submit" className="text-xs text-emerald-700 hover:underline">
                      変更
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2">
                  {s.id !== session?.userId && (
                    <form action={toggleStaffActiveAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="isActive" value={String(s.isActive)} />
                      <button type="submit" className="text-xs text-red-600 hover:underline">
                        {s.isActive ? "無効化" : "有効化"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <StaffCreateForm />
    </div>
  );
}
