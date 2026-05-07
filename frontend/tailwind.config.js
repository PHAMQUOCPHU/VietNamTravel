/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        chat: ['"Be Vietnam Pro"', "Outfit", "system-ui", "sans-serif"],
        terms: ['"DM Sans"', "system-ui", "sans-serif"],
        "terms-display": ['"Instrument Serif"', "Georgia", "serif"],
      },
      keyframes: {
        chatMsgIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        maintenanceFloat: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(30px)" },
        },
        maintenanceSlideUp: {
          from: { opacity: "0", transform: "translateY(40px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        maintenanceIconPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.4)" },
          "50%": { boxShadow: "0 0 0 20px rgba(59, 130, 246, 0)" },
        },
        maintenanceBlink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
      animation: {
        "chat-msg-in": "chatMsgIn 0.3s ease both",
        "maintenance-float": "maintenanceFloat 8s ease-in-out infinite",
        "maintenance-float-reverse":
          "maintenanceFloat 12s ease-in-out infinite reverse",
        "maintenance-enter":
          "maintenanceSlideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "maintenance-icon-pulse":
          "maintenanceIconPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "maintenance-blink": "maintenanceBlink 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"), // --- THÊM DÒNG NÀY VÀO ĐÂY ---
  ],
};
