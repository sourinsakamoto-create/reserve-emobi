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

export const activityFormSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "半角英小文字・数字・ハイフンのみ使用できます"),
  description: z.string().trim().min(1).max(2000),
  durationMinutes: z.coerce.number().int().min(1).max(1440),
  pricePerAdult: z.coerce.number().int().min(0).max(10_000_000),
  pricePerChild: z.coerce.number().int().min(0).max(10_000_000),
  defaultCapacity: z.coerce.number().int().min(1).max(500),
});

export const scheduleSlotFormSchema = z.object({
  activityId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付形式が正しくありません"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "時刻形式が正しくありません"),
  capacity: z.coerce.number().int().min(1).max(500),
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
