"use client";

import { useActionState } from "react";
import { createActivityAction, type ActivityActionState } from "@/app/admin/activities/actions";

const initialState: ActivityActionState = { status: "idle" };

export default function ActivityCreateForm() {
  const [state, formAction, pending] = useActionState(createActivityAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2 border border-neutral-200 rounded-lg p-4 bg-white">
      <h3 className="sm:col-span-2 font-semibold">新規アクティビティを追加</h3>

      {state.status === "error" && (
        <p className="sm:col-span-2 text-sm text-red-600">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="sm:col-span-2 text-sm text-emerald-700">追加しました。</p>
      )}

      <label className="text-sm">
        名称
        <input name="name" required className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>
      <label className="text-sm">
        スラッグ(URL用・半角英数-)
        <input name="slug" required pattern="[a-z0-9-]+" className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>
      <label className="text-sm">
        キャッチコピー(名称の下に表示・任意)
        <input name="highlights" placeholder="例: 期間限定・今だけ半額！" className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>
      <label className="text-sm sm:col-span-2">
        画像をアップロード(任意・JPEG/PNG/WebP/GIF、5MBまで)
        <input
          type="file"
          name="imageFile"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full bg-white"
        />
      </label>
      <label className="text-sm sm:col-span-2">
        または画像URLを直接指定(任意・アップロードした場合はそちらが優先されます)
        <input name="imageUrl" placeholder="https://..." className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>
      <label className="text-sm sm:col-span-2">
        説明(コースの見どころなど)
        <textarea name="description" required rows={6} className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>
      <label className="text-sm">
        含まれるもの(1行に1項目・任意)
        <textarea name="included" rows={3} placeholder={"ガイド料\n保険\n駐車料"} className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>
      <label className="text-sm">
        ご利用条件(年齢・免許など・任意)
        <textarea name="requirements" rows={3} placeholder={"参加年齢: 6〜70歳\n運転免許は1名でOK"} className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>
      <label className="text-sm sm:col-span-2">
        注意事項(任意)
        <textarea name="notices" rows={3} placeholder="道路渋滞等により到着が遅れる場合があります" className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>
      <label className="text-sm">
        所要時間(分)
        <input type="number" name="durationMinutes" defaultValue={60} required className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>
      <label className="text-sm">
        デフォルト定員(1枠あたり)
        <input type="number" name="defaultCapacity" defaultValue={4} required className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>
      <label className="text-sm">
        大人料金(円)
        <input type="number" name="pricePerAdult" defaultValue={3000} required className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>
      <label className="text-sm">
        割引前の大人料金(円・任意)
        <input type="number" name="originalPriceAdult" placeholder="例: 6000" className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
      </label>
      <label className="text-sm">
        子供料金(円)
        <input type="number" name="pricePerChild" defaultValue={1500} required className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full" />
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
