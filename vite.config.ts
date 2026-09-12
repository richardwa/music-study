import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  server: {
    port: 5178,
    host: true,
    allowedHosts: true,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});
