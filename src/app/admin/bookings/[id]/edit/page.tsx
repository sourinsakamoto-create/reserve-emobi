import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUpcomingSlotsForActivity } from "@/lib/availability";
import AdminBookingEditForm from "@/components/AdminBookingEditForm";

export const dynamic = "force-dynamic";

export default async function AdminBookingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { scheduleSlot: { include: { activity: true } } },
  });

  if (!booking || booking.status !== "CONFIRMED") notFound();

  // Fetch from the earliest possible date so the booking's current slot is
  // always selectable even if it no longer falls within the "upcoming" window.
  const slots = await getUpcomingSlotsForActivity(booking.scheduleSlot.activityId, "0000-00-00");

  return (
    <div>
      <h1 className="text-xl font-bold mb-2">予約を編集</h1>
      <p className="text-sm text-neutral-500 mb-6">
        {booking.scheduleSlot.activity.name} / 予約番号: {booking.id}
      </p>

      <AdminBookingEditForm
        booking={{
          id: booking.id,
          scheduleSlotId: booking.scheduleSlotId,
          customerName: booking.customerName,
          customerKana: booking.customerKana,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          numAdults: booking.numAdults,
          numChildren: booking.numChildren,
          notes: booking.notes,
        }}
        slots={slots}
      />
    </div>
  );
}
