import React from "react";
import { useLocation } from "react-router-dom";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// ===== STYLE PDF =====
const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  header: { textAlign: "center", marginBottom: 20 },
  logo: { width: 80, marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  section: { marginBottom: 10 },
  label: { fontWeight: "bold" },
});

// ===== PDF COMPONENT =====
const InvoicePDF = ({ booking }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image src="/logo.png" style={styles.logo} />
        <Text style={styles.title}>HÓA ĐƠN ĐẶT TOUR</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>THÔNG TIN KHÁCH HÀNG</Text>
        <Text>Tên: {booking.name}</Text>
        <Text>Email: {booking.email}</Text>
        <Text>SĐT: {booking.phone}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>THÔNG TIN TOUR</Text>
        <Text>Tên tour: {booking.tourTitle}</Text>
        <Text>Số người: {booking.travelers}</Text>
        <Text>
          Tổng tiền:{" "}
          {booking.totalPrice?.toLocaleString("vi-VN")} VNĐ
        </Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <Text>
          Ngày: {new Date().toLocaleDateString("vi-VN")}
        </Text>
      </View>
    </Page>
  </Document>
);

// ===== MAIN UI =====
const Invoice = () => {
  const location = useLocation();
  const booking = location.state?.booking;

  if (!booking) {
    return (
      <div className="max-w-3xl mx-auto mt-20 p-6 bg-white shadow-lg rounded-xl text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">
          ❌ Không có dữ liệu đặt tour
        </h2>
        <p>Vui lòng quay lại và thử lại.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8 transition hover:shadow-blue-200">

        {/* HEADER */}
        <div className="text-center border-b pb-6 mb-6">
          <img
            src="/logo.png"
            alt="logo"
            className="mx-auto w-20 mb-3 drop-shadow-md"
          />
          <h1 className="text-3xl font-bold text-gray-800">
            Hóa đơn đặt tour
          </h1>
          <p className="text-gray-500">
            Ngày: {new Date().toLocaleDateString("vi-VN")}
          </p>
        </div>

        {/* CUSTOMER */}
        <div className="bg-blue-50 p-5 rounded-xl shadow-sm mb-6 hover:scale-[1.01] transition">
          <h3 className="text-xl font-semibold mb-3 text-blue-700">
            👤 Thông tin khách hàng
          </h3>
          <p><strong>Tên:</strong> {booking.name}</p>
          <p><strong>Email:</strong> {booking.email}</p>
          <p><strong>SĐT:</strong> {booking.phone}</p>
        </div>

        {/* TOUR */}
        <div className="bg-purple-50 p-5 rounded-xl shadow-sm mb-6 hover:scale-[1.01] transition">
          <h3 className="text-xl font-semibold mb-3 text-purple-700">
            ✈️ Thông tin tour
          </h3>
          <p><strong>Tên tour:</strong> {booking.tourTitle}</p>
          <p><strong>Số người:</strong> {booking.travelers}</p>
          <p className="text-lg font-bold text-green-600">
            💰 Tổng tiền:{" "}
            {booking.totalPrice?.toLocaleString("vi-VN")} VNĐ
          </p>
        </div>

        {/* BUTTON */}
        <div className="text-center">
          <PDFDownloadLink
            document={<InvoicePDF booking={booking} />}
            fileName="hoa_don_dat_tour.pdf"
          >
            {({ loading }) =>
              loading ? (
                <button className="px-6 py-3 bg-gray-400 text-white rounded-lg">
                  Đang tạo PDF...
                </button>
              ) : (
                <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition duration-300">
                  📄 Tải hóa đơn PDF
                </button>
              )
            }
          </PDFDownloadLink>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
