import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import process from "node:process";

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

  if (id.includes("@react-pdf") || id.includes("/jspdf") || id.includes("/pdfjs"))
    return "pdf";

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
