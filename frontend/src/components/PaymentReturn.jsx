import React, { useEffect, useState, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { CheckCircle, XCircle, Loader } from "lucide-react";

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContext);
  const [status, setStatus] = useState("processing"); // processing, success, fail

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Lấy các tham số quan trọng từ URL VNPay trả về
        const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
        const vnp_TxnRef = searchParams.get("vnp_TxnRef"); // Mã đơn hàng bạn lưu lúc tạo link

        if (vnp_ResponseCode === "00") {
          const dedupeKey = vnp_TxnRef
            ? `vnpay_verify_done_${vnp_TxnRef}`
            : null;
          if (dedupeKey && sessionStorage.getItem(dedupeKey)) {
            setStatus("success");
            return;
          }

          const response = await axios.post(
            `${backendUrl}/api/payment/vnpay-verify`,
            {
              vnp_TxnRef,
              vnp_ResponseCode,
            },
          );

          if (response.data.success) {
            if (dedupeKey) sessionStorage.setItem(dedupeKey, "1");
            setStatus("success");
          } else {
            setStatus("fail");
          }
        } else {
          setStatus("fail");
        }
      } catch (error) {
        console.error("Verify Error:", error);
        setStatus("fail");
      }
    };

    verifyPayment();
  }, [searchParams, backendUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-lg max-w-md w-full text-center">
        {status === "processing" && (
          <div className="flex flex-col items-center gap-4">
            <Loader className="animate-spin text-blue-500" size={48} />
            <h2 className="text-xl font-bold">Đang xác thực giao dịch...</h2>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="text-green-500" size={64} />
            <h2 className="text-2xl font-bold text-gray-800">
              Thanh toán thành công!
            </h2>
            <p className="text-gray-500">
              Cảm ơn bạn đã tin tưởng VietNam Travel.
            </p>
            <button
              onClick={() => navigate("/my-booking")}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold"
            >
              Xem đơn hàng của tôi
            </button>
          </div>
        )}

        {status === "fail" && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="text-red-500" size={64} />
            <h2 className="text-2xl font-bold text-gray-800">
              Thanh toán thất bại
            </h2>
            <p className="text-gray-500">
              Giao dịch bị hủy hoặc có lỗi xảy ra.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 px-6 py-3 bg-gray-800 text-white rounded-xl font-bold"
            >
              Quay lại trang chủ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentReturn;
