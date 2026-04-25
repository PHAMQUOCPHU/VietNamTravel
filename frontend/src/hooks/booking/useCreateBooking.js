import { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { AppContext } from "../../context";
import { useNavigate } from "react-router-dom";
import { createBooking, createVnPayPayment } from "../../services";

const useBooking = (
  tour,
  selectedDate,
  guestSizeFromState,
  initialTotalPrice,
  paymentMethod = "COD",
) => {
  const { user, backendUrl } = useContext(AppContext);
  const navigate = useNavigate();
  const { title = "", price = 0, _id } = tour || {};

  const [guestSize] = useState(guestSizeFromState || { adult: 1, children: 0 });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialRequests: "",
  });
  const [totalPrice, setTotalPrice] = useState(initialTotalPrice || price);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    const adultPrice = price * guestSize.adult;
    const childrenPrice = price * 0.6 * guestSize.children;
    const baseTotal = adultPrice + childrenPrice;
    setTotalPrice(Math.max(0, baseTotal - discountAmount));
  }, [guestSize, price, discountAmount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e, appliedVoucherCode = "") => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để đặt tour!");
      setIsSubmitting(false);
      return;
    }

    const scheduleId = selectedDate?._id || selectedDate;
    const dateString = selectedDate?.date || selectedDate;
    if (!scheduleId) {
      toast.error("Vui lòng chọn ngày khởi hành!");
      setIsSubmitting(false);
      return;
    }

    try {
      const cleanUrl = backendUrl.trim();
      const responseData = await createBooking({
        backendUrl: cleanUrl,
        token,
        payload: {
          ...formData,
          guestSize,
          tourId: _id,
          scheduleId,
          tourTitle: title,
          totalPrice,
          bookAt: dateString,
          paymentMethod,
          voucherCode: appliedVoucherCode
        },
      });

      if (responseData.success) {
        const bookingId = responseData.booking?._id || responseData.data?._id;
        if (paymentMethod === "Online" || paymentMethod === "Chuyển khoản (Mã QR)") {
          try {
            const paymentData = await createVnPayPayment({
              backendUrl: cleanUrl,
              amount: totalPrice,
              bookingId,
              tourTitle: title,
            });
            if (paymentData.success && paymentData.paymentUrl) {
              toast.info("Đang chuyển hướng sang cổng thanh toán...");
              window.location.href = paymentData.paymentUrl;
            } else {
              toast.error("Lỗi tạo link thanh toán, vui lòng kiểm tra lại Backend!");
            }
          } catch (paymentErr) {
            console.error("Payment Error:", paymentErr);
            toast.error("Không thể kết nối với cổng thanh toán!");
          }
        } else {
          toast.success("Đặt tour thành công!");
          navigate("/my-booking");
        }
      } else {
        toast.error(responseData.message || "Đặt tour thất bại");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error(error.response?.data?.message || "Lỗi kết nối Server (404/500)");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    guestSize,
    totalPrice,
    discountAmount,
    setDiscountAmount,
    isSubmitting,
    handleChange,
    handleSubmit,
  };
};

export default useBooking;
