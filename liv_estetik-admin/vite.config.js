import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    // Keep local dashboard requests on the local API, never the live site.
    proxy: {
      "/api": {
        target: "https://liv-estetik-api.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
  },
  plugins: [
    react({
      include: /\.(js|jsx)$/,
    }),
  ],
});
