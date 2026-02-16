import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(async () => {
  const [{ default: tailwindcss }, { vitePluginManusRuntime }] = await Promise.all([
    import("@tailwindcss/vite"),
    import("vite-plugin-manus-runtime"),
  ]);

  const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    envDir: path.resolve(__dirname),
    root: path.resolve(__dirname, "client"),
    publicDir: path.resolve(__dirname, "client", "public"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
    },
    optimizeDeps: {
      exclude: ["@tailwindcss/vite", "vite-plugin-manus-runtime"],
    },
    server: {
      host: true,
      // --- CONFIGURAÇÃO DE PROXY ADICIONADA ---
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
      // ----------------------------------------
      allowedHosts: [
        ".manuspre.computer",
        ".manus.computer",
        ".manus-asia.computer",
        ".manuscomputer.ai",
        ".manusvm.computer",
        "localhost",
        "127.0.0.1",
      ],
      fs: {
        strict: true,
        deny: ["./."],
      },
    },
  };
});