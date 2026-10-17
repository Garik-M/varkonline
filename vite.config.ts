import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  build: { rollupOptions: { input: {
    main: path.resolve(import.meta.dirname, "index.html"),
    embed: path.resolve(import.meta.dirname, "embed.html"),
  } } },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
