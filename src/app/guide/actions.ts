"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function toggleGuideAvailabilityAction(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return;

  const scheduleSlotId = String(formData.get("scheduleSlotId"));
  const wasAvailable = formData.get("isAvailable") === "true";

  if (wasAvailable) {
    await prisma.guideAvailability.deleteMany({
      where: { guideId: session.userId, scheduleSlotId },
    });
  } else {
    await prisma.guideAvailability.upsert({
      where: { guideId_scheduleSlotId: { guideId: session.userId, scheduleSlotId } },
      update: {},
      create: { guideId: session.userId, scheduleSlotId },
    });
  }

  revalidatePath("/guide");
  revalidatePath("/admin/guides");
}
