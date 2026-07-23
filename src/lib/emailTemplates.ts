export type EmailTemplateVars = {
  customerName: string;
  activityName: string;
  date: string;
  time: string;
  numAdults: string;
  numChildren: string;
  total: string;
  bookingId: string;
  phone: string;
  notes: string;
  summary: string;
  confirmationUrl: string;
};

export const TEMPLATE_VARIABLE_HELP =
  "使える変数: {{customerName}} お名前 / {{activityName}} アクティビティ名 / {{date}} 日付 / {{time}} 時刻 / " +
  "{{numAdults}} 大人人数 / {{numChildren}} 子供人数 / {{total}} 合計金額 / {{bookingId}} 予約番号 / " +
  "{{phone}} 電話番号 / {{notes}} 備考 / {{summary}} 予約内容まとめ(上記をまとめて表示) / " +
  "{{confirmationUrl}} 予約内容確認ページのURL(画面を閉じた後も見返せます)";

export const DEFAULT_TEMPLATES = {
  confirmationSubject: "【ご予約確定】{{activityName}} - {{date}} {{time}}",
  confirmationBody:
    "{{customerName}} 様\n\nこの度はご予約いただきありがとうございます。以下の内容で予約を承りました。\n\n{{summary}}\n\n当日は開始時刻の10分前を目安にお越しください。\nお支払いは当日現地にてお願いいたします。\n\n予約内容の確認はこちら:\n{{confirmationUrl}}",
  cancellationSubject: "【予約キャンセルのお知らせ】{{activityName}} - {{date}} {{time}}",
  cancellationBody:
    "{{customerName}} 様\n\n以下のご予約はキャンセルされました。ご不明な点があればご連絡ください。\n\n{{summary}}",
  changeSubject: "【ご予約内容変更のお知らせ】{{activityName}} - {{date}} {{time}}",
  changeBody:
    "{{customerName}} 様\n\nご予約内容が変更されました。変更後の内容は以下の通りです。\n\n{{summary}}\n\n予約内容の確認はこちら:\n{{confirmationUrl}}",
} as const;

export function renderTemplate(template: string, vars: EmailTemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return key in vars ? vars[key as keyof EmailTemplateVars] : match;
  });
}
