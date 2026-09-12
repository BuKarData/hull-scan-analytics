import { UniformGridIndex } from "./spatialHash.js";
import type { AnomalyCluster, Defect, DefectType, RegionCell, ScanDetail } from "../types.js";
import type { HullGrid } from "../data/hull.js";
import { pointIndex } from "../data/hull.js";

export const NOISE_THRESHOLD_MM = 1.2;

const LENGTH_BANDS = ["Rufa", "Rufa-śródokręcie", "Śródokręcie", "Śródokręcie-dziób", "Dziób"];
const GIRTH_SECTORS = ["Burta prawa (WL)", "Pokład / nadburcie", "Burta lewa (WL)", "Dno / stępka"];

function girthSectorIndex(v01: number): number {
  const deg = ((v01 % 1) + 1) % 1;
  if (deg < 0.125 || deg >= 0.875) return 0; // ~0deg
  if (deg < 0.375) return 1; // ~90deg
  if (deg < 0.625) return 2; // ~180deg
  return 3; // ~270deg
}

/**
 * Porownuje dwa skany tego samego kadluba metoda najblizszego sasiada (NN) w 3D,
 * a nie odejmowaniem "punkt po punkcie" - tak jak wygladaloby to dla dwoch
 * niezaleznych rekonstrukcji Gaussian Splatting o roznej liczbie/kolejnosci
 * gaussianow. Znak odchylenia liczony jest przez rzut wektora (B - najblizszy_A)
 * na lokalna normalna bazowej geometrii kadluba (dodatni = narost/wybrzuszenie,
 * ujemny = wgniecenie/ubytek).
 */
