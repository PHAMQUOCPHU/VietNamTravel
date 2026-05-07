import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import process from "node:process";

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

function resolveBackendProxyTarget(env) {
  let t =
    String(env?.VITE_BACKEND_URL ?? "")
      .trim()
      .replace(/\/api\/?$/i, "")
      .replace(/\/+$/, "") || "http://localhost:5001";
  if (/:(5173|5174|4173)(\/|$)/i.test(t)) {
    return "http://localhost:5001";
  }
  return t || "http://localhost:5001";
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: resolveBackendProxyTarget(env),
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
      chunkSizeWarningLimit: 600,
    },
  };
});
