import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
  },
  plugins: [
    react({
      include: /\.(js|jsx)$/,
    }),
  ],
  server: {
    // Proxy `/api` to backend during development to avoid CORS issues
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
