import { prisma } from "@/lib/prisma";
import { DEFAULT_TEMPLATES, TEMPLATE_VARIABLE_HELP } from "@/lib/emailTemplates";
import EmailTemplatesForm from "@/components/EmailTemplatesForm";

export const dynamic = "force-dynamic";

export default async function AdminEmailTemplatesPage() {
  const settings = await prisma.emailSettings.findUnique({ where: { id: "singleton" } });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">メールテンプレート設定</h1>
      <p className="text-sm text-neutral-600">
        お客様に送信する予約確定・変更・キャンセルメールの件名と本文を編集できます。
      </p>
      <div className="rounded-lg bg-neutral-100 text-neutral-700 text-xs px-4 py-3 leading-relaxed">
        {TEMPLATE_VARIABLE_HELP}
      </div>

      <EmailTemplatesForm
        values={{
          confirmationSubject: settings?.confirmationSubject ?? DEFAULT_TEMPLATES.confirmationSubject,
          confirmationBody: settings?.confirmationBody ?? DEFAULT_TEMPLATES.confirmationBody,
          cancellationSubject: settings?.cancellationSubject ?? DEFAULT_TEMPLATES.cancellationSubject,
          cancellationBody: settings?.cancellationBody ?? DEFAULT_TEMPLATES.cancellationBody,
          changeSubject: settings?.changeSubject ?? DEFAULT_TEMPLATES.changeSubject,
          changeBody: settings?.changeBody ?? DEFAULT_TEMPLATES.changeBody,
        }}
      />
    </div>
  );
}
