import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Tách vendor / thư viện lớn để giữ chunk chính gọn và tận dụng cache HTTP. */
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
  if (id.includes("chart.js") || id.includes("react-chartjs-2"))
    return "charts";
  if (id.includes("react-quill") || id.includes("node_modules/quill"))
    return "quill-editor";
  if (id.includes("socket.io-client")) return "socket-io";
  if (id.includes("lucide-react")) return "icons-lucide";
  if (id.includes("react-tag-input")) return "tags-input";

  return "vendor";
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
