import type { CompareResponse, ScanDetail, ScanSummary, VesselDetailResponse, VesselListItem } from "../lib/types";

export type FleetItem = VesselListItem;

export interface ClusterSafe {
  x: number;
  y: number;
  z: number;
  sign: "dent" | "bulge";
  suggestedType: string;
  peakDeviationMm: number;
}

export interface HeatData {
  positions: Float32Array;
  normals: Float32Array;
  baseColor: Float32Array;
  heatColor: Float32Array;
  aU: Float32Array;
  indices: number[] | Uint32Array;
  pointCount: number;
  center: [number, number, number];
  radius: number;
  minZ: number;
  maxZ: number;
  waterY: number;
  beamSpan: number;
  heightSpan: number;
  maxAbsDeviationMm: number;
  avgAbsDeviationMm: number;
  surfaceChangedPct: number;
  noiseFloorMm: number;
  clusters: ClusterSafe[];
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

const HEAT_DENT: [number, number, number] = [1.0, 0.36, 0.42];
const HEAT_DENT_MID: [number, number, number] = [1.0, 0.72, 0.5];
const HEAT_NEUT: [number, number, number] = [0.78, 0.84, 0.92];
const HEAT_BULGE_MID: [number, number, number] = [0.45, 0.85, 1.0];
const HEAT_BULGE: [number, number, number] = [0.2, 0.45, 1.0];

const MAX_SCALE_MM = 6;

function lerpC(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function deviationToColor(mm: number, scaleMm = MAX_SCALE_MM): [number, number, number] {
  const t = Math.max(-1, Math.min(1, mm / scaleMm));
  if (t < 0) return lerpC(HEAT_DENT, HEAT_DENT_MID, -t);
  if (t > 0) return lerpC(HEAT_BULGE_MID, HEAT_BULGE, t);
  return HEAT_NEUT;
}

export async function fetchFleet(): Promise<VesselListItem[]> {
  try {
    return await get<VesselListItem[]>("/vessels");
  } catch {
    return [];
  }
}

const FALLBACK_VESSEL_ID = "ms-neptun-baltic";

export async function fetchHeroData(vesselId = FALLBACK_VESSEL_ID): Promise<HeatData | null> {
  try {
    const detail = await get<{ scans: { id: string }[] }>(`/vessels/${vesselId}`);
    const service = detail.scans.filter((s) => !s.id.includes("baseline"));
    if (service.length < 2) return null;
    const b = service[service.length - 1];
    const a = service[service.length - 2];
    const [scanDetail, cmp] = await Promise.all([
      get<ScanDetail>(`/scans/${b.id}`),
      get<CompareResponse>(`/compare?a=${a.id}&b=${b.id}`),
    ]);

    const pc = scanDetail.pointCloud;
    if (!pc.positions || pc.positions.length < 9) return null;

    const n = pc.positions.length / 3;
    const positions = new Float32Array(n * 3);
    const normals = new Float32Array(n * 3);
    const baseColor = new Float32Array(n * 3);
    const heatColor = new Float32Array(n * 3);
    const aU = new Float32Array(n);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    let minU = Infinity, maxU = -Infinity;

    for (let i = 0; i < n; i++) {
      const x = pc.positions[i * 3];
      const y = pc.positions[i * 3 + 1];
      const z = pc.positions[i * 3 + 2];
      const u = pc.uv[i * 2];
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      normals[i * 3] = pc.normals[i * 3];
      normals[i * 3 + 1] = pc.normals[i * 3 + 1];
      normals[i * 3 + 2] = pc.normals[i * 3 + 2];
      baseColor[i * 3] = pc.baseColor[i * 3];
      baseColor[i * 3 + 1] = pc.baseColor[i * 3 + 1];
      baseColor[i * 3 + 2] = pc.baseColor[i * 3 + 2];
      aU[i] = u;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
    }

    const dev = cmp.deviationMm;
    for (let i = 0; i < n; i++) {
      const mm = dev && dev.length === n ? dev[i] : 0;
      const [r, g, bcol] = deviationToColor(mm);
      heatColor[i * 3] = r;
      heatColor[i * 3 + 1] = g;
      heatColor[i * 3 + 2] = bcol;
    }

    return {
      positions,
      normals,
      baseColor,
      heatColor,
      aU,
      indices: pc.indices,
      pointCount: n,
      center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
      radius: Math.max(1, Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2),
      minZ,
      maxZ,
      waterY: minY + (maxY - minY) * 0.32,
      beamSpan: maxX - minX,
      heightSpan: maxY - minY,
      maxAbsDeviationMm: cmp.stats.maxAbsDeviationMm,
      avgAbsDeviationMm: cmp.stats.avgAbsDeviationMm,
      surfaceChangedPct: cmp.stats.surfaceChangedPct,
      noiseFloorMm: cmp.stats.noiseThresholdMm,
      clusters: cmp.clusters.map((c) => ({
        x: c.centroid.x,
        y: c.centroid.y,
        z: c.centroid.z,
        sign: c.sign,
        suggestedType: c.suggestedType,
        peakDeviationMm: c.peakDeviationMm,
      })),
    };
  } catch {
    return null;
  }
}

/* ---------------- charts data ---------------- */

export interface TrendPoint {
  i: number;
  label: string;
  avgMm: number;
  peakMm: number;
}

export interface RegionGridData {
  rows: number;
  cols: number;
  cells: { row: number; col: number; v: number; n: number }[];
}

const HERO_VESSEL = "ms-neptun-baltic";

export async function fetchVesselScans(vesselId = HERO_VESSEL): Promise<ScanSummary[]> {
  try {
    const d = await get<VesselDetailResponse>(`/vessels/${vesselId}`);
    return d.scans.filter((s) => !s.id.includes("baseline"));
  } catch {
    return [];
  }
}

export async function fetchTrendData(vesselId = HERO_VESSEL): Promise<TrendPoint[]> {
  const scans = await fetchVesselScans(vesselId);
  return scans.map((s, i) => ({ i, label: s.label, avgMm: s.avgDeviationMm, peakMm: s.maxDeviationMm }));
}

export async function fetchRegionGrid(vesselId = HERO_VESSEL): Promise<RegionGridData | null> {
  try {
    const scans = await fetchVesselScans(vesselId);
    if (scans.length < 2) return null;
    const a = scans[scans.length - 2];
    const b = scans[scans.length - 1];
    const cmp = await get<CompareResponse>(`/compare?a=${a.id}&b=${b.id}`);
    return {
      rows: cmp.regionGrid.rows,
      cols: cmp.regionGrid.cols,
      cells: cmp.regionGrid.cells.map((c) => ({ row: c.row, col: c.col, v: c.avgDeviationMm, n: c.sampleCount })),
    };
  } catch {
    return null;
  }
}