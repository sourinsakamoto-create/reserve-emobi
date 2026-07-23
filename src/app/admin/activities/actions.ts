"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { activityFormSchema } from "@/lib/validation";
import { uploadActivityImage, UploadError } from "@/lib/upload";
import { cancelBookingsForSlotIds } from "@/lib/booking";

export type ActivityActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

const initial: ActivityActionState = { status: "idle" };

async function resolveImageUrl(formData: FormData): Promise<string | null> {
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    return uploadActivityImage(file);
  }
  return null;
}

export async function createActivityAction(
  _prev: ActivityActionState = initial,
  formData: FormData
): Promise<ActivityActionState> {
  let uploadedImageUrl: string | null;
  try {
    uploadedImageUrl = await resolveImageUrl(formData);
  } catch (err) {
    if (err instanceof UploadError) return { status: "error", message: err.message };
    console.error(err);
    return { status: "error", message: "画像のアップロードに失敗しました。" };
  }

  const parsed = activityFormSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    highlights: formData.get("highlights"),
    description: formData.get("description"),
    imageUrl: uploadedImageUrl ?? formData.get("imageUrl"),
    included: formData.get("included"),
    requirements: formData.get("requirements"),
    notices: formData.get("notices"),
    durationMinutes: formData.get("durationMinutes"),
    pricePerAdult: formData.get("pricePerAdult"),
    originalPriceAdult: formData.get("originalPriceAdult"),
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

  let uploadedImageUrl: string | null;
  try {
    uploadedImageUrl = await resolveImageUrl(formData);
  } catch (err) {
    console.error(err instanceof UploadError ? err.message : err);
    return;
  }

  const parsed = activityFormSchema.partial().safeParse({
    name: formData.get("name") || undefined,
    highlights: formData.get("highlights") || undefined,
    description: formData.get("description") || undefined,
    imageUrl: uploadedImageUrl ?? formData.get("imageUrl") ?? undefined,
    included: formData.get("included") || undefined,
    requirements: formData.get("requirements") || undefined,
    notices: formData.get("notices") || undefined,
    durationMinutes: formData.get("durationMinutes") || undefined,
    pricePerAdult: formData.get("pricePerAdult") || undefined,
    originalPriceAdult: formData.get("originalPriceAdult") || undefined,
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

/**
 * Deletes an activity. Any confirmed bookings on its schedule slots are
 * cancelled first (customers/guides notified by email, same as a normal
 * cancellation). If the activity's slots never had any booking at all, the
 * activity and its slots are hard-deleted. Otherwise the historical booking
 * records would violate the ScheduleSlot->Booking foreign key (bookings are
 * kept for the record even when cancelled), so instead the activity and its
 * slots are soft-deleted (deletedAt set, sales/open flags turned off) which
 * hides them everywhere while preserving booking history.
 */
export async function deleteActivityAction(formData: FormData) {
  const id = String(formData.get("id"));

  const slots = await prisma.scheduleSlot.findMany({
    where: { activityId: id },
    select: { id: true },
  });
  const slotIds = slots.map((s) => s.id);

  await cancelBookingsForSlotIds(slotIds);

  const everHadBooking =
    slotIds.length > 0 &&
    (await prisma.booking.count({ where: { scheduleSlotId: { in: slotIds } } })) > 0;

  if (!everHadBooking) {
    await prisma.activity.delete({ where: { id } });
  } else {
    const now = new Date();
    await prisma.$transaction([
      prisma.scheduleSlot.updateMany({
        where: { activityId: id },
        data: { isOpen: false, deletedAt: now },
      }),
      prisma.activity.update({
        where: { id },
        data: { isOnSale: false, deletedAt: now },
      }),
    ]);
  }

  revalidatePath("/admin/activities");
  revalidatePath("/admin/schedule");
  revalidatePath("/");
}
