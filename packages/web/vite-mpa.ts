import type { Connect, Plugin } from "vite";

// "/" and "/landing" both serve the marketing/cinema landing page (the
// site's start page), "/demo" serves the three-video proof page. Neither
// has client-side sub-routes, so a simple prefix -> file mapping is enough.
const STATIC_REWRITES: Record<string, string> = {
  "/": "/landing.html",
  "/landing": "/landing.html",
  "/demo": "/demo.html",
};

// "/app" (and anything nested under it, e.g. "/app/vessels/:id") serves the
// interactive analytics SPA - the actual visualization tool. It owns
// client-side routing under that prefix via BrowserRouter's basename, so
// every "/app/..." request must resolve to the same index.html and let the
// app's own router read the (unrewritten, browser-visible) URL.
const APP_PREFIX = "/app";
const APP_ENTRY = "/index.html";

function install(middlewares: Connect.Server) {
  middlewares.use((req, _res, next) => {
    const url = req.url || "/";

    if (url === APP_PREFIX || url.startsWith(`${APP_PREFIX}/`) || url.startsWith(`${APP_PREFIX}?`)) {
      req.url = APP_ENTRY;
      next();
      return;
    }

    for (const key of Object.keys(STATIC_REWRITES)) {
      const isRoot = key === "/";
      if (url === key || url.startsWith(`${key}?`) || (!isRoot && url.startsWith(`${key}/`))) {
        req.url = STATIC_REWRITES[key] + url.slice(key.length);
        break;
      }
    }
    next();
  });
}

// Maps clean paths ("/", "/landing", "/demo", "/app") to their Vite
// multi-page HTML entries in dev and preview, so navigation works without
// a framework router at the top level. Production hosting does the
// equivalent mapping in packages/server/src/index.ts.
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