export function compareScans(
  hullGrid: HullGrid,
  scanA: ScanDetail,
  scanB: ScanDetail,
  defects: Defect[]
) {
  const { uSteps, vSteps } = hullGrid.params;
  const index = new UniformGridIndex(new Float64Array(scanA.pointCloud.positions), 0.35);
  const posB = scanB.pointCloud.positions;
  const n = posB.length / 3;
  const deviationMm = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const x = posB[i * 3];
    const y = posB[i * 3 + 1];
    const z = posB[i * 3 + 2];
    const { index: nearestIdx } = index.nearest(x, y, z);
    const nx = scanA.pointCloud.positions[nearestIdx * 3];
    const ny = scanA.pointCloud.positions[nearestIdx * 3 + 1];
    const nz = scanA.pointCloud.positions[nearestIdx * 3 + 2];
    const nnx = hullGrid.normals[nearestIdx * 3];
    const nny = hullGrid.normals[nearestIdx * 3 + 1];
    const nnz = hullGrid.normals[nearestIdx * 3 + 2];
    const dot = (x - nx) * nnx + (y - ny) * nny + (z - nz) * nnz;
    deviationMm[i] = dot * 1000; // m -> mm
  }

  // --- agregacja regionowa (heatmapa siatkowa) ---
  const rows = LENGTH_BANDS.length;
  const cols = GIRTH_SECTORS.length;
  const sums = new Float64Array(rows * cols);
  const sumsAbs = new Float64Array(rows * cols);
  const maxAbs = new Float64Array(rows * cols);
  const counts = new Int32Array(rows * cols);

  for (let i = 0; i < uSteps; i++) {
    const u = i / (uSteps - 1);
    const row = Math.min(rows - 1, Math.floor(u * rows));
    for (let j = 0; j < vSteps; j++) {
      const v01 = j / vSteps;
      const col = girthSectorIndex(v01);
      const idx = pointIndex(i, j, vSteps);
      const dev = deviationMm[idx];
      const cell = row * cols + col;
      sums[cell] += dev;
      sumsAbs[cell] += Math.abs(dev);
      maxAbs[cell] = Math.max(maxAbs[cell], Math.abs(dev));
      counts[cell]++;
    }
  }

  const cells: RegionCell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = row * cols + col;
      const count = counts[cell] || 1;
      cells.push({
        row,
        col,
        label: `${LENGTH_BANDS[row]} - ${GIRTH_SECTORS[col]}`,
        avgDeviationMm: sums[cell] / count,
        maxAbsDeviationMm: maxAbs[cell],
        sampleCount: counts[cell],
      });
    }
  }

  // --- wykrywanie skupisk (connected components na siatce u,v) ---
  const visited = new Uint8Array(uSteps * vSteps);
  const clusters: AnomalyCluster[] = [];
  let clusterSeq = 0;

  for (let i = 0; i < uSteps; i++) {
    for (let j = 0; j < vSteps; j++) {
      const idx = pointIndex(i, j, vSteps);
      if (visited[idx]) continue;
      if (Math.abs(deviationMm[idx]) < NOISE_THRESHOLD_MM) {
        visited[idx] = 1;
        continue;
      }
      const sign = deviationMm[idx] > 0 ? 1 : -1;

      // BFS ograniczone do sasiadow o tym samym znaku odchylenia
      const stack: [number, number][] = [[i, j]];
      visited[idx] = 1;
      const members: number[] = [];
      let iMin = i, iMax = i;
      const jValues: number[] = [];

      while (stack.length) {
        const [ci, cj] = stack.pop()!;
        const cIdx = pointIndex(ci, cj, vSteps);
        members.push(cIdx);
        iMin = Math.min(iMin, ci);
        iMax = Math.max(iMax, ci);
        jValues.push(cj);

        const neighbors: [number, number][] = [
          [ci - 1, cj],
          [ci + 1, cj],
          [ci, (cj - 1 + vSteps) % vSteps],
          [ci, (cj + 1) % vSteps],
        ];
        for (const [ni, nj] of neighbors) {
          if (ni < 0 || ni >= uSteps) continue;
          const nIdx = pointIndex(ni, nj, vSteps);
          if (visited[nIdx]) continue;
          const dev = deviationMm[nIdx];
          if (Math.abs(dev) < NOISE_THRESHOLD_MM || Math.sign(dev) !== sign) continue;
          visited[nIdx] = 1;
          stack.push([ni, nj]);
        }
      }

      if (members.length < 4) continue; // odrzucamy pojedyncze piksele szumu

      let peak = 0;
      let sum = 0;
      let sx = 0, sy = 0, sz = 0;
      let sinSum = 0, cosSum = 0;
      let uSum = 0;
      for (const m of members) {
        const dev = deviationMm[m];
        sum += dev;
        if (Math.abs(dev) > Math.abs(peak)) peak = dev;
        sx += scanB.pointCloud.positions[m * 3];
        sy += scanB.pointCloud.positions[m * 3 + 1];
        sz += scanB.pointCloud.positions[m * 3 + 2];
      }
      for (const cj of jValues) {
        const ang = (cj / vSteps) * Math.PI * 2;
        sinSum += Math.sin(ang);
        cosSum += Math.cos(ang);
      }
      const uCentroid = (iMin + iMax) / 2 / (uSteps - 1);
      const vCentroidAngle = Math.atan2(sinSum, cosSum);
      const vCentroid01 = (vCentroidAngle / (Math.PI * 2) + 1) % 1;

      const aspectRatio = (iMax - iMin + 1) / Math.max(1, members.length / (iMax - iMin + 1));
      const areaFraction = members.length / (uSteps * vSteps);
      let suggestedType: DefectType;
      if (sign < 0 && aspectRatio > 4 && areaFraction < 0.01) {
        suggestedType = "peknieciecie";
      } else if (sign < 0 && Math.abs(peak) > 4 && areaFraction < 0.03) {
        suggestedType = "wgniecenie";
      } else if (sign < 0) {
        suggestedType = Math.abs(peak) < 2 ? "ubytek-powloki" : "korozja";
      } else {
        suggestedType = "porost-biologiczny";
      }

      let matchedDefectId: string | null = null;
      let bestDist = Infinity;
      for (const d of defects) {
        const du = d.uv.u - uCentroid;
        let dv = d.uv.v - vCentroid01;
        dv = dv - Math.round(dv);
        const dist = Math.hypot(du, dv);
        if (dist < bestDist) {
          bestDist = dist;
          matchedDefectId = d.id;
        }
      }
      if (bestDist > 0.08) matchedDefectId = null;

      clusters.push({
        id: `${scanB.id}-cluster-${clusterSeq++}`,
        centroidUV: { u: uCentroid, v: vCentroid01 },
        centroid: { x: sx / members.length, y: sy / members.length, z: sz / members.length },
        peakDeviationMm: peak,
        meanDeviationMm: sum / members.length,
        areaPointCount: members.length,
        sign: sign > 0 ? "bulge" : "dent",
        suggestedType,
        matchedDefectId,
      });
    }
  }

  const absDevs = Array.from(deviationMm, Math.abs);
  const avgAbsDeviationMm = absDevs.reduce((a, b) => a + b, 0) / (absDevs.length || 1);
  const maxAbsDeviationMm = absDevs.reduce((a, b) => Math.max(a, b), 0);
  const changed = absDevs.filter((d) => d >= NOISE_THRESHOLD_MM).length;
  const surfaceChangedPct = (changed / (absDevs.length || 1)) * 100;

  return {
    deviationMm: Array.from(deviationMm),
    positions: scanB.pointCloud.positions,
    stats: {
      avgAbsDeviationMm,
      maxAbsDeviationMm,
      surfaceChangedPct,
      noiseThresholdMm: NOISE_THRESHOLD_MM,
    },
    regionGrid: { rows, cols, cells },
    clusters: clusters.sort((a, b) => Math.abs(b.peakDeviationMm) - Math.abs(a.peakDeviationMm)),
  };
}
