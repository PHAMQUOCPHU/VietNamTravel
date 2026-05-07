import { useEffect, useState, useContext, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";
import { getTourSteps } from "./TourSteps";
import { AppContext } from "../context/AppContext";
import { speakQueued } from "../utils/speechTTS";

const TourGuide = ({ variant = "fixed" }) => {
  const { user } = useContext(AppContext);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback(
    (text) => {
      speakQueued(text, {
        voices,
        speechSynthesis: window.speechSynthesis,
      });
    },
    [voices],
  );

  const startTour = useCallback(() => {
    // Sau click người dùng: đọc lại danh sách giọng (Chrome/Android cần gesture)
    window.speechSynthesis.getVoices();
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
  }, [user, speak]);

  const baseFab =
    "group flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white/95 text-blue-600 shadow-lg ring-2 ring-blue-50/70 backdrop-blur-sm transition hover:border-blue-500 hover:bg-blue-600 hover:text-white motion-reduce:transition-none dark:border-slate-600 dark:bg-slate-800 dark:text-blue-400 dark:ring-blue-900/40 dark:hover:border-blue-500 dark:hover:bg-blue-600 dark:hover:text-white";

  const btnClass =
    variant === "dock"
      ? `${baseFab} relative z-[9999]`
      : `fixed bottom-28 right-6 ${baseFab} z-[9999]`;

  return (
    <button
      type="button"
      onClick={startTour}
      className={btnClass}
      aria-label="Hướng dẫn khám phá trang chủ"
      title="Hướng dẫn"
    >
      <HelpCircle className="h-7 w-7" strokeWidth={2} aria-hidden />
    </button>
  );
};

export default TourGuide;
