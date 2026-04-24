import React, { useEffect, useState, useContext, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";
import { getTourSteps } from "./TourSteps";
import { AppContext } from "../context/AppContext";

const TourGuide = ({ variant = "fixed" }) => {
  const { user } = useContext(AppContext);
  const [voices, setVoices] = useState([]);

  // Load danh sách giọng nói khi component mount
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const speak = (text) => {
    window.speechSynthesis.cancel();

    // Mẹo: Thêm khoảng nghỉ nhẹ sau mỗi dấu câu để nghe tự nhiên hơn
    const utterance = new SpeechSynthesisUtterance(
      text.replace(/,/g, ", .").replace(/\./g, ". .."),
    );

    // TÌM GIỌNG NGỌT: Ưu tiên giọng Google tiếng Việt (Female)
    const googleVoice = voices.find(
      (v) => v.lang === "vi-VN" && v.name.includes("Google"),
    );
    // Nếu không có Google, tìm giọng nữ (thường có chữ 'Microsoft' hoặc 'Female' trong tên)
    const femaleVoice = voices.find(
      (v) =>
        v.lang === "vi-VN" &&
        (v.name.includes("Female") ||
          v.name.includes("Anny") ||
          v.name.includes("Linh")),
    );

    utterance.voice =
      googleVoice || femaleVoice || voices.find((v) => v.lang === "vi-VN");
    utterance.lang = "vi-VN";

    // CĂN CHỈNH THÔNG SỐ:
    utterance.rate = 0.88; // Tốc độ chậm vừa phải, nghe rất tình cảm
    utterance.pitch = 1.2; // Tăng cao độ lên 1.2 giúp giọng nữ trong và ngọt hơn hẳn
    utterance.volume = 1; // Âm lượng tối đa

    window.speechSynthesis.speak(utterance);
  };

  const startTour = useCallback(() => {
    const steps = getTourSteps({ user });
    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: "rgba(0, 0, 0, 0.75)",
      nextBtnText: "Tiếp tục",
      prevBtnText: "Quay lại",
      doneBtnText: "Khám phá ngay",
      steps,
      onHighlightStarted: (element, step) => {
        speak(step.popover.description);
      },
      onDestroyed: () => {
        window.speechSynthesis.cancel();
      },
    });
    driverObj.drive();
  }, [user]);

  const btnClass =
    variant === "dock"
      ? "flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-blue-100 px-4 py-2.5 rounded-full shadow-xl hover:bg-blue-600 hover:text-white transition-all duration-300 group z-[9999] ring-4 ring-blue-50/50 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-blue-600"
      : "fixed bottom-28 right-6 flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-blue-100 px-4 py-2.5 rounded-full shadow-xl hover:bg-blue-600 hover:text-white transition-all duration-300 group z-[9999] ring-4 ring-blue-50/50";

  return (
    <button
      type="button"
      onClick={startTour}
      className={btnClass}
    >
      <HelpCircle size={18} className="text-blue-600 group-hover:text-white" />
      <span className="font-bold text-[13px] text-gray-700 group-hover:text-white">
        Hướng dẫn
      </span>
    </button>
  );
};

export default TourGuide;
