"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { staffCreateFormSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/password";
import { getSessionUser } from "@/lib/session";

export type StaffActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

const initial: StaffActionState = { status: "idle" };

export async function createStaffAction(
  _prev: StaffActionState = initial,
  formData: FormData
): Promise<StaffActionState> {
  const parsed = staffCreateFormSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const existing = await prisma.staffUser.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { status: "error", message: "このメールアドレスは既に登録されています。" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.staffUser.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
      passwordHash,
    },
  });

  revalidatePath("/admin/staff");
  return { status: "success" };
}

export async function toggleStaffActiveAction(formData: FormData) {
  const id = String(formData.get("id"));
  const isActive = formData.get("isActive") === "true";

  const session = await getSessionUser();
  if (session?.userId === id && isActive) {
    // Refuse to let an admin lock themselves out.
    return;
  }

  await prisma.staffUser.update({ where: { id }, data: { isActive: !isActive } });
  revalidatePath("/admin/staff");
}

export async function resetStaffPasswordAction(formData: FormData) {
  const id = String(formData.get("id"));
  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword.length < 8) return;

  const passwordHash = await hashPassword(newPassword);
  await prisma.staffUser.update({ where: { id }, data: { passwordHash } });
  revalidatePath("/admin/staff");
}
