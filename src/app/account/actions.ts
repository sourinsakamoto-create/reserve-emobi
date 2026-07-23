"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { verifyPassword, hashPassword } from "@/lib/password";
import { changePasswordFormSchema } from "@/lib/validation";

export type ChangePasswordState = {
  status: "idle" | "error" | "success";
  message?: string;
};

const initial: ChangePasswordState = { status: "idle" };

export async function changeOwnPasswordAction(
  _prev: ChangePasswordState = initial,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await getSessionUser();
  if (!session) {
    return { status: "error", message: "ログインが必要です。" };
  }

  const parsed = changePasswordFormSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" };
  }

  const user = await prisma.staffUser.findUnique({ where: { id: session.userId } });
  if (!user) {
    return { status: "error", message: "アカウントが見つかりません。" };
  }

  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) {
    return { status: "error", message: "現在のパスワードが正しくありません。" };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.staffUser.update({ where: { id: user.id }, data: { passwordHash } });

  return { status: "success", message: "パスワードを変更しました。" };
}
