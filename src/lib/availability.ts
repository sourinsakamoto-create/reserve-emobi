import { prisma } from "@/lib/prisma";
import { slotBookedCount } from "@/lib/booking";
import { isGuideAvailabilityRequired } from "@/lib/guideAvailability";

export async function getUpcomingSlotsForActivity(activityId: string, fromDate: string) {
  const [slots, guideRequired] = await Promise.all([
    prisma.scheduleSlot.findMany({
      where: { activityId, date: { gte: fromDate } },
      include: { bookings: true, guideAvailabilities: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    isGuideAvailabilityRequired(),
  ]);

  return slots.map((slot) => {
    const booked = slotBookedCount(slot.bookings);
    return {
      ...slot,
      booked,
      remaining: Math.max(slot.capacity - booked, 0),
      hasGuide: slot.guideAvailabilities.length > 0,
      guideRequired,
    };
  });
}
