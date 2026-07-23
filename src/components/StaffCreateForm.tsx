"use client";

import { useActionState } from "react";
import { createStaffAction, type StaffActionState } from "@/app/admin/staff/actions";

const initialState: StaffActionState = { status: "idle" };

export default function StaffCreateForm() {
  const [state, formAction, pending] = useActionState(createStaffAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2 border border-neutral-200 rounded-lg p-4 bg-white">
      <h3 className="sm:col-span-2 font-semibold">新規スタッフアカウントを追加</h3>

      {state.status === "error" && (
        <p className="sm:col-span-2 text-sm text-red-600">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="sm:col-span-2 text-sm text-emerald-700">追加しました。</p>
      )}

      <label className="text-sm">
        名前
        <input name="name" required className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>
      <label className="text-sm">
        役割
        <select name="role" defaultValue="GUIDE" className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full">
          <option value="ADMIN">管理者(admin)</option>
          <option value="GUIDE">ガイド(guide)</option>
        </select>
      </label>
      <label className="text-sm">
        メールアドレス
        <input type="email" name="email" required className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>
      <label className="text-sm">
        初期パスワード(8文字以上)
        <input type="text" name="password" required minLength={8} className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="sm:col-span-2 justify-self-start rounded-lg bg-emerald-700 text-white px-5 py-2 font-medium hover:bg-emerald-800 disabled:opacity-50"
      >
        {pending ? "追加中..." : "追加する"}
      </button>
    </form>
  );
}
