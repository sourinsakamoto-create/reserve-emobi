"use client";

import { useActionState } from "react";
import {
  updateEmailTemplatesAction,
  type EmailTemplatesActionState,
} from "@/app/admin/email-templates/actions";

const initialState: EmailTemplatesActionState = { status: "idle" };

type Values = {
  confirmationSubject: string;
  confirmationBody: string;
  cancellationSubject: string;
  cancellationBody: string;
  changeSubject: string;
  changeBody: string;
};

export default function EmailTemplatesForm({ values }: { values: Values }) {
  const [state, formAction, pending] = useActionState(updateEmailTemplatesAction, initialState);

  return (
    <form action={formAction} className="space-y-8">
      {state.status === "success" && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">
          保存しました。
        </div>
      )}

      <TemplateSection
        title="予約確定メール(新規予約時)"
        subjectName="confirmationSubject"
        bodyName="confirmationBody"
        subjectDefault={values.confirmationSubject}
        bodyDefault={values.confirmationBody}
      />
      <TemplateSection
        title="予約変更メール"
        subjectName="changeSubject"
        bodyName="changeBody"
        subjectDefault={values.changeSubject}
        bodyDefault={values.changeBody}
      />
      <TemplateSection
        title="予約キャンセルメール"
        subjectName="cancellationSubject"
        bodyName="cancellationBody"
        subjectDefault={values.cancellationSubject}
        bodyDefault={values.cancellationBody}
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-700 text-white px-6 py-2 font-medium hover:bg-emerald-800 disabled:opacity-50"
      >
        {pending ? "保存中..." : "すべて保存する"}
      </button>
    </form>
  );
}

function TemplateSection({
  title,
  subjectName,
  bodyName,
  subjectDefault,
  bodyDefault,
}: {
  title: string;
  subjectName: string;
  bodyName: string;
  subjectDefault: string;
  bodyDefault: string;
}) {
  return (
    <div className="border border-neutral-200 rounded-lg p-4 bg-white space-y-3">
      <h3 className="font-semibold">{title}</h3>
      <label className="text-sm block">
        件名
        <input
          name={subjectName}
          defaultValue={subjectDefault}
          className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full"
        />
      </label>
      <label className="text-sm block">
        本文
        <textarea
          name={bodyName}
          defaultValue={bodyDefault}
          rows={8}
          className="mt-1 border border-neutral-300 rounded-lg px-3 py-2 w-full font-mono text-sm"
        />
      </label>
    </div>
  );
}
