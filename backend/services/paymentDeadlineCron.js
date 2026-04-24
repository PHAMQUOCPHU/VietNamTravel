import cron from "node-cron";
import { autoCancelExpiredCashBookings } from "../controllers/bookingController.js";

export const startPaymentDeadlineCron = () => {
  // Mỗi 30 phút quét đơn chưa thanh toán + chưa duyệt, quá hạn giữ chỗ 3 giờ thì hủy
  cron.schedule("*/30 * * * *", async () => {
    try {
      const cancelledCount = await autoCancelExpiredCashBookings();
      if (cancelledCount > 0) {
        console.log(`[payment-deadline] Auto-cancelled ${cancelledCount} bookings`);
      }
    } catch (error) {
      console.error("[payment-deadline] Cron job failed:", error.message);
    }
  });
};
