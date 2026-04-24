import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

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
  };
});