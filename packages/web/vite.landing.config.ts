import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import mpaCleanUrls from "./vite-mpa.ts";

// Opt-in landing build: `npx vite build -c vite.landing.config.ts`
// Emits the landing page (landing.html, served at "/" and "/landing"), the
// video proof page (demo.html, served at "/demo") and the analytics app
// (index.html, served at "/app") into dist/. See packages/server/src/index.ts
// and vite-mpa.ts for how each entry is mapped to its clean URL.
// Kept as a separate file so the team's vite.config.ts stays untouched.

export default defineConfig({
  plugins: [react(), tailwindcss(), mpaCleanUrls()],
  build: {
    rollupOptions: {
      input: {
        app: new URL("./index.html", import.meta.url).pathname,
        landing: new URL("./landing.html", import.meta.url).pathname,
        demo: new URL("./demo.html", import.meta.url).pathname,
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});