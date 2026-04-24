import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Clock,
  PlaneTakeoff,
  XCircle,
} from "lucide-react";

export const getPendingDeadline = (booking) => {
  const isPending = booking.status?.toLowerCase() === "pending";
  const unpaid = booking.paymentStatus !== true;
  if (!isPending || !unpaid || !booking.deadlineTime) {
    return null;
  }
  const deadlineTimestamp = new Date(booking.deadlineTime).getTime();
  return Number.isNaN(deadlineTimestamp) ? null : deadlineTimestamp;
};

export const formatCountdown = (remainingMs) => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

export const getTravelStatus = (bookAt, duration) => {
  if (!bookAt) return "UPCOMING";
  const now = new Date();
  const startDate = new Date(bookAt);
  startDate.setHours(0, 0, 0, 0);
  const days = Number(duration) || 1;
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + (days - 1));
  endDate.setHours(23, 59, 59, 999);

  if (now < startDate) return "UPCOMING";
  if (now >= startDate && now <= endDate) return "ONGOING";
  return "COMPLETED";
};

export const getStatusInfo = (booking) => {
  const status = booking.status?.toLowerCase();

  if (status === "pending") {
    return {
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      label: "Chờ xử lý",
    };
  }
  if (status === "cancel_pending") {
    return {
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      label: "Đang chờ hủy",
    };
  }
  if (status === "cancelled") {
    return {
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      label: "Đã hủy",
    };
  }

  if (status === "confirmed") {
    const travelStatus = getTravelStatus(booking.bookAt, booking.tourId?.duration || 1);

    if (travelStatus === "ONGOING") {
      return {
        icon: PlaneTakeoff,
        color: "text-blue-600",
        bgColor: "bg-blue-100 animate-pulse border border-blue-200",
        label: "Đang diễn ra",
      };
    }

    if (travelStatus === "COMPLETED") {
      return {
        icon: CheckCircle2,
        color: "text-slate-600",
        bgColor: "bg-slate-100 grayscale",
        label: "Đã kết thúc",
      };
    }

    return {
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      label: "Đã xác nhận",
    };
  }

  return {
    icon: Clock,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    label: "Không xác định",
  };
};

export const surveyQuestions = [
  { key: "guide", label: "Thái độ hướng dẫn viên" },
  { key: "transport", label: "Chất lượng xe đưa đón" },
  { key: "food", label: "Chất lượng ăn uống / khách sạn" },
  { key: "schedule", label: "Lịch trình tham quan" },
];

export const surveyOptions = ["Tệ", "Hài lòng", "Rất hài lòng"];
