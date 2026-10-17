import { build, loadEnv } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const env = { ...loadEnv("production", root, ""), ...process.env };
const api = new URL(
  env.VITE_API_URL || "https://varkonlineback-production.up.railway.app/api",
);
await build({
  configFile: false,
  publicDir: false,
  root,
  define: { __VARKONLINE_API_ORIGIN__: JSON.stringify(api.origin) },
  build: {
    target: "es2020",
    outDir: resolve(root, "public/sdk"),
    emptyOutDir: false,
    minify: true,
    lib: {
      entry: resolve(root, "src/embed/sdk.ts"),
      name: "VarkonlineFinancingSDK",
      formats: ["iife"],
      fileName: () => "v1.js",
    },
  },
});
