"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type EmailTemplatesActionState = {
  status: "idle" | "success";
};

export async function updateEmailTemplatesAction(
  _prev: EmailTemplatesActionState,
  formData: FormData
): Promise<EmailTemplatesActionState> {
  const data = {
    confirmationSubject: String(formData.get("confirmationSubject") ?? "").trim() || null,
    confirmationBody: String(formData.get("confirmationBody") ?? "").trim() || null,
    cancellationSubject: String(formData.get("cancellationSubject") ?? "").trim() || null,
    cancellationBody: String(formData.get("cancellationBody") ?? "").trim() || null,
    changeSubject: String(formData.get("changeSubject") ?? "").trim() || null,
    changeBody: String(formData.get("changeBody") ?? "").trim() || null,
  };

  await prisma.emailSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  revalidatePath("/admin/email-templates");
  return { status: "success" };
}
