import transporter from "../config/nodemailer.js";

const RESEND_API = "https://api.resend.com/emails";

export function isResendMailEnabled() {
  const flag = String(process.env.MAIL_USE_RESEND || "")
    .trim()
    .toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

/**
 * Mặc định: Nodemailer/SMTP (Gmail) — giống hành vi cũ trước khi thêm Resend.
 * Chỉ gửi qua Resend khi bật rõ: MAIL_USE_RESEND=true VÀ có RESEND_API_KEY.
 * (Tránh trường hợp nhầm thêm RESEND_API_KEY trên Render khiến mọi mail đi API thay vì SMTP.)
 */
export async function sendAppEmail({ to, subject, text, html, from: fromOverride }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (shouldUseResend() && apiKey) {
    const from =
      process.env.RESEND_FROM?.trim() ||
      fromOverride?.trim() ||
      (process.env.SENDER_EMAIL?.trim()
        ? `VietNam Travel <${process.env.SENDER_EMAIL.trim()}>`
        : "VietNam Travel <onboarding@resend.dev>");
    const body = {
      from,
      to: [to].flat(),
      subject,
      ...(text ? { text } : {}),
      ...(html ? { html } : {}),
    };
    const ctrl = AbortSignal.timeout(25_000);
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: ctrl,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail =
        typeof json?.message === "string"
          ? json.message
          : JSON.stringify(json || {}) || `HTTP ${res.status}`;
      throw new Error(`Resend: ${detail}`);
    }
    return;
  }

  if (isResendMailEnabled() && !apiKey) {
    throw new Error("Đặt MAIL_USE_RESEND nhưng thiếu RESEND_API_KEY");
  }

  const fromAddr = fromOverride?.trim() || process.env.SENDER_EMAIL;
  if (!fromAddr) throw new Error("Thiếu SENDER_EMAIL (hoặc thêm RESEND_API_KEY)");

  await transporter.sendMail({
    from: fromAddr,
    to,
    subject,
    ...(text !== undefined ? { text } : {}),
    ...(html !== undefined ? { html } : {}),
  });
}
