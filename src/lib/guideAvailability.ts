import { prisma } from "@/lib/prisma";

/**
 * Returns whether customer bookings should be restricted to departures that
 * have at least one guide registered. Defaults to false (unrestricted) if
 * the settings row doesn't exist yet.
 */
export async function isGuideAvailabilityRequired(): Promise<boolean> {
  const settings = await prisma.bookingSettings.findUnique({ where: { id: "singleton" } });
  return settings?.requireGuideAvailability ?? false;
}

/**
 * The guide considered "in charge" of a departure: whoever registered their
 * availability for that slot first. Returns null if no guide has claimed it.
 */
export async function getPrimaryGuideForSlot(scheduleSlotId: string) {
  const earliest = await prisma.guideAvailability.findFirst({
    where: { scheduleSlotId },
    orderBy: { createdAt: "asc" },
    include: { guide: true },
  });
  return earliest?.guide ?? null;
}
