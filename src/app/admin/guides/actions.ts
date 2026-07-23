"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function toggleGuideGateAction(formData: FormData) {
  const current = formData.get("current") === "true";

  await prisma.bookingSettings.upsert({
    where: { id: "singleton" },
    update: { requireGuideAvailability: !current },
    create: { id: "singleton", requireGuideAvailability: !current },
  });

  revalidatePath("/admin/guides");
  revalidatePath("/activities", "layout");
  revalidatePath("/");
}
