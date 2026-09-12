import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseObj } from "../lib/objParser.js";
import { mulberry32, hashStringToSeed, gaussianRandom } from "./rng.js";

// Prawdziwa geometria kadluba (siatka trojkatow wczytana z pliku .obj -
// CC0, Kenney "Watercraft Kit", patrz assets/ships/LICENSE.txt) zamiast
// uproszczonej bryly parametrycznej. Model jest przeskalowywany do
// rzeczywistych wymiarow (dlugosc/szerokosc/wysokosc) konkretnej jednostki,
// a kazdemu wierzcholkowi przypisujemy wspolrzedne (u,v) w tej samej
// konwencji co poprzednio (u: rufa->dziob, v: burta prawa->poklad->burta
// lewa->dno), zeby cala reszta pipeline'u (rozklad usterek, agregacja
// regionowa, wykrywanie skupisk) dzialala bez zmian koncepcyjnych.
//
// W odroznieniu od poprzedniej siatki parametrycznej, ta siatka NIE ma
// struktury (i,j) - sasiedztwo miedzy wierzcholkami pochodzi z faktycznej
// topologii trojkatow modelu (patrz `adjacency`). To dokladnie ten sam
// problem, jaki trzeba rozwiazac dla prawdziwych, niezależnych rekonstrukcji
// Gaussian Splatting (brak wspolnej siatki) - patrz docs/ARCHITECTURE.md.

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, "..", "..", "assets", "ships");

export type ShipModelKind = "frigate" | "tug" | "ferry" | "patrol" | "container";

export interface ShipModel {
  vertexCount: number;
  positions: Float64Array; // geometria bazowa (bez odksztalcen), metry
  normals: Float64Array;
  indices: Uint32Array; // trojkaty
  u: Float64Array; // 0..1 dlugosc (rufa -> dziob), per wierzcholek
  v: Float64Array; // 0..1 obwod (burta prawa=0, poklad=0.25, burta lewa=0.5, dno=0.75), per wierzcholek
  adjacency: Uint32Array[]; // sasiedzi z topologii trojkatow, per wierzcholek
}

function buildAdjacency(vertexCount: number, indices: Uint32Array): Uint32Array[] {
  const sets: Set<number>[] = Array.from({ length: vertexCount }, () => new Set<number>());
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t], b = indices[t + 1], c = indices[t + 2];
    sets[a].add(b); sets[a].add(c);
    sets[b].add(a); sets[b].add(c);
    sets[c].add(a); sets[c].add(b);
  }
  return sets.map((s) => Uint32Array.from(s));
}

const cache = new Map<ShipModelKind, ShipModel>();

export function loadShipModel(kind: ShipModelKind, targetLengthM: number, targetBeamM: number, targetDepthM: number): ShipModel {
  const cacheKey = kind; // geometria bazowa (przed skalowaniem) jest wspolna - skalujemy przy kazdym uzyciu
  let base = cache.get(cacheKey);
  if (!base) {
    const text = readFileSync(join(ASSETS_DIR, `${kind}.obj`), "utf8");
    const mesh = parseObj(text);
    base = {
      vertexCount: mesh.positions.length / 3,
      positions: mesh.positions,
      normals: mesh.normals,
      indices: mesh.indices,
      u: new Float64Array(0),
      v: new Float64Array(0),
      adjacency: [],
    };
    cache.set(cacheKey, base);
  }

  return scaleModel(base, targetLengthM, targetBeamM, targetDepthM);
}

/**
 * Modele Kenney sa autorskie w konwencji Y-up, Z = dlugosc (potwierdzone przez
 * bounding box: najwiekszy zasieg zawsze na Z), X = szerokosc (symetryczny
 * wzgledem 0), Y = wysokosc (od 0 przy stepce w gore).
 */
