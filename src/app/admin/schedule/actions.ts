"use server";

import { revalidatePath } from "next/cache";
import { addDays, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { bulkGenerateSlotsSchema } from "@/lib/validation";

export type BulkGenerateState = {
  status: "idle" | "error" | "success";
  message?: string;
};

const initial: BulkGenerateState = { status: "idle" };

export async function bulkGenerateSlotsAction(
  _prev: BulkGenerateState = initial,
  formData: FormData
): Promise<BulkGenerateState> {
  const parsed = bulkGenerateSlotsSchema.safeParse({
    activityId: formData.get("activityId"),
    startDate: formData.get("startDate"),
    days: formData.get("days"),
    times: formData.get("times"),
    capacity: formData.get("capacity"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const { activityId, startDate, days, times, capacity } = parsed.data;
  const start = new Date(`${startDate}T00:00:00`);

  for (let i = 0; i < days; i++) {
    const date = format(addDays(start, i), "yyyy-MM-dd");
    for (const startTime of times) {
      await prisma.scheduleSlot.upsert({
        where: { activityId_date_startTime: { activityId, date, startTime } },
        update: {},
        create: { activityId, date, startTime, capacity, isOpen: true },
      });
    }
  }

  revalidatePath("/admin/schedule");
  return { status: "success" };
}

export async function updateSlotAction(formData: FormData) {
  const id = String(formData.get("id"));
  const capacity = Number(formData.get("capacity"));
  if (!Number.isFinite(capacity) || capacity < 1) return;
  await prisma.scheduleSlot.update({ where: { id }, data: { capacity } });
  revalidatePath("/admin/schedule");
}

export async function toggleSlotOpenAction(formData: FormData) {
  const id = String(formData.get("id"));
  const isOpen = formData.get("isOpen") === "true";
  await prisma.scheduleSlot.update({ where: { id }, data: { isOpen: !isOpen } });
  revalidatePath("/admin/schedule");
}

export async function deleteSlotAction(formData: FormData) {
  const id = String(formData.get("id"));
  const bookingCount = await prisma.booking.count({
    where: { scheduleSlotId: id, status: "CONFIRMED" },
  });
  if (bookingCount > 0) return; // Guard: don't delete slots that already have bookings.
  await prisma.scheduleSlot.delete({ where: { id } });
  revalidatePath("/admin/schedule");
}
