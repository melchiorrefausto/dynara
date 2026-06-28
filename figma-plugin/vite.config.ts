import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  // Build code.ts (Figma sandbox) separately
  if (process.env.BUILD_TARGET === "code") {
    return {
      build: {
        outDir: "dist",
        lib: {
          entry: resolve(__dirname, "src/code.ts"),
          formats: ["iife"],
          name: "DynaraPlugin",
          fileName: () => "code.js"
        },
        emptyOutDir: false
      }
    };
  }

  // Build UI (React iframe → single HTML)
  return {
    plugins: [react(), viteSingleFile()],
    root: resolve(__dirname, "src/ui"),
    build: {
      outDir: resolve(__dirname, "dist"),
      rollupOptions: {
        input: resolve(__dirname, "src/ui/index.html")
      },
      emptyOutDir: false
    }
  };
});
