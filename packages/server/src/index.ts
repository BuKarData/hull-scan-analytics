import express from "express";
import cors from "cors";
import { vesselsRouter } from "./routes/vessels.js";
import { scansRouter } from "./routes/scans.js";
import { compareRouter } from "./routes/compare.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "hull-scan-analytics-api", mode: "demo-dataset" });
});

app.use("/api/vessels", vesselsRouter);
app.use("/api/scans", scansRouter);
app.use("/api/compare", compareRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Nie znaleziono zasobu" });
});

app.listen(PORT, () => {
  console.log(`[hull-scan-analytics] API demo dziala na http://localhost:${PORT}`);
});
