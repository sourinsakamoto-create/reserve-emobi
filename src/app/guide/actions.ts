"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function toggleGuideAvailabilityAction(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return;

  const date = String(formData.get("date"));
  const wasAvailable = formData.get("isAvailable") === "true";

  if (wasAvailable) {
    await prisma.guideAvailability.deleteMany({ where: { guideId: session.userId, date } });
  } else {
    await prisma.guideAvailability.upsert({
      where: { guideId_date: { guideId: session.userId, date } },
      update: {},
      create: { guideId: session.userId, date },
    });
  }

  revalidatePath("/guide");
  revalidatePath("/admin/guides");
}
