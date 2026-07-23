import { prisma } from "@/lib/prisma";
import { sendMail, getAdminNotificationEmail } from "@/lib/mailer";
import type { BookingFormInput } from "@/lib/validation";

export class BookingError extends Error {}

type BookingWithSlot = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  numAdults: number;
  numChildren: number;
  notes: string | null;
  scheduleSlot: {
    date: string;
    startTime: string;
    activity: {
      name: string;
      pricePerAdult: number;
      pricePerChild: number;
    };
  };
};

export function slotBookedCount(
  bookings: { numAdults: number; numChildren: number; status: string }[]
) {
  return bookings
    .filter((b) => b.status === "CONFIRMED")
    .reduce((sum, b) => sum + b.numAdults + b.numChildren, 0);
}

function bookingSummary(booking: BookingWithSlot) {
  const { scheduleSlot } = booking;
  const { activity } = scheduleSlot;
  const total =
    activity.pricePerAdult * booking.numAdults + activity.pricePerChild * booking.numChildren;

  return [
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

  await notifyBooking({
    booking,
    customerSubject: `【ご予約確定】${booking.scheduleSlot.activity.name} - ${booking.scheduleSlot.date} ${booking.scheduleSlot.startTime}`,
    customerIntro: "この度はご予約いただきありがとうございます。以下の内容で予約を承りました。",
    customerOutro:
      "当日は開始時刻の10分前を目安にお越しください。\nお支払いは当日現地にてお願いいたします。",
    adminSubject: `【新規予約】${booking.scheduleSlot.activity.name} - ${booking.scheduleSlot.date} ${booking.scheduleSlot.startTime}`,
    adminIntro: "新しい予約が入りました。",
  });

  return booking;
}

/**
 * Admin-side cancellation. Notifies the customer that their booking was
 * cancelled, and sends a copy to the admin notification address.
 */
export async function cancelBooking(bookingId: string) {
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
    include: { scheduleSlot: { include: { activity: true } } },
  });

  await notifyBooking({
    booking,
    customerSubject: `【予約キャンセルのお知らせ】${booking.scheduleSlot.activity.name} - ${booking.scheduleSlot.date} ${booking.scheduleSlot.startTime}`,
    customerIntro: "以下のご予約はキャンセルされました。ご不明な点があればご連絡ください。",
    adminSubject: `【予約キャンセル】${booking.scheduleSlot.activity.name} - ${booking.scheduleSlot.date} ${booking.scheduleSlot.startTime}`,
    adminIntro: "予約がキャンセルされました。",
  });

  return booking;
}

export type BookingUpdateInput = Omit<BookingFormInput, "scheduleSlotId"> & {
  scheduleSlotId: string;
};

/**
 * Admin-side edit of an existing (confirmed) booking's slot/details.
 * Re-checks remaining capacity on the target slot, excluding this
 * booking's own current allocation, inside a transaction.
 */
export async function updateBooking(bookingId: string, input: BookingUpdateInput) {
  const requested = input.numAdults + input.numChildren;

  const booking = await prisma.$transaction(async (tx) => {
    const existing = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!existing) throw new BookingError("予約が見つかりません。");
    if (existing.status !== "CONFIRMED") {
      throw new BookingError("キャンセル済みの予約は編集できません。");
    }

    const slot = await tx.scheduleSlot.findUnique({
      where: { id: input.scheduleSlotId },
      include: { activity: true, bookings: true },
    });
    if (!slot) throw new BookingError("予約枠が見つかりません。");

    const bookedByOthers = slotBookedCount(
      slot.bookings.filter((b) => b.id !== bookingId)
    );
    const remaining = slot.capacity - bookedByOthers;
    if (requested > remaining) {
      throw new BookingError(`残り${remaining}名分の空きしかありません。`);
    }

    return tx.booking.update({
      where: { id: bookingId },
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

  await notifyBooking({
    booking,
    customerSubject: `【ご予約内容変更のお知らせ】${booking.scheduleSlot.activity.name} - ${booking.scheduleSlot.date} ${booking.scheduleSlot.startTime}`,
    customerIntro: "ご予約内容が変更されました。変更後の内容は以下の通りです。",
    adminSubject: `【予約変更】${booking.scheduleSlot.activity.name} - ${booking.scheduleSlot.date} ${booking.scheduleSlot.startTime}`,
    adminIntro: "予約内容が変更されました。",
  });

  return booking;
}

async function notifyBooking(args: {
  booking: BookingWithSlot;
  customerSubject: string;
  customerIntro: string;
  customerOutro?: string;
  adminSubject: string;
  adminIntro: string;
}) {
  const { booking } = args;
  const summary = bookingSummary(booking);
  const adminEmail = getAdminNotificationEmail();

  // Sent in parallel (rather than awaited one after another) so a slow or
  // unreachable SMTP server can't double the wait on the booking request.
  await Promise.all([
    sendMail({
      to: booking.customerEmail,
      subject: args.customerSubject,
      text: `${booking.customerName} 様\n\n${args.customerIntro}\n\n${summary}${
        args.customerOutro ? `\n\n${args.customerOutro}` : ""
      }`,
    }),
    adminEmail
      ? sendMail({
          to: adminEmail,
          subject: args.adminSubject,
          text: `${args.adminIntro}\n\n${summary}\nメール: ${booking.customerEmail}`,
        })
      : Promise.resolve(),
  ]);
}
