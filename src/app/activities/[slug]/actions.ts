"use server";

import { redirect } from "next/navigation";
import { bookingFormSchema } from "@/lib/validation";
import { createBooking, BookingError } from "@/lib/booking";

export type BookingActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

export async function createBookingAction(
  _prevState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const raw = {
    scheduleSlotId: String(formData.get("scheduleSlotId") ?? ""),
    customerName: String(formData.get("customerName") ?? ""),
    customerKana: String(formData.get("customerKana") ?? ""),
    customerEmail: String(formData.get("customerEmail") ?? ""),
    customerPhone: String(formData.get("customerPhone") ?? ""),
    numAdults: String(formData.get("numAdults") ?? "1"),
    numChildren: String(formData.get("numChildren") ?? "0"),
    notes: String(formData.get("notes") ?? ""),
  };

  const parsed = bookingFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", fieldErrors, values: raw };
  }

  let bookingId: string;
  try {
    const booking = await createBooking(parsed.data);
    bookingId = booking.id;
  } catch (err) {
    if (err instanceof BookingError) {
      return { status: "error", message: err.message, values: raw };
    }
    console.error(err);
    return {
      status: "error",
      message: "予約の処理中にエラーが発生しました。時間をおいて再度お試しください。",
      values: raw,
    };
  }

  redirect(`/booking/${bookingId}`);
}
