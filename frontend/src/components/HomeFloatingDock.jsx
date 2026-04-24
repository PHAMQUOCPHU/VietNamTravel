import React from "react";
import ChatWidget from "./ChatWidget";
import TourGuide from "./TourGuide";
import TourAdvisorChat from "./TourAdvisorChat";

/**
 * Cột nút trang chủ: từ dưới lên — chat hỗ trợ · tư vấn AI · hướng dẫn (driver.js).
 */
const HomeFloatingDock = () => {
  return (
    <div className="pointer-events-none fixed bottom-6 right-4 z-[9998] flex flex-col-reverse items-end gap-3 sm:right-6">
      <div className="pointer-events-auto">
        <ChatWidget layout="dock" />
      </div>
      <div className="pointer-events-auto">
        <TourAdvisorChat />
      </div>
      <div className="pointer-events-auto">
        <TourGuide variant="dock" />
      </div>
    </div>
  );
};

export default HomeFloatingDock;
