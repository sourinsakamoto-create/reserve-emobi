"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { activityFormSchema } from "@/lib/validation";

export type ActivityActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

const initial: ActivityActionState = { status: "idle" };

export async function createActivityAction(
  _prev: ActivityActionState = initial,
  formData: FormData
): Promise<ActivityActionState> {
  const parsed = activityFormSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    durationMinutes: formData.get("durationMinutes"),
    pricePerAdult: formData.get("pricePerAdult"),
    pricePerChild: formData.get("pricePerChild"),
    defaultCapacity: formData.get("defaultCapacity"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const existing = await prisma.activity.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return { status: "error", message: "同じスラッグのアクティビティが既に存在します。" };
  }

  await prisma.activity.create({ data: parsed.data });
  revalidatePath("/admin/activities");
  revalidatePath("/");
  return { status: "success" };
}

export async function updateActivityAction(formData: FormData) {
  const id = String(formData.get("id"));
  const parsed = activityFormSchema.partial().safeParse({
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    durationMinutes: formData.get("durationMinutes") || undefined,
    pricePerAdult: formData.get("pricePerAdult") || undefined,
    pricePerChild: formData.get("pricePerChild") || undefined,
    defaultCapacity: formData.get("defaultCapacity") || undefined,
  });

  if (!parsed.success) return;

  await prisma.activity.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/activities");
  revalidatePath("/");
}

export async function toggleActivitySaleAction(formData: FormData) {
  const id = String(formData.get("id"));
  const isOnSale = formData.get("isOnSale") === "true";
  await prisma.activity.update({ where: { id }, data: { isOnSale: !isOnSale } });
  revalidatePath("/admin/activities");
  revalidatePath("/");
}
