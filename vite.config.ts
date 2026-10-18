import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: "partner-workspace-entry",
    configureServer(server) { server.middlewares.use((req, _res, next) => { if (/^\/partner(?:\/|\?|$)/.test(req.url ?? "")) req.url = `/partner.html${req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`; next(); }); },
    configurePreviewServer(server) { server.middlewares.use((req, _res, next) => { if (/^\/partner(?:\/|\?|$)/.test(req.url ?? "")) req.url = `/partner.html${req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`; next(); }); },
  }],
  server: {
    host: "::",
    port: 8080,
    proxy: { "/partner-api": {
      target: new URL(process.env.VITE_API_URL || "https://varkonlineback-production.up.railway.app/api").origin,
      changeOrigin: true,
      rewrite: (value) => value.replace(/^\/partner-api/, "/api/partner"),
    } },
  },
  build: { rollupOptions: { input: {
    main: path.resolve(import.meta.dirname, "index.html"),
    embed: path.resolve(import.meta.dirname, "embed.html"),
    partner: path.resolve(import.meta.dirname, "partner.html"),
  } } },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
