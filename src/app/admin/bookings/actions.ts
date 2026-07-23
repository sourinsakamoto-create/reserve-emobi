"use server";

import { revalidatePath } from "next/cache";
import { cancelBooking } from "@/lib/booking";

export async function cancelBookingAction(formData: FormData) {
  const id = String(formData.get("id"));
  await cancelBooking(id);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
}
