"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "@/app/login/actions";

const initialState: LoginActionState = { status: "idle" };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4 max-w-sm w-full">
      {state.status === "error" && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {state.message}
        </div>
      )}
      <label className="text-sm block">
        メールアドレス
        <input
          type="email"
          name="email"
          required
          className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
        />
      </label>
      <label className="text-sm block">
        パスワード
        <input
          type="password"
          name="password"
          required
          className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-700 text-white py-2 font-medium hover:bg-emerald-800 disabled:opacity-50"
      >
        {pending ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
