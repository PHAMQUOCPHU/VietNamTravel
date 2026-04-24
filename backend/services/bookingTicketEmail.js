import transporter from "../config/nodemailer.js";
import { getBookingShortCodeHash } from "../utils/bookingShortCode.js";

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const formatVnd = (n) =>
  `${Number(n || 0).toLocaleString("vi-VN")} VNĐ`;

function departureDateStr(booking) {
  const d = booking?.bookAt ? new Date(booking.bookAt) : null;
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function buildTicketHtml(booking) {
  const code = getBookingShortCodeHash(booking);
  const tour =
    escapeHtml(booking?.tourTitle || booking?.tourId?.title || "Tour");
  const city =
    booking?.tourId && typeof booking.tourId === "object" && booking.tourId.city
      ? escapeHtml(String(booking.tourId.city).trim())
      : "";
  const placeLine = city ? `<p><strong>Điểm đến:</strong> ${city}</p>` : "";
  const duration =
    booking?.tourId && typeof booking.tourId === "object" && booking.tourId.duration
      ? Number(booking.tourId.duration)
      : null;
  const durationLine =
    duration && Number.isFinite(duration) && duration > 0
      ? `<p><strong>Thời lượng:</strong> ${duration} ngày</p>`
      : "";

  const adults = Number(booking?.guestSize?.adult) || 1;
  const children = Number(booking?.guestSize?.children) || 0;
  const guestLine = `${adults} người lớn${children > 0 ? `, ${children} trẻ em` : ""}`;

  const baseUrl = (process.env.FRONTEND_URL || "http://localhost:5174").replace(
    /\/$/,
    "",
  );
  const myBookingUrl = `${baseUrl}/my-booking`;

  return `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8" /></head>
<body style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f7fb;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(15,23,42,.08);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9,#0369a1);padding:24px 28px;color:#fff;">
              <p style="margin:0;font-size:13px;opacity:.9;">VietNam Travel</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:800;">Vé điện tử / xác nhận thanh toán</h1>
              <p style="margin:12px 0 0;font-size:18px;font-weight:700;letter-spacing:.04em;">${escapeHtml(code)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;">
              <p style="margin:0 0 16px;line-height:1.6;">Xin chào <strong>${escapeHtml(booking.name)}</strong>,</p>
              <p style="margin:0 0 20px;line-height:1.6;">Cảm ơn bạn đã thanh toán. Dưới đây là thông tin đặt tour — vui lòng xuất trình <strong>mã đơn</strong> khi làm thủ tục.</p>
              <table role="presentation" width="100%" style="border:1px solid #e2e8f0;border-radius:12px;border-collapse:separate;border-spacing:0;overflow:hidden;">
                <tr><td style="padding:14px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;"><strong>Tour</strong></td></tr>
                <tr><td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;">${tour}</td></tr>
                <tr><td style="padding:14px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;"><strong>Ngày khởi hành</strong></td></tr>
                <tr><td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;">${escapeHtml(departureDateStr(booking))}</td></tr>
                <tr><td style="padding:14px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;"><strong>Số khách</strong></td></tr>
                <tr><td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;">${escapeHtml(guestLine)}</td></tr>
                <tr><td style="padding:14px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;"><strong>Tổng thanh toán</strong></td></tr>
                <tr><td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;color:#059669;font-weight:800;">${escapeHtml(formatVnd(booking.totalPrice))}</td></tr>
                <tr><td style="padding:14px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;"><strong>Hình thức</strong></td></tr>
                <tr><td style="padding:14px 16px;">Đã thanh toán online (VNPay)</td></tr>
              </table>
              ${placeLine ? `<div style="margin-top:18px;line-height:1.6;">${placeLine}</div>` : ""}
              ${durationLine ? `<div style="margin-top:8px;line-height:1.6;">${durationLine}</div>` : ""}
              <p style="margin:20px 0 0;line-height:1.6;"><strong>Liên hệ đặt chỗ:</strong><br/>Điện thoại: ${escapeHtml(booking.phone || "—")}<br/>Email: ${escapeHtml(booking.email || "")}</p>
              <p style="margin:24px 0 0;">
                <a href="${escapeHtml(myBookingUrl)}" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;">Xem đơn trên website</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;font-size:12px;color:#64748b;line-height:1.5;">
              Email được gửi tự động sau khi giao dịch thành công. Nếu cần hỗ trợ, hãy trả lời email này hoặc liên hệ qua website.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

function buildTicketText(booking) {
  const code = getBookingShortCodeHash(booking);
  const lines = [
    "VietNam Travel — Vé điện tử",
    `Mã đơn: ${code}`,
    "",
    `Xin chào ${booking.name},`,
    "Cảm ơn bạn đã thanh toán. Thông tin đặt tour:",
    `- Tour: ${booking.tourTitle || booking?.tourId?.title || ""}`,
    `- Ngày khởi hành: ${departureDateStr(booking)}`,
    `- Khách: ${Number(booking?.guestSize?.adult) || 1} người lớn, ${Number(booking?.guestSize?.children) || 0} trẻ em`,
    `- Tổng tiền: ${formatVnd(booking.totalPrice)}`,
    "- Đã thanh toán online (VNPay)",
    "",
    `Điện thoại: ${booking.phone || ""}`,
    "",
    `Xem đơn: ${(process.env.FRONTEND_URL || "http://localhost:5174").replace(/\/$/, "")}/my-booking`,
  ];
  return lines.join("\n");
}

/**
 * Gửi email vé / xác nhận sau thanh toán online thành công.
 * Không ném lỗi ra ngoài — gọi từ controller và chỉ log nếu SMTP lỗi.
 */
export async function sendBookingTicketEmail(booking) {
  const to = String(booking?.email || "").trim();
  if (!to) {
    console.warn("[ticket-email] Bỏ qua: booking không có email");
    return { sent: false, reason: "no_email" };
  }

  const fromAddr = process.env.SENDER_EMAIL;
  if (!fromAddr) {
    console.warn("[ticket-email] Bỏ qua: thiếu SENDER_EMAIL trong .env");
    return { sent: false, reason: "no_sender" };
  }

  const code = getBookingShortCodeHash(booking);
  const subject = `Vé điện tử VietNam Travel — ${code}`;

  await transporter.sendMail({
    from: `"VietNam Travel" <${fromAddr}>`,
    to,
    subject,
    text: buildTicketText(booking),
    html: buildTicketHtml(booking),
  });

  return { sent: true };
}
