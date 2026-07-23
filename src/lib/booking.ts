import { prisma } from "@/lib/prisma";
import { sendMail, getAdminNotificationEmail } from "@/lib/mailer";
import { DEFAULT_TEMPLATES, renderTemplate, type EmailTemplateVars } from "@/lib/emailTemplates";
import { isGuideAvailabilityRequired } from "@/lib/guideAvailability";
import { getSiteUrl } from "@/lib/site";
import { calcVehiclesNeeded } from "@/lib/vehicles";
import type { BookingFormInput } from "@/lib/validation";

export class BookingError extends Error {}

type BookingWithSlot = {
  id: string;
  scheduleSlotId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  numAdults: number;
  numChildren: number;
  notes: string | null;
  guide: { name: string; email: string } | null;
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

function templateVars(booking: BookingWithSlot): EmailTemplateVars {
  const { scheduleSlot } = booking;
  const { activity } = scheduleSlot;
  const total =
    activity.pricePerAdult * booking.numAdults + activity.pricePerChild * booking.numChildren;

  return {
    customerName: booking.customerName,
    activityName: activity.name,
    date: scheduleSlot.date,
    time: scheduleSlot.startTime,
    numAdults: String(booking.numAdults),
    numChildren: String(booking.numChildren),
    total: `${total.toLocaleString()}円`,
    bookingId: booking.id,
    phone: booking.customerPhone,
    notes: booking.notes ?? "",
    summary: bookingSummary(booking),
    confirmationUrl: `${getSiteUrl()}/booking/${booking.id}`,
  };
}

const bookingInclude = {
  scheduleSlot: { include: { activity: true } },
  guide: true,
} as const;

/**
 * Creates a booking after re-checking remaining capacity inside a transaction,
 * so two customers submitting at the same time can't both book the last seats.
 * If guide availability is required (BookingSettings.requireGuideAvailability),
 * a slot with no guide registered is rejected. Whether or not that's enabled,
 * the booking is auto-assigned to whichever guide registered availability for
 * the slot first (if any).
 */
export async function createBooking(input: BookingFormInput) {
  const requested = input.numAdults + input.numChildren;
  const guideRequired = await isGuideAvailabilityRequired();

  const booking = await prisma.$transaction(async (tx) => {
    const slot = await tx.scheduleSlot.findUnique({
      where: { id: input.scheduleSlotId },
      include: { activity: true, bookings: true },
    });

    if (!slot || slot.deletedAt || slot.activity.deletedAt) {
      throw new BookingError("予約枠が見つかりません。");
    }
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

    const primaryAvailability = await tx.guideAvailability.findFirst({
      where: { scheduleSlotId: input.scheduleSlotId },
      orderBy: { createdAt: "asc" },
    });

    if (guideRequired && !primaryAvailability) {
      throw new BookingError("申し訳ございません、この時間枠は現在担当者が未定のため予約できません。");
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
        guideId: primaryAvailability?.guideId ?? null,
      },
      include: bookingInclude,
    });
  });

  await notifyBooking(booking, "confirmation", "新しい予約が入りました。");

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
    include: bookingInclude,
  });

  await notifyBooking(booking, "cancellation", "予約がキャンセルされました。");

  return booking;
}

/**
 * Cancels every CONFIRMED booking on the given slots and notifies each
 * customer (plus admin/guide) by email, one at a time via cancelBooking().
 * Used when an admin deletes a schedule slot or an entire activity that
 * already has bookings on it, so those customers aren't left in the dark.
 */
export async function cancelBookingsForSlotIds(scheduleSlotIds: string[]) {
  if (scheduleSlotIds.length === 0) return [];

  const toCancel = await prisma.booking.findMany({
    where: { scheduleSlotId: { in: scheduleSlotIds }, status: "CONFIRMED" },
    select: { id: true },
  });

  const cancelled = [];
  for (const { id } of toCancel) {
    cancelled.push(await cancelBooking(id));
  }
  return cancelled;
}

