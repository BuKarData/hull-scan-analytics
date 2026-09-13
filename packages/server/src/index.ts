import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { vesselsRouter } from "./routes/vessels.js";
import { scansRouter } from "./routes/scans.js";
import { compareRouter } from "./routes/compare.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "hull-scan-analytics-api", mode: "demo-dataset" });
});

app.use("/api/vessels", vesselsRouter);
app.use("/api/scans", scansRouter);
app.use("/api/compare", compareRouter);

// Static build of the web workspace (created by
// `vite build -c vite.landing.config.ts`). Serves the cinema landing at "/"
// (the site's start page, also reachable at "/landing"), the video proof
// page at "/demo", and the interactive analytics SPA - the actual
// visualization tool - at "/app" and every path nested under it (its own
// client-side router owns those, via BrowserRouter's basename).
const webDist = path.resolve(__dirname, "../../web/dist");
if (fs.existsSync(path.join(webDist, "index.html"))) {
  app.use(express.static(webDist, { index: false }));
  app.get(["/", "/landing"], (_req, res) => res.sendFile(path.join(webDist, "landing.html")));
  app.get("/demo", (_req, res) => res.sendFile(path.join(webDist, "demo.html")));
  app.get(["/app", "/app/*"], (_req, res) => res.sendFile(path.join(webDist, "index.html")));
  app.use((req, res) => {
    if (req.path.startsWith("/api")) {
      res.status(404).json({ error: "Nie znaleziono zasobu" });
      return;
    }
    // Unknown top-level paths land back on the marketing page instead of a dead end.
    res.sendFile(path.join(webDist, "landing.html"));
  });
} else {
  app.use((_req, res) => {
    res.status(404).json({ error: "Nie znaleziono zasobu" });
  });
}

app.listen(PORT, () => {
  console.log(`[hull-scan-analytics] API demo dziala na http://localhost:${PORT}`);
});
