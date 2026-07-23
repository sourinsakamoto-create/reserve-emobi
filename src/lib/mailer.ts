import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null | undefined;

// Returns null (and logs a warning once) when SMTP env vars are not configured,
// so booking creation never fails just because email hasn't been set up yet.
function getTransporter() {
  if (transporter !== undefined) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      "[mailer] SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS が未設定のため、メール送信をスキップします。"
    );
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // Keep these short: booking/cancel/edit requests wait on this, and
    // serverless functions (e.g. Vercel) have their own execution time limit.
    connectionTimeout: 6000,
    greetingTimeout: 6000,
    socketTimeout: 6000,
  });
  return transporter;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
}) {
  const t = getTransporter();
  if (!t) return;

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  try {
    await t.sendMail({ from, to: options.to, subject: options.subject, text: options.text });
  } catch (err) {
    // Booking should still succeed even if the notification email fails to send.
    console.error("[mailer] メール送信に失敗しました:", err);
  }
}

export function getAdminNotificationEmail() {
  return process.env.ADMIN_NOTIFICATION_EMAIL || null;
}
