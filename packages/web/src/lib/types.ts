// Typy odzwierciedlajace ksztalt odpowiedzi API (packages/server/src/types.ts).
// W monorepo docelowo warto je wydzielic do wspolnego pakietu; na etapie demo
// utrzymywane rownolegle, zeby web nie zalezal bezposrednio od build'u servera.

export type VesselType = "fregata" | "holownik" | "prom" | "kontenerowiec" | "jednostka-patrolowa";

export interface Vessel {
  id: string;
  name: string;
  type: VesselType;
  shipyard: string;
  homePort: string;
  imo: string;
  commissioned: string;
  lengthM: number;
  beamM: number;
}

export type ScanPhase = "budowa" | "eksploatacja";

export interface ScanSummary {
  id: string;
  vesselId: string;
  timestamp: string;
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
  positions: number[];
  normals: number[];
  baseColor: number[];
  indices: number[];
  uv: number[]; // [u0,v0, u1,v1, ...]
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
  magnitudeMm: number;
  severity: Severity;
}

export interface Defect {
  id: string;
  vesselId: string;
  type: DefectType;
  region: string;
  uv: { u: number; v: number };
  firstDetectedScanId: string;
  status: DefectStatus;
  history: DefectObservation[];
}

export interface VesselListItem {
  vessel: Vessel;
  latestScan: ScanSummary;
  scanCount: number;
  openDefectCount: number;
  worstSeverity: Severity;
  avgDeviationTrendMm: number;
}

export interface VesselDetailResponse {
  vessel: Vessel;
  scans: ScanSummary[];
  baseline: ScanSummary;
  constructionMilestones: ScanSummary[];
  defects: Defect[];
}

export interface RegionCell {
  row: number;
  col: number;
  label: string;
  avgDeviationMm: number;
  maxAbsDeviationMm: number;
  peakDeviationMm: number;
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
  pointIndices: number[];
}

export interface CompareResponse {
  scanA: ScanSummary;
  scanB: ScanSummary;
  deviationMm: number[];
  positions: number[];
  stats: {
    avgAbsDeviationMm: number;
    maxAbsDeviationMm: number;
    surfaceChangedPct: number;
    noiseThresholdMm: number;
  };
  regionGrid: { rows: number; cols: number; cells: RegionCell[] };
  clusters: AnomalyCluster[];
}

// Etykiety wyswietlane dla tych enumow zyja w lib/i18n.tsx (t.defectType /
// t.defectStatus / t.vesselType), zeby przelaczaly sie razem z jezykiem
// interfejsu. Tu zostaja tylko typy-klucze.
