import type { Connect, Plugin } from "vite";

const REWRITES: Record<string, string> = {
  "/demo": "/demo.html",
  "/landing": "/landing.html",
};

function install(middlewares: Connect.Server) {
  middlewares.use((req, _res, next) => {
    const url = req.url || "/";
    for (const key of Object.keys(REWRITES)) {
      if (url === key || url.startsWith(`${key}?`) || url.startsWith(`${key}/`)) {
        req.url = REWRITES[key] + url.slice(key.length);
        break;
      }
    }
    next();
  });
}

// Maps clean paths (/demo, /landing) to their Vite multi-page HTML entries
// in dev and preview, so navigation works without a framework router.
export default function mpaCleanUrls(): Plugin {
  return {
    name: "vite:mpa-clean-urls",
    configureServer(server) {
      install(server.middlewares);
    },
    configurePreviewServer(server) {
      install(server.middlewares);
    },
  };
}