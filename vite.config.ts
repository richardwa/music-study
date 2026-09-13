import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  base: "./",
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    strictPort: true,
  },
  build: {
    // built into docs/, the GitHub Pages root
    outDir: path.resolve(__dirname, "docs"),
    emptyOutDir: true,
  },
});
