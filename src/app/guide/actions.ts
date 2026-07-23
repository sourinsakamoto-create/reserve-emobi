"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { sendMail, getAdminNotificationEmail } from "@/lib/mailer";

/**
 * Persists a guide's availability for a set of slots (typically all slots
 * shown for one date) only when the Save button is pressed — clicking a
 * slot toggle only changes local UI state until then. Notifies the admin
 * (via ADMIN_NOTIFICATION_EMAIL, e.g. a Slack channel address) with what
 * changed on every save.
 */
export async function saveGuideAvailabilityAction(formData: FormData) {
  const session = await getSessionUser();
  if (!session) return;

  const allSlotIds = Array.from(new Set(formData.getAll("allSlotIds").map(String)));
  const checkedSlotIds = new Set(formData.getAll("checkedSlotIds").map(String));
  if (allSlotIds.length === 0) return;

  for (const slotId of allSlotIds) {
    if (checkedSlotIds.has(slotId)) {
      await prisma.guideAvailability.upsert({
        where: { guideId_scheduleSlotId: { guideId: session.userId, scheduleSlotId: slotId } },
        update: {},
        create: { guideId: session.userId, scheduleSlotId: slotId },
      });
    } else {
      await prisma.guideAvailability.deleteMany({
        where: { guideId: session.userId, scheduleSlotId: slotId },
      });
    }
  }

  revalidatePath("/guide");
  revalidatePath("/admin/guides");
  revalidatePath("/admin/schedule");
  revalidatePath("/admin/schedule/list");

  await notifyAvailabilitySaved(session.name, allSlotIds, checkedSlotIds);
}

async function notifyAvailabilitySaved(guideName: string, allSlotIds: string[], checkedSlotIds: Set<string>) {
  const adminEmail = getAdminNotificationEmail();
  if (!adminEmail) return;

  const slots = await prisma.scheduleSlot.findMany({
    where: { id: { in: allSlotIds } },
    include: { activity: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const lines = slots.map(
    (s) => `${checkedSlotIds.has(s.id) ? "○ 担当可能" : "－ 未設定"}: ${s.date} ${s.startTime} ${s.activity.name}`
  );

  await sendMail({
    to: adminEmail,
    subject: `【ガイド出勤可能日 更新】${guideName}`,
    text: `${guideName} さんが出勤可能日を保存しました。\n\n${lines.join("\n")}`,
  });
}
