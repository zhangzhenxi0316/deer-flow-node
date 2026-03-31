/**
 * Vite 配置
 *
 * - 开发时代理 /api 请求到 NestJS API Server (避免 CORS)
 * - 生产构建输出到 dist/
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      // 将 /api/* 请求代理到 API Server
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        // SSE 流式响应需要禁用缓冲
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            if (
              proxyRes.headers["content-type"]?.includes("text/event-stream")
            ) {
              proxyRes.headers["cache-control"] = "no-cache";
            }
          });
        },
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
