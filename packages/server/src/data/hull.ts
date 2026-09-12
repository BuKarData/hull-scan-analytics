import { mulberry32, hashStringToSeed, gaussianRandom } from "./rng.js";

// Uproszczony, parametryczny model geometrii kadluba uzywany do generowania danych
// demonstracyjnych. W realnym wdrozeniu ten modul zastepuje sie wczytaniem
// rzeczywistej chmury punktow / Gaussian Splats (.ply / .splat) z aplikacji do
// skanowania - patrz docs/ARCHITECTURE.md, sekcja "Podpiecie prawdziwych danych".

export interface HullParams {
  uSteps: number; // liczba przekrojow wzdluz dlugosci kadluba
  vSteps: number; // liczba probek na obwodzie przekroju
  lengthM: number;
  beamM: number;
  depthM: number;
}

export interface HullGrid {
  positions: Float64Array; // xyz base, metry
  normals: Float64Array; // przyblizone normalne "na zewnatrz"
  params: HullParams;
}

function shapeTaper(u: number): number {
  // 0 w okolicach dziobu/rufy (u=0/1), ~1 na srodokreciu, zaciskane od dolu,
  // zeby normalne nie degenerowaly sie do zera.
  const s = Math.sin(Math.PI * u);
  return Math.max(0.06, Math.pow(s, 0.55));
}

export function pointIndex(i: number, j: number, vSteps: number): number {
  return i * vSteps + j;
}

export function buildHullGrid(params: HullParams): HullGrid {
  const { uSteps, vSteps, lengthM, beamM, depthM } = params;
  const positions = new Float64Array(uSteps * vSteps * 3);
  const normals = new Float64Array(uSteps * vSteps * 3);

  for (let i = 0; i < uSteps; i++) {
    const u = i / (uSteps - 1);
    const x = (u - 0.5) * lengthM;
    const widthScale = (beamM / 2) * shapeTaper(u);
    const heightScale = (depthM / 2) * (0.55 + 0.45 * shapeTaper(u));

    for (let j = 0; j < vSteps; j++) {
      const v = (j / vSteps) * Math.PI * 2;
      const s = Math.sin(v);
      const c = Math.cos(v);
      const vertFactor = s <= 0 ? 1 : 0.35; // pelna glebia ponizej linii wodnej, niska burta nadwodna
      const y = widthScale * c;
      const z = heightScale * s * vertFactor;

      const idx = pointIndex(i, j, vSteps) * 3;
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      let ny = c;
      let nz = s * vertFactor;
      const nlen = Math.hypot(ny, nz) || 1;
      ny /= nlen;
      nz /= nlen;
      normals[idx] = 0;
      normals[idx + 1] = ny;
      normals[idx + 2] = nz;
    }
  }

  return { positions, normals, params };
}

export interface RadialDefectSpec {
  kind: "radial";
  u: number; // 0..1 wzdluz dlugosci
  v: number; // 0..1 wokol obwodu (znormalizowane, *2*PI wewnetrznie)
  sigmaU: number;
  sigmaV: number;
  colorTint?: [number, number, number]; // dodawane do koloru bazowego w obszarze defektu
}

export interface LinearDefectSpec {
  kind: "linear"; // np. peknieciecie - wydluzony ksztalt
  u: number;
  v: number;
  angleRad: number;
  lengthUV: number; // dlugosc segmentu w polaczonej przestrzeni UV (przyblizenie)
  sigma: number; // "grubosc" pekniecia
  colorTint?: [number, number, number];
}

export type DefectSpec = RadialDefectSpec | LinearDefectSpec;

export interface ActiveDefect {
  spec: DefectSpec;
  magnitudeMm: number; // znak: ujemny = wgniecenie/ubytek, dodatni = narost
}

function angularDiff01(a: number, b: number): number {
  let d = a - b;
  d = d - Math.round(d);
  return d; // w zakresie [-0.5, 0.5], jednostki: ulamek pelnego obwodu
}

function radialFalloff(spec: RadialDefectSpec, u: number, v01: number): number {
  const du = (u - spec.u) / spec.sigmaU;
  const dv = angularDiff01(v01, spec.v) / spec.sigmaV;
  return Math.exp(-(du * du + dv * dv));
}

function linearFalloff(spec: LinearDefectSpec, u: number, v01: number): number {
  // Odleglosc punktu od segmentu zdefiniowanego w lokalnej, "rozwinietej" przestrzeni
  // UV (przyblizenie - traktujemy plaszczyzne u/v jako euklidesowa lokalnie).
  const du = u - spec.u;
  const dv = angularDiff01(v01, spec.v);
  const cos = Math.cos(spec.angleRad);
  const sin = Math.sin(spec.angleRad);
  // rzut na os wzdluz pekniecia i prostopadle do niego
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
  baseColor: Float64Array; // rgb 0..1
  deviationMm: Float64Array; // per-punkt, wzgledem geometrii bazowej (przed zaszumieniem)
}

const HULL_STEEL_COLOR: [number, number, number] = [0.55, 0.58, 0.61];

export function deformHull(
  grid: HullGrid,
  activeDefects: ActiveDefect[],
  scanId: string,
  scanNoiseMm = 0.6
): DeformedScan {
  const { uSteps, vSteps } = grid.params;
  const n = uSteps * vSteps;
  const positions = new Float64Array(n * 3);
  const baseColor = new Float64Array(n * 3);
  const deviationMm = new Float64Array(n);
  const rand = mulberry32(hashStringToSeed(scanId));

  for (let i = 0; i < uSteps; i++) {
    const u = i / (uSteps - 1);
    for (let j = 0; j < vSteps; j++) {
      const v01 = j / vSteps;
      const idx = pointIndex(i, j, vSteps);
      const idx3 = idx * 3;

      let deviation = gaussianRandom(rand, 0, scanNoiseMm * 0.35); // szum skanu/rekonstrukcji
      let r = HULL_STEEL_COLOR[0];
      let g = HULL_STEEL_COLOR[1];
      let b = HULL_STEEL_COLOR[2];

      for (const def of activeDefects) {
        const w =
          def.spec.kind === "radial"
            ? radialFalloff(def.spec, u, v01)
            : linearFalloff(def.spec, u, v01);
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

      deviationMm[idx] = deviation;
      const dMeters = deviation / 1000;
      positions[idx3] = grid.positions[idx3] + grid.normals[idx3] * dMeters;
      positions[idx3 + 1] = grid.positions[idx3 + 1] + grid.normals[idx3 + 1] * dMeters;
      positions[idx3 + 2] = grid.positions[idx3 + 2] + grid.normals[idx3 + 2] * dMeters;

      baseColor[idx3] = Math.min(1, Math.max(0, r));
      baseColor[idx3 + 1] = Math.min(1, Math.max(0, g));
      baseColor[idx3 + 2] = Math.min(1, Math.max(0, b));
    }
  }

  return { positions, baseColor, deviationMm };
}
