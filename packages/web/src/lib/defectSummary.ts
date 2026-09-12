import type { Defect, DefectObservation } from "./types";

export interface DefectSummary {
  /** Historia ograniczona do momentow, w ktorych cos sie realnie dzialo
   *  (niezerowa wartosc) plus zawsze pierwszy wpis od momentu wykrycia -
   *  do wykresu/tabeli, zeby nie ciagnac plaskiego zera sprzed wykrycia. */
  history: DefectObservation[];
  first: DefectObservation;
  last: DefectObservation;
  firstNonZero: DefectObservation;
  /** Zmiana |natezenia| od pierwszego wykrycia do ostatniej obserwacji, w %. */
  growthPct: number;
}

export function summarizeDefect(defect: Defect): DefectSummary {
  const history = defect.history.filter((h) => Math.abs(h.magnitudeMm) > 0.001 || h.scanId === defect.firstDetectedScanId);
  const first = defect.history[0];
  const last = defect.history[defect.history.length - 1];
  const firstNonZero = defect.history.find((h) => h.scanId === defect.firstDetectedScanId) ?? first;
  const growthPct =
    firstNonZero.magnitudeMm !== 0
      ? ((Math.abs(last.magnitudeMm) - Math.abs(firstNonZero.magnitudeMm)) / Math.abs(firstNonZero.magnitudeMm)) * 100
      : 0;
  return { history, first, last, firstNonZero, growthPct };
}
