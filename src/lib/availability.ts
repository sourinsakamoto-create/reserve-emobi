import { prisma } from "@/lib/prisma";
import { slotBookedCount } from "@/lib/booking";

export async function getUpcomingSlotsForActivity(activityId: string, fromDate: string) {
  const slots = await prisma.scheduleSlot.findMany({
    where: { activityId, date: { gte: fromDate } },
    include: { bookings: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return slots.map((slot) => {
    const booked = slotBookedCount(slot.bookings);
    return {
      ...slot,
      booked,
      remaining: Math.max(slot.capacity - booked, 0),
    };
  });
}
