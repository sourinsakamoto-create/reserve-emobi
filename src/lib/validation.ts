import { z } from "zod";

export const bookingFormSchema = z.object({
  scheduleSlotId: z.string().min(1, "予約枠を選択してください"),
  customerName: z.string().trim().min(1, "お名前を入力してください").max(100),
  customerKana: z.string().trim().max(100).optional().or(z.literal("")),
  customerEmail: z.string().trim().email("メールアドレスの形式が正しくありません"),
  customerPhone: z
    .string()
    .trim()
    .min(1, "電話番号を入力してください")
    .max(20)
    .regex(/^[0-9()\-+ ]+$/, "電話番号の形式が正しくありません"),
  numAdults: z.coerce.number().int().min(1, "大人1名以上で入力してください").max(50),
  numChildren: z.coerce.number().int().min(0).max(50),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type BookingFormInput = z.infer<typeof bookingFormSchema>;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined));

export const activityFormSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "半角英小文字・数字・ハイフンのみ使用できます"),
  highlights: optionalText(200),
  description: z.string().trim().min(1).max(4000),
  imageUrl: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^https?:\/\//.test(v), "画像URLはhttp(s)://で始まる必要があります"),
  included: optionalText(1000),
  requirements: optionalText(1000),
  notices: optionalText(1000),
  durationMinutes: z.coerce.number().int().min(1).max(1440),
  pricePerAdult: z.coerce.number().int().min(0).max(10_000_000),
  originalPriceAdult: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().int().min(0).max(10_000_000).optional()
  ),
  pricePerChild: z.coerce.number().int().min(0).max(10_000_000),
  defaultCapacity: z.coerce.number().int().min(1).max(500),
});

export const scheduleSlotFormSchema = z.object({
  activityId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付形式が正しくありません"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "時刻形式が正しくありません"),
  capacity: z.coerce.number().int().min(1).max(500),
});

export const loginFormSchema = z.object({
  email: z.string().trim().email("メールアドレスの形式が正しくありません"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export const staffCreateFormSchema = z.object({
  email: z.string().trim().email("メールアドレスの形式が正しくありません"),
  name: z.string().trim().min(1, "名前を入力してください").max(100),
  password: z.string().min(8, "パスワードは8文字以上で入力してください").max(200),
  role: z.enum(["ADMIN", "GUIDE"]),
});

export const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
  newPassword: z.string().min(8, "新しいパスワードは8文字以上で入力してください").max(200),
});

export const bulkGenerateSlotsSchema = z.object({
  activityId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.coerce.number().int().min(1).max(180),
  times: z
    .string()
    .trim()
    .min(1)
    .transform((v) =>
      v
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    ),
  capacity: z.coerce.number().int().min(1).max(500),
});
