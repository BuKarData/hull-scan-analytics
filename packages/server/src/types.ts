// Domyslne typy domenowe. Sekcja "future work" w docs/ARCHITECTURE.md opisuje,
// jak te struktury mapuja sie na realne dane z aplikacji do skanowania (Gaussian
// Splatting, pliki .ply / .splat) gdy zostanie podpiete prawdziwe API.

export type VesselType =
  | "fregata"
  | "holownik"
  | "prom"
  | "kontenerowiec"
  | "jednostka-patrolowa";

export interface Vessel {
  id: string;
  name: string;
  type: VesselType;
  shipyard: string;
  homePort: string;
  imo: string;
  commissioned: string; // ISO date
  lengthM: number;
  beamM: number;
}

export type ScanPhase = "budowa" | "eksploatacja";

export interface ScanSummary {
  id: string;
  vesselId: string;
  timestamp: string; // ISO date
  label: string;
  description?: string;
  phase: ScanPhase;
  technician: string;
  pointCount: number;
  avgDeviationMm: number;
  maxDeviationMm: number;
  openDefectCount: number;
  surfaceChangedPct: number;
}

export interface PointCloud {
  // Flat Float32-friendly arrays (serialized as number[] over JSON for the demo).
  // A production integration would stream binary .ply/.splat buffers instead.
  positions: number[]; // [x0,y0,z0, x1,y1,z1, ...] meters, hull-local frame
  normals: number[]; // outward local normals, same layout as positions
  baseColor: number[]; // [r,g,b, ...] 0..1, raw scan appearance
  grid: { uSteps: number; vSteps: number }; // structured (u,v) parametrization
}

export interface ScanDetail extends ScanSummary {
  pointCloud: PointCloud;
}

export type DefectType = "wgniecenie" | "korozja" | "peknieciecie" | "ubytek-powloki" | "porost-biologiczny";
export type DefectStatus = "nowa" | "narasta" | "stabilna" | "naprawiona";
export type Severity = "good" | "warning" | "serious" | "critical";

export interface DefectObservation {
  scanId: string;
  timestamp: string;
  magnitudeMm: number; // signed: negative = wgniecenie do wewnatrz, positive = narost/korozja
  severity: Severity;
}

export interface Defect {
  id: string;
  vesselId: string;
  type: DefectType;
  region: string; // human-readable hull region, e.g. "Burta lewa, sekcja 3"
  uv: { u: number; v: number }; // normalized location on hull parametrization
  firstDetectedScanId: string;
  status: DefectStatus;
  history: DefectObservation[];
}

export interface RegionCell {
  row: number;
  col: number;
  label: string;
  avgDeviationMm: number;
  maxAbsDeviationMm: number;
  sampleCount: number;
}

export interface AnomalyCluster {
  id: string;
  centroidUV: { u: number; v: number };
  centroid: { x: number; y: number; z: number };
  peakDeviationMm: number;
  meanDeviationMm: number;
  areaPointCount: number;
  sign: "bulge" | "dent";
  suggestedType: DefectType;
  matchedDefectId: string | null;
}

export interface CompareResult {
  scanA: ScanSummary;
  scanB: ScanSummary;
  deviationMm: number[]; // per-point signed deviation, aligned to scanB point order
  positions: number[]; // scanB positions, for rendering the heatmap point cloud
  stats: {
    avgAbsDeviationMm: number;
    maxAbsDeviationMm: number;
    surfaceChangedPct: number; // % of points beyond noise threshold
    noiseThresholdMm: number;
  };
  regionGrid: {
    rows: number;
    cols: number;
    cells: RegionCell[];
  };
  clusters: AnomalyCluster[];
}
