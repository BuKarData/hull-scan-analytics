import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import mpaCleanUrls from "./vite-mpa.ts";

// Opt-in landing build: `npx vite build -c vite.landing.config.ts`
// Emits BOTH the app (index.html), the landing (landing.html) and the /demo
// proof page (demo.html) into dist/.
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