import cron from "node-cron";
import { processDepartureReminders } from "./userNotifications.js";

export const startDepartureReminderCron = () => {
  cron.schedule("*/30 * * * *", async () => {
    try {
      const n = await processDepartureReminders();
      if (n > 0) {
        console.log(`[departure-reminder] Đã gửi ${n} thông báo nhắc 24h`);
      }
    } catch (error) {
      console.error("[departure-reminder] Cron lỗi:", error.message);
    }
  });
};
