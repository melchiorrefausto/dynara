import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "path";

const target = process.env.BUILD_TARGET;

export default defineConfig(() => {
  if (target === "bg") {
    return {
      build: {
        outDir: "dist",
        lib: { entry: resolve(__dirname, "src/background/index.ts"), formats: ["iife"], name: "bg", fileName: () => "background.js" },
        emptyOutDir: false
      }
    };
  }

  if (target === "content") {
    return {
      define: { "process.env.NODE_ENV": '"production"' },
      build: {
        outDir: "dist",
        lib: { entry: resolve(__dirname, "src/content/index.tsx"), formats: ["iife"], name: "DynaraContent", fileName: () => "content.js" },
        rollupOptions: { external: [] },
        emptyOutDir: false
      },
      plugins: [react()]
    };
  }

  // popup
  return {
    plugins: [react(), viteSingleFile()],
    root: resolve(__dirname, "src/popup"),
    build: {
      outDir: resolve(__dirname, "dist"),
      rollupOptions: { input: resolve(__dirname, "src/popup/index.html") },
      emptyOutDir: false
    }
  };
});
