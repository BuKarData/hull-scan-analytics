import { Router } from "express";
import { store } from "../store.js";
import { compareScans } from "../lib/compare.js";
import { toScanSummary } from "../data/seed.js";

export const compareRouter = Router();

compareRouter.get("/", (req, res) => {
  const a = String(req.query.a ?? "");
  const b = String(req.query.b ?? "");
  if (!a || !b) return res.status(400).json({ error: "Wymagane parametry ?a=<scanId>&b=<scanId>" });

  const entryA = store.getScan(a);
  const entryB = store.getScan(b);
  if (!entryA || !entryB) return res.status(404).json({ error: "Nie znaleziono jednego ze skanow" });
  if (entryA.vesselId !== entryB.vesselId) {
    return res.status(400).json({ error: "Skany naleza do roznych jednostek - porownanie wymaga tej samej jednostki" });
  }

  const seeded = store.getVessel(entryA.vesselId)!;
  const chronological = entryA.scan.timestamp <= entryB.scan.timestamp;
  const older = chronological ? entryA.scan : entryB.scan;
  const newer = chronological ? entryB.scan : entryA.scan;

  const result = compareScans(seeded.hullGrid, older, newer, seeded.defects);

  res.json({
    scanA: toScanSummary(older),
    scanB: toScanSummary(newer),
    ...result,
  });
});
