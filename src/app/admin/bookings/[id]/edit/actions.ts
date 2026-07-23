"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { bookingFormSchema } from "@/lib/validation";
import { updateBooking, BookingError } from "@/lib/booking";

export type BookingEditActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

const initial: BookingEditActionState = { status: "idle" };

export async function updateBookingAction(
  _prev: BookingEditActionState = initial,
  formData: FormData
): Promise<BookingEditActionState> {
  const bookingId = String(formData.get("bookingId") ?? "");

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
    return { status: "error", fieldErrors };
  }

  try {
    await updateBooking(bookingId, parsed.data);
  } catch (err) {
    if (err instanceof BookingError) {
      return { status: "error", message: err.message };
    }
    console.error(err);
    return { status: "error", message: "更新中にエラーが発生しました。" };
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  redirect("/admin/bookings");
}
