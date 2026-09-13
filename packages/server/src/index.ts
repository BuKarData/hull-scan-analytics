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
// `vite build -c vite.landing.config.ts`). Serves the SPA at "/",
// the cinema landing at "/landing" and the video proof page at "/demo".
const webDist = path.resolve(__dirname, "../../web/dist");
if (fs.existsSync(path.join(webDist, "index.html"))) {
  app.use(express.static(webDist, { index: false }));
  app.get("/landing", (_req, res) => res.sendFile(path.join(webDist, "landing.html")));
  app.get("/demo", (_req, res) => res.sendFile(path.join(webDist, "demo.html")));
  app.use((req, res) => {
    if (req.path.startsWith("/api")) {
      res.status(404).json({ error: "Nie znaleziono zasobu" });
      return;
    }
    res.sendFile(path.join(webDist, "index.html"));
  });
} else {
  app.use((_req, res) => {
    res.status(404).json({ error: "Nie znaleziono zasobu" });
  });
}

app.listen(PORT, () => {
  console.log(`[hull-scan-analytics] API demo dziala na http://localhost:${PORT}`);
});
