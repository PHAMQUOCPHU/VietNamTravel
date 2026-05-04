import React from "react";
import { useLocation } from "react-router-dom";
import { Plane, CalendarDays, User, MapPinned, Ticket } from "lucide-react";
import {
  getBookingShortCodePlain,
  getBookingShortCodeHash,
} from "../utils/bookingCode.js";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import QRCode from "qrcode";

import { fontAssets } from "../assets";

Font.register({
  family: "Roboto",
  fonts: [
    { src: fontAssets.robotoRegular },
    { src: fontAssets.robotoItalic, fontStyle: "italic" },
  ],
});

// ===== STYLE PDF (Tối ưu cho giao diện hóa đơn thực tế) =====
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    color: "#333",
    fontFamily: "Roboto", // ÁP DỤNG FONT CHO TOÀN BỘ TRANG
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: 2,
    borderBottomColor: "#3b82f6",
    paddingBottom: 10,
    marginBottom: 20,
  },
  companyName: { fontSize: 18, fontWeight: "bold", color: "#3b82f6" },
  invoiceTitle: { fontSize: 22, fontWeight: "bold", textAlign: "right" },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    backgroundColor: "#f3f4f6",
    padding: 5,
    marginBottom: 10,
  },
  row: { flexDirection: "row", marginBottom: 5 },
  label: { width: 100, fontWeight: "bold" },
  value: { flex: 1 },
  table: {
    marginTop: 10,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#3b82f6",
    color: "#fff",
    padding: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    padding: 8,
  },
  totalBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#eff6ff",
    alignSelf: "flex-end",
    width: 200,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
});

const getTourDurationDays = (booking) =>
  Number(booking?.tourId?.duration ?? booking?.duration ?? 1) || 1;

/** Ngày về: ngày cuối của tour (khởi hành + duration - 1 ngày) */
const getReturnDate = (bookAt, durationDays) => {
  if (!bookAt) return null;
  const start = new Date(bookAt);
  if (Number.isNaN(start.getTime())) return null;
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + Math.max(1, durationDays) - 1);
  return end;
};

const getBookingStatusDisplay = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "pending")
    return { label: "Chờ xử lý", pillClass: "bg-amber-500 text-white" };
  if (s === "cancel_pending")
    return { label: "Đang chờ hủy", pillClass: "bg-orange-500 text-white" };
  if (s === "cancelled")
    return { label: "Đã hủy", pillClass: "bg-red-600 text-white" };
  if (s === "confirmed")
    return { label: "Đã xác nhận", pillClass: "bg-green-500 text-white" };
  return { label: "Không xác định", pillClass: "bg-slate-500 text-white" };
};

const fmtVnd = (n) =>
  `${Number(n ?? 0).toLocaleString("vi-VN")} VNĐ`;

