"use client";

import { useActionState } from "react";
import { changeOwnPasswordAction, type ChangePasswordState } from "@/app/account/actions";

const initialState: ChangePasswordState = { status: "idle" };

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changeOwnPasswordAction, initialState);

  return (
    <details className="border border-neutral-200 rounded-lg bg-white">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold">
        自分のパスワードを変更する
      </summary>
      <form action={formAction} className="grid gap-3 sm:grid-cols-2 px-4 pb-4">
        {state.status === "error" && (
          <p className="sm:col-span-2 text-sm text-red-600">{state.message}</p>
        )}
        {state.status === "success" && (
          <p className="sm:col-span-2 text-sm text-emerald-700">{state.message}</p>
        )}
        <label className="text-sm">
          現在のパスワード
          <input
            type="password"
            name="currentPassword"
            required
            className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
          />
        </label>
        <label className="text-sm">
          新しいパスワード(8文字以上)
          <input
            type="password"
            name="newPassword"
            required
            minLength={8}
            className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="sm:col-span-2 justify-self-start rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 disabled:opacity-50"
        >
          {pending ? "変更中..." : "変更する"}
        </button>
      </form>
    </details>
  );
}