function scaleModel(base: ShipModel, lengthM: number, beamM: number, depthM: number): ShipModel {
  const n = base.vertexCount;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < n; i++) {
    const x = base.positions[i * 3], y = base.positions[i * 3 + 1], z = base.positions[i * 3 + 2];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const sx = beamM / Math.max(1e-6, maxX - minX);
  const sy = depthM / Math.max(1e-6, maxY - minY);
  const sz = lengthM / Math.max(1e-6, maxZ - minZ);
  const cx = (minX + maxX) / 2;

  const positions = new Float64Array(n * 3);
  const normals = new Float64Array(n * 3);
  const u = new Float64Array(n);
  const v = new Float64Array(n);

  const halfBeam = beamM / 2;
  const halfDepth = depthM / 2;
  const cy = halfDepth; // przyblizona "os" kadluba do liczenia kata obwodowego

  for (let i = 0; i < n; i++) {
    const x = (base.positions[i * 3] - cx) * sx;
    const y = (base.positions[i * 3 + 1] - minY) * sy;
    const z = (base.positions[i * 3 + 2] - minZ) * sz;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Normalne: skalowanie nierownomierne wymaga transformacji przez odwrotnosc
    // transponowanej macierzy skali - dla macierzy diagonalnej to po prostu
    // podzielenie przez wspolczynniki skali (zamiast pomnozenia).
    let nx = base.normals[i * 3] / sx;
    let ny = base.normals[i * 3 + 1] / sy;
    let nz = base.normals[i * 3 + 2] / sz;
    const nlen = Math.hypot(nx, ny, nz) || 1;
    nx /= nlen; ny /= nlen; nz /= nlen;
    normals[i * 3] = nx;
    normals[i * 3 + 1] = ny;
    normals[i * 3 + 2] = nz;

    u[i] = z / lengthM;
    const angle = Math.atan2((y - cy) / halfDepth, x / halfBeam);
    v[i] = (angle / (Math.PI * 2) + 1) % 1;
  }

  const adjacency = buildAdjacency(n, base.indices);

  return { vertexCount: n, positions, normals, indices: base.indices, u, v, adjacency };
}

export interface RadialDefectSpec {
  kind: "radial";
  u: number;
  v: number;
  sigmaU: number;
  sigmaV: number;
  colorTint?: [number, number, number];
}

export interface LinearDefectSpec {
  kind: "linear";
  u: number;
  v: number;
  angleRad: number;
  lengthUV: number;
  sigma: number;
  colorTint?: [number, number, number];
}

export type DefectSpec = RadialDefectSpec | LinearDefectSpec;

export interface ActiveDefect {
  spec: DefectSpec;
  magnitudeMm: number;
}

function angularDiff01(a: number, b: number): number {
  let d = a - b;
  d = d - Math.round(d);
  return d;
}

function radialFalloff(spec: RadialDefectSpec, u: number, v01: number): number {
  const du = (u - spec.u) / spec.sigmaU;
  const dv = angularDiff01(v01, spec.v) / spec.sigmaV;
  return Math.exp(-(du * du + dv * dv));
}

function linearFalloff(spec: LinearDefectSpec, u: number, v01: number): number {
  const du = u - spec.u;
  const dv = angularDiff01(v01, spec.v);
  const cos = Math.cos(spec.angleRad);
  const sin = Math.sin(spec.angleRad);
  const along = du * cos + dv * sin;
  const across = -du * sin + dv * cos;
  const halfLen = spec.lengthUV / 2;
  const clampedAlong = Math.max(-halfLen, Math.min(halfLen, along));
  const distAlong = along - clampedAlong;
  const dist2 = distAlong * distAlong + across * across;
  return Math.exp(-dist2 / (spec.sigma * spec.sigma));
}

export interface DeformedScan {
  positions: Float64Array;
  baseColor: Float64Array;
  deviationMm: Float64Array;
}

const HULL_STEEL_COLOR: [number, number, number] = [0.55, 0.58, 0.61];

