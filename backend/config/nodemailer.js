import dns from "node:dns";
import nodemailer from "nodemailer";

/**
 * Nhiều host (Render, v.v.) route IPv6 tới smtp.gmail.com kém → ENETUNREACH :465.
 * Ưu tiên IPv4 trước khi mở socket SMTP.
 */
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = Number.parseInt(String(process.env.SMTP_PORT || "465"), 10) || 465;

let secure;
if (process.env.SMTP_SECURE === "true") secure = true;
else if (process.env.SMTP_SECURE === "false") secure = false;
else secure = port === 465;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.SENDER_PASSWORD,
  },
  connectionTimeout: 20_000,
  socketTimeout: 25_000,
  ...(secure
    ? {}
    : {
        requireTLS: true,
        tls: { rejectUnauthorized: true },
      }),
});

export default transporter;

/** Thông báo ngắn cho API khi gửi mail thất bại (SMTP bị host chặn, IPv6, v.v.). */
export function explainMailTransportError(error) {
  const code = error?.code ? String(error.code) : "";
  const msg = String(error?.message || "");
  const combined = `${code} ${msg}`.toUpperCase();

  if (code === "ENETUNREACH" || combined.includes("ENETUNREACH")) {
    return (
      "SMTP bị chặn từ hosting (ENETUNREACH). Render thường không cho SMTP: thêm RESEND_API_KEY trên backend " +
      '(Resend → API Keys) và RESEND_FROM="VietNam Travel <onboarding@resend.dev>", rồi redeploy.'
    );
  }
  if (code === "ETIMEDOUT" || combined.includes("TIMEOUT")) {
    return "Hết thời gian kết nối SMTP. Kiểm tra mạng, App Password Gmail, và biến SMTP_HOST/SMTP_PORT.";
  }
  return msg || "Không gửi được email.";
}