export type BookingUpdateInput = Omit<BookingFormInput, "scheduleSlotId"> & {
  scheduleSlotId: string;
};

/**
 * Admin-side edit of an existing (confirmed) booking's slot/details.
 * Re-checks remaining capacity on the target slot, excluding this
 * booking's own current allocation, inside a transaction. Guide
 * availability is NOT enforced here — admins can move a booking to any
 * open slot regardless of guide coverage. The assigned guide is left
 * as-is; admins can reassign it separately from the bookings list.
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
      include: bookingInclude,
    });
  });

  await notifyBooking(booking, "change", "予約内容が変更されました。");

  return booking;
}

const ADMIN_SUBJECT_PREFIX: Record<EmailKind, string> = {
  confirmation: "【新規予約】",
  cancellation: "【予約キャンセル】",
  change: "【予約変更】",
};

const GUIDE_SUBJECT_PREFIX: Record<EmailKind, string> = {
  confirmation: "【担当予約のお知らせ】",
  cancellation: "【担当予約キャンセルのお知らせ】",
  change: "【担当予約変更のお知らせ】",
};

type EmailKind = "confirmation" | "cancellation" | "change";

/**
 * Builds the "how many vehicles are needed for this departure" note for the
 * admin notification email. One tuk-tuk seats up to 3 guests, and the guide
 * always brings their own separate vehicle when one is assigned.
 */
async function buildVehicleNote(booking: BookingWithSlot) {
  const slot = await prisma.scheduleSlot.findUnique({
    where: { id: booking.scheduleSlotId },
    include: { bookings: true },
  });
  const totalGuests = slot ? slotBookedCount(slot.bookings) : booking.numAdults + booking.numChildren;
  const vehicles = calcVehiclesNeeded(totalGuests, Boolean(booking.guide));

  return [
    "【車両手配の目安】",
    `この便の現在の合計人数: ${totalGuests}名`,
    `お客様用車両: ${vehicles.customerVehicles}台(3名につき1台)`,
    `ガイド用車両: ${vehicles.guideVehicles}台`,
    `必要車両 合計: ${vehicles.total}台`,
  ].join("\n");
}

async function notifyBooking(booking: BookingWithSlot, kind: EmailKind, adminIntro: string) {
  const vars = templateVars(booking);
  const settings = await prisma.emailSettings.findUnique({ where: { id: "singleton" } });

  const subjectKey = `${kind}Subject` as const;
  const bodyKey = `${kind}Body` as const;
  const subjectTemplate = settings?.[subjectKey] || DEFAULT_TEMPLATES[subjectKey];
  const bodyTemplate = settings?.[bodyKey] || DEFAULT_TEMPLATES[bodyKey];

  const customerSubject = renderTemplate(subjectTemplate, vars);
  const customerBody = renderTemplate(bodyTemplate, vars);
  const adminEmail = getAdminNotificationEmail();

  const vehicleNote = await buildVehicleNote(booking);

  // Sent in parallel (rather than awaited one after another) so a slow or
  // unreachable SMTP server can't double the wait on the booking request.
  await Promise.all([
    sendMail({ to: booking.customerEmail, subject: customerSubject, text: customerBody }),
    adminEmail
      ? sendMail({
          to: adminEmail,
          subject: `${ADMIN_SUBJECT_PREFIX[kind]}${vars.activityName} - ${vars.date} ${vars.time}`,
          text: `${adminIntro}\n\n${vars.summary}\nメール: ${booking.customerEmail}\n\n${vehicleNote}`,
        })
      : Promise.resolve(),
    booking.guide
      ? sendMail({
          to: booking.guide.email,
          subject: `${GUIDE_SUBJECT_PREFIX[kind]}${vars.activityName} - ${vars.date} ${vars.time}`,
          text: `${booking.guide.name} 様\n\nご担当の予約について更新がありました。\n\n${vars.summary}\nお客様メール: ${booking.customerEmail}`,
        })
      : Promise.resolve(),
  ]);
}
