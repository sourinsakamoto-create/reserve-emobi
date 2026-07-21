"use client";

import { useActionState } from "react";
import { format } from "date-fns";
import { bulkGenerateSlotsAction, type BulkGenerateState } from "@/app/admin/schedule/actions";

const initialState: BulkGenerateState = { status: "idle" };

export default function BulkGenerateForm({ activityId }: { activityId: string }) {
  const [state, formAction, pending] = useActionState(bulkGenerateSlotsAction, initialState);
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2 border border-neutral-200 rounded-lg p-4 bg-white">
      <input type="hidden" name="activityId" value={activityId} />
      <h3 className="sm:col-span-2 font-semibold">日程・在庫をまとめて作成</h3>

      {state.status === "error" && (
        <p className="sm:col-span-2 text-sm text-red-600">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="sm:col-span-2 text-sm text-emerald-700">作成しました。</p>
      )}

      <label className="text-sm">
        開始日
        <input type="date" name="startDate" defaultValue={today} required className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>
      <label className="text-sm">
        日数
        <input type="number" name="days" defaultValue={30} min={1} required className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>
      <label className="text-sm sm:col-span-2">
        時間帯(カンマ区切り、例: 10:00,13:00,15:30)
        <input name="times" defaultValue="10:00,13:00,15:30" required className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>
      <label className="text-sm">
        各枠の定員
        <input type="number" name="capacity" defaultValue={4} min={1} required className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="sm:col-span-2 justify-self-start rounded-lg bg-emerald-700 text-white px-5 py-2 font-medium hover:bg-emerald-800 disabled:opacity-50"
      >
        {pending ? "作成中..." : "作成する"}
      </button>
      <p className="sm:col-span-2 text-xs text-neutral-500">
        既に同じ日付・時間の枠がある場合はスキップされます(重複作成の心配はありません)。
      </p>
    </form>
  );
}
