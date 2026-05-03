import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/** Tách React, router và thư viện nặng (map, pdf, swiper, markdown, …). */
function manualChunks(id) {
  if (!id.includes("node_modules")) return;
  if (
    id.includes("node_modules/react/") ||
    id.includes("node_modules/react-dom/") ||
    id.includes("node_modules/scheduler/")
  ) {
    return "react-core";
  }
  if (id.includes("react-router")) return "router";
  if (id.includes("react-toastify")) return "toastify";
  if (id.includes("node_modules/axios")) return "axios";
  if (id.includes("framer-motion")) return "framer-motion";
  if (id.includes("socket.io-client")) return "socket-io";

  if (id.includes("leaflet") || id.includes("react-leaflet"))
    return "maps-leaflet";
  if (
    id.includes("@react-google-maps") ||
    id.includes("react-simple-maps") ||
    id.includes("d3-geo") ||
    id.includes("topojson-client")
  ) {
    return "maps-geo";
  }
  if (id.includes("@react-pdf") || id.includes("/jspdf") || id.includes("/pdfjs"))
    return "pdf";
  if (id.includes("swiper")) return "swiper";
  if (
    id.includes("react-markdown") ||
    id.includes("/remark") ||
    id.includes("/unified") ||
    id.includes("/micromark")
  ) {
    return "markdown";
  }
  if (id.includes("react-datepicker")) return "datepicker";
  if (id.includes("react-icons")) return "icons-react";
  if (id.includes("lucide-react")) return "icons-lucide";
  if (id.includes("driver.js")) return "driver-js";
  if (id.includes("react-tooltip")) return "tooltip";
  if (id.includes("canvas-confetti")) return "confetti";
  if (id.includes("qrcode")) return "qrcode";

  return "vendor";
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devServerPort = Number.parseInt(env.VITE_DEV_SERVER_PORT, 10);

  return {
    plugins: [react()],
    assetsInclude: ["**/*.ttf"],
    server: {
      port: Number.isFinite(devServerPort) ? devServerPort : 5174,
      strictPort: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
      /** Minified uncompressed; gzip thực tế nhỏ hơn nhiều (vd. vendor ~289 kB gzip). */
      chunkSizeWarningLimit: 800,
    },
  };
});
