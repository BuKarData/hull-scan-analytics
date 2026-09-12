import type { Defect } from "./types";

/** Musi zgadzac sie z HULL_SECTION_COUNT w packages/server/src/data/shipModel.ts
 *  (tam rysowane sa faktyczne "szwy" miedzy sekcjami na modelu) - inaczej granice
 *  sekcji pokazywane tutaj nie odpowiadałyby widocznym na kadłubie liniom podziału. */
export const HULL_SECTION_COUNT = 8;

export interface HullSection {
  index: number;
  uStart: number;
  uEnd: number;
  uMid: number;
}

export function buildHullSections(count: number = HULL_SECTION_COUNT): HullSection[] {
  return Array.from({ length: count }, (_, i) => {
    const uStart = i / count;
    const uEnd = (i + 1) / count;
    return { index: i, uStart, uEnd, uMid: (uStart + uEnd) / 2 };
  });
}

export function sectionLabel(index: number, word = "Sekcja"): string {
  return `${word} ${String(index + 1).padStart(2, "0")}`;
}

export function sectionIndexForU(u: number, count: number = HULL_SECTION_COUNT): number {
  return Math.min(count - 1, Math.max(0, Math.floor(u * count)));
}

export interface SectionStats {
  section: HullSection;
  avgDeviationMm: number;
  /** Odchylenie o najwiekszej wartosci bezwzglednej w sekcji, ze znakiem - patrz
   *  analogiczne uzasadnienie przy RegionCell.peakDeviationMm (compare.ts):
   *  usredniona wartosc rozmywa pojedynczy defekt ponizej progu szumu. */
  peakDeviationMm: number;
  sampleCount: number;
  defects: Defect[];
}

/** `uv` i `deviationMm` musza pochodzic z tej samej chmury punktow (ten sam
 *  porzadek wierzcholkow) - typowo `scan.pointCloud.uv` i wynik /api/compare
 *  liczony wzgledem tego skanu. */
export function computeSectionStats(sections: HullSection[], uv: number[], deviationMm: number[], defects: Defect[]): SectionStats[] {
  const n = sections.length;
  const sums = new Array<number>(n).fill(0);
  const counts = new Array<number>(n).fill(0);
  const peakAbs = new Array<number>(n).fill(0);
  const peakSigned = new Array<number>(n).fill(0);

  const pointCount = deviationMm.length;
  for (let i = 0; i < pointCount; i++) {
    const u = uv[i * 2];
    const idx = sectionIndexForU(u, n);
    const dev = deviationMm[i];
    sums[idx] += dev;
    counts[idx]++;
    if (Math.abs(dev) > peakAbs[idx]) {
      peakAbs[idx] = Math.abs(dev);
      peakSigned[idx] = dev;
    }
  }

  return sections.map((section, idx) => ({
    section,
    avgDeviationMm: counts[idx] ? sums[idx] / counts[idx] : 0,
    peakDeviationMm: peakSigned[idx],
    sampleCount: counts[idx],
    defects: defects.filter((d) => sectionIndexForU(d.uv.u, n) === idx),
  }));
}

export function positionsInSection(positions: number[], uv: number[], section: HullSection): number[] {
  const out: number[] = [];
  const n = uv.length / 2;
  for (let i = 0; i < n; i++) {
    const u = uv[i * 2];
    if (u >= section.uStart && u < section.uEnd) {
      out.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    }
  }
  return out;
}
