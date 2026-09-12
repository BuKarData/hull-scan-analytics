import { Router } from "express";
import { store } from "../store.js";
import { toScanSummary } from "../data/seed.js";

export const vesselsRouter = Router();

vesselsRouter.get("/", (_req, res) => {
  const list = store.vessels.map(({ vessel, scans, defects }) => {
    const latest = scans[scans.length - 1];
    const previous = scans.length > 1 ? scans[scans.length - 2] : null;
    const openDefects = defects.filter((d) => d.status !== "naprawiona");
    const worstSeverityRank = { good: 0, warning: 1, serious: 2, critical: 3 } as const;
    const worst = openDefects.reduce<keyof typeof worstSeverityRank>((acc, d) => {
      const s = d.history[d.history.length - 1]?.severity ?? "good";
      return worstSeverityRank[s] > worstSeverityRank[acc] ? s : acc;
    }, "good");

    return {
      vessel,
      latestScan: toScanSummary(latest),
      scanCount: scans.length,
      openDefectCount: openDefects.length,
      worstSeverity: worst,
      avgDeviationTrendMm: previous ? latest.avgDeviationMm - previous.avgDeviationMm : 0,
    };
  });
  res.json(list);
});

vesselsRouter.get("/:id", (req, res) => {
  const found = store.getVessel(req.params.id);
  if (!found) return res.status(404).json({ error: "Nie znaleziono jednostki" });
  res.json({
    vessel: found.vessel,
    scans: found.scans.map(toScanSummary),
    baseline: toScanSummary(found.baseline),
    constructionMilestones: found.constructionMilestones.map(toScanSummary),
    defects: found.defects,
  });
});