// ===== PDF COMPONENT (Nằm trong cùng 1 file) =====
const InvoicePDF = ({ booking, qrCode }) => {
  const durationDays = getTourDurationDays(booking);
  const returnDate = getReturnDate(booking.bookAt, durationDays);

  return (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>VIETNAM TRAVEL</Text>
          <Text>Hotline: 0905713702</Text>
        </View>
        <View>
          <Text style={styles.invoiceTitle}>HÓA ĐƠN</Text>
          <Text style={{ textAlign: "right" }}>
            Mã: {getBookingShortCodeHash(booking._id)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>THÔNG TIN KHÁCH HÀNG</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Họ tên:</Text>
          <Text>{booking.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text>{booking.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CHI TIẾT ĐẶT TOUR</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ flex: 2 }}>Tên Tour</Text>
            <Text style={{ flex: 1 }}>Ngày đi / về</Text>
            <Text style={{ flex: 1, textAlign: "right" }}>Tổng tiền</Text>
          </View>
          <View style={styles.tableRow}>
            <View style={{ flex: 2 }}>
              <Text>{booking.tourTitle}</Text>
              <Text style={{ fontSize: 9, color: "#666" }}>
                ({booking.guestSize?.adult || 1} Người lớn{" "}
                {booking.guestSize?.children > 0
                  ? `+ ${booking.guestSize.children} Trẻ em`
                  : ""}
                )
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text>
                Đi: {new Date(booking.bookAt).toLocaleDateString("vi-VN")}
              </Text>
              {returnDate && (
                <Text style={{ marginTop: 4 }}>
                  Về: {returnDate.toLocaleDateString("vi-VN")}
                </Text>
              )}
            </View>
            <Text style={{ flex: 1, textAlign: "right" }}>
              {fmtVnd(booking.totalPrice)}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        <View style={styles.totalBox}>
          <Text style={{ fontSize: 10 }}>TỔNG THANH TOÁN:</Text>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1e40af" }}>
            {fmtVnd(booking.totalPrice)}
          </Text>
        </View>

        {/* QR CODE TRONG PDF */}
        {qrCode && (
          <View
            style={{
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#d1d5db",
              padding: 10,
              borderRadius: 4,
            }}
          >
            <Image src={qrCode} style={{ width: 100, height: 100 }} />
            <Text style={{ fontSize: 8, marginTop: 5, color: "#666" }}>
              Quét để xác minh
            </Text>
          </View>
        )}
      </View>
    </Page>
  </Document>
  );
};

// ===== MAIN UI (Trang hiển thị trên Web) =====
const Invoice = () => {
  const location = useLocation();
  const booking = location.state?.booking;
  const [qrCode, setQrCode] = React.useState(null);

  const durationDays = booking ? getTourDurationDays(booking) : 1;
  const returnDate = booking
    ? getReturnDate(booking.bookAt, durationDays)
    : null;
  const statusDisplay = booking
    ? getBookingStatusDisplay(booking.status)
    : getBookingStatusDisplay("");

  // Tạo QR code từ booking ID
  React.useEffect(() => {
    if (booking?._id) {
      QRCode.toDataURL(booking._id, { width: 200 })
        .then((url) => setQrCode(url))
        .catch((err) => console.error("QR Code Error:", err));
    }
  }, [booking]);

  if (!booking)
    return (
      <div className="p-10 text-center text-red-500 font-bold">
        Không tìm thấy dữ liệu đặt tour!
      </div>
    );

  const startDate = new Date(booking.bookAt);
  const startDay = startDate.getDate().toString().padStart(2, "0");
  const startMonth = startDate.toLocaleDateString("vi-VN", { month: "short" });
  const startWeekday = startDate.toLocaleDateString("vi-VN", {
    weekday: "long",
  });
  const isCancelled =
    String(booking.status || "").toLowerCase() === "cancelled";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50/40 to-slate-100 py-10 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-lg mx-auto">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 mb-4 dark:text-slate-400">
          Vé điện tử · E-ticket
        </p>

        <div
          className={`relative rounded-2xl border border-slate-200/80 bg-white shadow-[0_25px_60px_-15px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-900 ${isCancelled ? "ring-2 ring-red-200/80 dark:ring-red-900/50" : ""}`}
        >
          <div className="relative overflow-hidden rounded-t-2xl">
            {/* Watermark */}
            <div
              className="pointer-events-none absolute -right-8 top-24 select-none text-[7rem] font-black uppercase leading-none text-slate-100/90 dark:text-slate-800/80 rotate-[-12deg]"
              aria-hidden
            >
              VN
            </div>
            {isCancelled && (
              <div
                className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                aria-hidden
              >
                <span className="rotate-[-18deg] rounded-lg border-4 border-red-400/50 px-6 py-2 text-3xl font-black uppercase tracking-widest text-red-500/35 dark:text-red-400/25">
                  Đã hủy
                </span>
              </div>
            )}

            {/* Header strip — boarding pass style */}
            <div className="relative bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-800 px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Ticket className="h-6 w-6 text-white" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-100/90">
                    VietNam Travel
                  </p>
                  <p className="truncate text-lg font-black tracking-tight">
                    Vé tham quan &amp; du lịch
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide shadow-sm ${statusDisplay.pillClass}`}
              >
                {statusDisplay.label}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-white/20 pt-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-200">
                  Mã đặt chỗ
                </p>
                <p className="font-mono text-xl font-bold tracking-[0.12em] sm:text-2xl">
                  {getBookingShortCodeHash(booking._id)}
                </p>
              </div>
              <p className="text-right text-[11px] text-sky-100">
                Ngày in vé:{" "}
                <span className="font-semibold text-white">
                  {new Date().toLocaleDateString("vi-VN")}
                </span>
              </p>
            </div>
          </div>

          {/* Main body */}
          <div className="relative px-5 pb-2 pt-6 sm:px-7">
            <div className="mb-6 flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <User className="h-4 w-4 shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider">
                  Hành khách
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {booking.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {booking.email}
                </p>
                {booking.phone && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {booking.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Big date row — vé máy bay inspired */}
            <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Khởi hành
                </p>
                <p className="text-4xl font-black tabular-nums text-slate-900 dark:text-white sm:text-5xl">
                  {startDay}
                </p>
                <p className="text-sm font-bold capitalize text-slate-600 dark:text-slate-300">
                  {startMonth}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {startWeekday}
                </p>
              </div>
              <div className="flex flex-col items-center px-1">
                <Plane className="h-8 w-8 text-sky-500 dark:text-sky-400" />
                <div className="mt-1 h-px w-12 bg-gradient-to-r from-transparent via-sky-300 to-transparent dark:via-sky-600" />
                <p className="mt-1 text-[10px] font-bold text-slate-400">
                  {durationDays} ngày
                </p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {returnDate ? "Kết thúc tour" : "Lịch trình"}
                </p>
                {returnDate ? (
                  <>
                    <p className="text-2xl font-black tabular-nums text-slate-900 dark:text-white sm:text-3xl">
                      {returnDate.getDate().toString().padStart(2, "0")}
                    </p>
                    <p className="text-sm font-bold capitalize text-slate-600 dark:text-slate-300">
                      {returnDate.toLocaleDateString("vi-VN", { month: "short" })}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    —
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4 dark:border-slate-600 dark:bg-slate-900/40">
              <div className="flex items-start gap-2">
                <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Chương trình
                  </p>
                  <p className="text-base font-bold leading-snug text-slate-900 dark:text-white sm:text-lg">
                    {booking.tourTitle}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <CalendarDays className="h-3 w-3" />
                      {booking.guestSize ? (
                        <>
                          {booking.guestSize.adult} người lớn
                          {booking.guestSize.children > 0 &&
                            ` · ${booking.guestSize.children} trẻ em`}
                        </>
                      ) : (
                        <>{booking.travelers || 1} khách</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Perforation */}
          <div className="relative flex items-center bg-white px-5 dark:bg-slate-900">
            <div className="absolute -left-1 top-1/2 z-[1] h-5 w-5 -translate-y-1/2 rounded-full border border-slate-200 bg-gradient-to-br from-slate-100 via-sky-50/80 to-slate-100 dark:border-slate-600 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
            <div className="absolute -right-1 top-1/2 z-[1] h-5 w-5 -translate-y-1/2 rounded-full border border-slate-200 bg-gradient-to-br from-slate-100 via-sky-50/80 to-slate-100 dark:border-slate-600 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
            <div className="h-px flex-1 border-t-2 border-dashed border-slate-200 dark:border-slate-600" />
          </div>

          {/* Stub: price + QR */}
          <div className="flex flex-col gap-5 bg-slate-50/90 px-5 py-6 sm:flex-row sm:items-stretch sm:justify-between sm:px-7 dark:bg-slate-800/40">
            <div className="flex flex-1 flex-col justify-center rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-slate-900/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Tổng thanh toán
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-emerald-700 dark:text-emerald-300 sm:text-3xl">
                {fmtVnd(booking.totalPrice)}
              </p>
              <p className="mt-2 text-[11px] text-emerald-800/70 dark:text-emerald-400/80">
                Giá đã bao gồm VAT (nếu có). Vui lòng xuất trình mã khi lên xe /
                check-in.
              </p>
            </div>

            {qrCode && (
              <div className="flex shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-900">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Quét để xác minh
                </p>
                <img
                  src={qrCode}
                  alt="Mã QR đặt chỗ"
                  className="h-32 w-32 sm:h-36 sm:w-36"
                />
                <p className="mt-2 font-mono text-[10px] text-slate-400">
                  {getBookingShortCodeHash(booking._id)}
                </p>
              </div>
            )}
          </div>

          {booking.cancellationReason && (
            <div className="border-t border-red-100 bg-red-50/90 px-5 py-4 dark:border-red-900/40 dark:bg-red-950/30">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                Ghi chú hủy
              </p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-red-800 dark:text-red-200">
                {booking.cancellationReason}
              </p>
            </div>
          )}

          <div className="overflow-hidden rounded-b-2xl border-t border-slate-100 px-5 py-5 text-center dark:border-slate-700">
            <PDFDownloadLink
              document={<InvoicePDF booking={booking} qrCode={qrCode} />}
              fileName={`Ve_${getBookingShortCodePlain(booking._id)}.pdf`}
            >
              {({ loading }) => (
                <button
                  type="button"
                  className={`mx-auto flex w-full max-w-xs items-center justify-center rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98] sm:mx-0 sm:inline-flex sm:max-w-none sm:min-w-[240px] sm:px-8 ${
                    loading
                      ? "cursor-wait bg-slate-400"
                      : "bg-gradient-to-r from-sky-600 to-indigo-700 shadow-sky-900/20"
                  }`}
                >
                  {loading ? "Đang tạo file…" : "Tải vé PDF"}
                </button>
              )}
            </PDFDownloadLink>
            <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
              Hotline:{" "}
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                0905 713 702
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
