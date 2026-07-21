import { prisma } from "@/lib/prisma";
import { sendMail, getAdminNotificationEmail } from "@/lib/mailer";
import type { BookingFormInput } from "@/lib/validation";

export class BookingError extends Error {}

export function slotBookedCount(
  bookings: { numAdults: number; numChildren: number; status: string }[]
) {
  return bookings
    .filter((b) => b.status === "CONFIRMED")
    .reduce((sum, b) => sum + b.numAdults + b.numChildren, 0);
}

/**
 * Creates a booking after re-checking remaining capacity inside a transaction,
 * so two customers submitting at the same time can't both book the last seats.
 */
export async function createBooking(input: BookingFormInput) {
  const requested = input.numAdults + input.numChildren;

  const booking = await prisma.$transaction(async (tx) => {
    const slot = await tx.scheduleSlot.findUnique({
      where: { id: input.scheduleSlotId },
      include: { activity: true, bookings: true },
    });

    if (!slot) throw new BookingError("予約枠が見つかりません。");
    if (!slot.activity.isOnSale) {
      throw new BookingError("このアクティビティは現在受付を停止しています。");
    }
    if (!slot.isOpen) {
      throw new BookingError("この時間枠は現在受付を停止しています。");
    }

    const booked = slotBookedCount(slot.bookings);
    const remaining = slot.capacity - booked;
    if (requested > remaining) {
      throw new BookingError(
        `申し訳ございません、残り${remaining}名分の空きしかありません。`
      );
    }

    return tx.booking.create({
      data: {
        scheduleSlotId: input.scheduleSlotId,
        customerName: input.customerName,
        customerKana: input.customerKana || null,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        numAdults: input.numAdults,
        numChildren: input.numChildren,
        notes: input.notes || null,
      },
      include: { scheduleSlot: { include: { activity: true } } },
    });
  });

  await notifyBookingCreated(booking);

  return booking;
}

async function notifyBookingCreated(
  booking: Awaited<ReturnType<typeof createBooking>>
) {
  const { scheduleSlot } = booking;
  const { activity } = scheduleSlot;
  const total =
    activity.pricePerAdult * booking.numAdults +
    activity.pricePerChild * booking.numChildren;

  const summary = [
    `アクティビティ: ${activity.name}`,
    `日時: ${scheduleSlot.date} ${scheduleSlot.startTime}`,
    `人数: 大人${booking.numAdults}名 / 子供${booking.numChildren}名`,
    `合計金額(目安): ${total.toLocaleString()}円 (現地決済)`,
    `お名前: ${booking.customerName}`,
    `電話番号: ${booking.customerPhone}`,
    booking.notes ? `備考: ${booking.notes}` : null,
    `予約番号: ${booking.id}`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendMail({
    to: booking.customerEmail,
    subject: `【ご予約確定】${activity.name} - ${scheduleSlot.date} ${scheduleSlot.startTime}`,
    text: `${booking.customerName} 様\n\nこの度はご予約いただきありがとうございます。以下の内容で予約を承りました。\n\n${summary}\n\n当日は開始時刻の10分前を目安にお越しください。\nお支払いは当日現地にてお願いいたします。`,
  });

  const adminEmail = getAdminNotificationEmail();
  if (adminEmail) {
    await sendMail({
      to: adminEmail,
      subject: `【新規予約】${activity.name} - ${scheduleSlot.date} ${scheduleSlot.startTime}`,
      text: `新しい予約が入りました。\n\n${summary}\nメール: ${booking.customerEmail}`,
    });
  }
}
