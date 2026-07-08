import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

const target = process.env.BUILD_TARGET;

const iife = (entry: string, name: string, fileName: string) => ({
  plugins: [react()],
  define: { "process.env.NODE_ENV": '"production"' },
  build: {
    outDir: "dist",
    lib: { entry: resolve(__dirname, entry), formats: ["iife"] as const, name, fileName: () => fileName },
    rollupOptions: { external: [] },
    emptyOutDir: false,
  },
});

export default defineConfig(() => {
  if (target === "bg") {
    return {
      build: {
        outDir: "dist",
        lib: { entry: resolve(__dirname, "src/background/index.ts"), formats: ["iife"] as const, name: "bg", fileName: () => "background.js" },
        emptyOutDir: false,
      },
    };
  }

  if (target === "content") return iife("src/content/index.tsx", "DynaraContent", "content.js");

  if (target === "sidepanel") {
    return {
      ...iife("src/sidepanel/index.tsx", "DynaraSidePanel", "sidepanel.js"),
      // static assets (sidepanel.html) copied from public/
      publicDir: resolve(__dirname, "public"),
    };
  }

  throw new Error(`Unknown BUILD_TARGET "${target}". Expected "bg", "content", or "sidepanel".`);
});
