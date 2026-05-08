import transporter from "../config/nodemailer.js";

const RESEND_API = "https://api.resend.com/emails";

/**
 * Gửi email: ưu tiên Resend (HTTPS, phù hợp Render chặn SMTP), không có API key thì dùng Nodemailer/SMTP.
 *
 * Env Resend:
 * - RESEND_API_KEY=bearer token
 * - RESEND_FROM (khuyến nghị): cố định "Tên hiển thị &lt;email@domain-da-xac-minh&gt;"
 * - Test nhanh: dùng "VietNam Travel &lt;onboarding@resend.dev&gt;" (đọc giới hạn Resend trong dashboard)
 */
export async function sendAppEmail({ to, subject, text, html, from: fromOverride }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (apiKey) {
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
