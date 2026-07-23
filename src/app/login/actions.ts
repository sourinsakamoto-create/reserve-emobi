"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { loginFormSchema } from "@/lib/validation";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth";

export type LoginActionState = {
  status: "idle" | "error";
  message?: string;
};

const initial: LoginActionState = { status: "idle" };

export async function loginAction(
  _prev: LoginActionState = initial,
  formData: FormData
): Promise<LoginActionState> {
  const parsed = loginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: "メールアドレスとパスワードを入力してください。" };
  }

  const user = await prisma.staffUser.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.isActive || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { status: "error", message: "メールアドレスまたはパスワードが正しくありません。" };
  }

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);

  redirect(user.role === "ADMIN" ? "/admin" : "/guide");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
