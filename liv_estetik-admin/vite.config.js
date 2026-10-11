import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    // Keep local dashboard requests on the local API, never the live site.
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
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
