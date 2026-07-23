"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { cancelBooking } from "@/lib/booking";

export async function cancelBookingAction(formData: FormData) {
  const id = String(formData.get("id"));
  await cancelBooking(id);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
}

export async function assignGuideAction(formData: FormData) {
  const id = String(formData.get("id"));
  const guideId = String(formData.get("guideId") || "");
  await prisma.booking.update({ where: { id }, data: { guideId: guideId || null } });
  revalidatePath("/admin/bookings");
}