export function deformShipModel(model: ShipModel, activeDefects: ActiveDefect[], scanId: string, scanNoiseMm = 0.6): DeformedScan {
  const n = model.vertexCount;
  const positions = new Float64Array(n * 3);
  const baseColor = new Float64Array(n * 3);
  const deviationMm = new Float64Array(n);
  const rand = mulberry32(hashStringToSeed(scanId));

  for (let i = 0; i < n; i++) {
    const u = model.u[i];
    const v01 = model.v[i];

    let deviation = gaussianRandom(rand, 0, scanNoiseMm * 0.35);
    let r = HULL_STEEL_COLOR[0];
    let g = HULL_STEEL_COLOR[1];
    let b = HULL_STEEL_COLOR[2];

    for (const def of activeDefects) {
      const w = def.spec.kind === "radial" ? radialFalloff(def.spec, u, v01) : linearFalloff(def.spec, u, v01);
      if (w > 0.01) {
        deviation += def.magnitudeMm * w;
        const tint = def.spec.colorTint;
        if (tint) {
          r += tint[0] * w;
          g += tint[1] * w;
          b += tint[2] * w;
        }
      }
    }

    deviationMm[i] = deviation;
    const dMeters = deviation / 1000;
    positions[i * 3] = model.positions[i * 3] + model.normals[i * 3] * dMeters;
    positions[i * 3 + 1] = model.positions[i * 3 + 1] + model.normals[i * 3 + 1] * dMeters;
    positions[i * 3 + 2] = model.positions[i * 3 + 2] + model.normals[i * 3 + 2] * dMeters;

    baseColor[i * 3] = Math.min(1, Math.max(0, r));
    baseColor[i * 3 + 1] = Math.min(1, Math.max(0, g));
    baseColor[i * 3 + 2] = Math.min(1, Math.max(0, b));
  }

  return { positions, baseColor, deviationMm };
}

const RAW_STEEL_COLOR: [number, number, number] = [0.42, 0.41, 0.39];

export interface ConstructionSnapshot {
  positions: Float64Array;
  normals: Float64Array;
  baseColor: Float64Array;
  indices: Uint32Array;
  pointCount: number;
}

/**
 * Migawka etapu budowy: tylko wierzcholki "juz zbudowane" do danego postepu
 * (0..1 wzdluz dlugosci, od rufy w strone dziobu) i tylko trojkaty, ktorych
 * wszystkie 3 wierzcholki juz istnieja. Indeksy sa przemapowywane na zwarty
 * zakres 0..k-1 (nie da sie tu po prostu wziac przedrostka tablicy jak przy
 * siatce parametrycznej, bo kolejnosc wierzcholkow w pliku .obj nie jest
 * uporzadkowana wedlug dlugosci kadluba).
 */
export function buildConstructionSnapshot(model: ShipModel, progress: number): ConstructionSnapshot {
  const keepNewIndex = new Int32Array(model.vertexCount).fill(-1);
  const positions: number[] = [];
  const normals: number[] = [];
  const baseColor: number[] = [];
  let count = 0;

  for (let i = 0; i < model.vertexCount; i++) {
    if (model.u[i] > progress) continue;
    keepNewIndex[i] = count++;
    positions.push(model.positions[i * 3], model.positions[i * 3 + 1], model.positions[i * 3 + 2]);
    normals.push(model.normals[i * 3], model.normals[i * 3 + 1], model.normals[i * 3 + 2]);
    baseColor.push(RAW_STEEL_COLOR[0], RAW_STEEL_COLOR[1], RAW_STEEL_COLOR[2]);
  }

  const indices: number[] = [];
  for (let t = 0; t < model.indices.length; t += 3) {
    const a = keepNewIndex[model.indices[t]];
    const b = keepNewIndex[model.indices[t + 1]];
    const c = keepNewIndex[model.indices[t + 2]];
    if (a === -1 || b === -1 || c === -1) continue;
    indices.push(a, b, c);
  }

  return {
    positions: new Float64Array(positions),
    normals: new Float64Array(normals),
    baseColor: new Float64Array(baseColor),
    indices: new Uint32Array(indices),
    pointCount: count,
  };
}
