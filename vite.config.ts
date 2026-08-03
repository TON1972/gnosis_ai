import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(async () => {
  const [
    { default: tailwindcss },
    { vitePluginManusRuntime },
    { VitePWA },
  ] = await Promise.all([
    import("@tailwindcss/vite"),
    import("vite-plugin-manus-runtime"),
    import("vite-plugin-pwa"),
  ]);

  const plugins = [
    react(),
    tailwindcss(),
    jsxLocPlugin(),
    vitePluginManusRuntime(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icons/*", "logo-gnosis.png", "manifest.webmanifest"],
      manifest: {
        name: "GNOSIS AI - Estudos Bíblicos Profundos",
        short_name: "GNOSIS AI",
        description: "Estudos bíblicos profundos com inteligência artificial",
        theme_color: "#d4af37",
        background_color: "#FFFACD",
        display: "standalone",
        start_url: "/dashboard",
        scope: "/",
        lang: "pt-BR",
        orientation: "portrait-primary",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
      injectManifest: {
        globPatterns: ["**/*.{html,ico,png,svg,webmanifest,css,woff2}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ];

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