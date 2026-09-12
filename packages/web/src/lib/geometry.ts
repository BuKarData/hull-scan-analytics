import type { Defect } from "./types";

/**
 * Stale, wbudowane wzmocnienie wizualne odksztalcen kadluba (nie suwak dla
 * uzytkownika) - stosowane jednolicie wszedzie tam, gdzie renderujemy
 * geometrie skanu, zeby "Historia w 3D" i "Porownaj" pokazywaly uszkodzenia
 * w ten sam, spojny sposob. Wartosci w mm w statystykach pozostaja
 * rzeczywiste - to czysto wizualne przeskalowanie geometrii do wyswietlenia.
 */
export const VISUAL_DEFORMATION_SCALE = 35;

/**
 * Staly (nie per-porownanie) zakres kolorow dla danej jednostki - liczony z
 * najgorszego zanotowanego kiedykolwiek odchylenia szczytowego. Dzieki temu
 * kolor na modelu faktycznie "narasta" z kolejnymi przegladami (widac trend
 * pogarszania sie stanu), zamiast kazdorazowo rozciagac sie od nowa do pelnej
 * skali (co maskowaloby postep w czasie).
 */
export function vesselDeviationDomain(scans: { maxDeviationMm: number }[]): number {
  return Math.max(2, ...scans.map((s) => s.maxDeviationMm));
}

export function girthSectorIndex(v01: number): number {
  const deg = ((v01 % 1) + 1) % 1;
  if (deg < 0.125 || deg >= 0.875) return 0;
  if (deg < 0.375) return 1;
  if (deg < 0.625) return 2;
  return 3;
}

export function regionLabelFromUV(u: number, v: number, lengthBands: readonly string[], girthSectorsLower: readonly string[]): string {
  const row = Math.min(lengthBands.length - 1, Math.floor(u * lengthBands.length));
  const col = girthSectorIndex(v);
  return `${lengthBands[row]}, ${girthSectorsLower[col]}`;
}

function angularDiff01(a: number, b: number): number {
  let d = a - b;
  d = d - Math.round(d);
  return d;
}

export function findNearestDefect(u: number, v: number, defects: Defect[], maxDist = 0.1): Defect | null {
  let best: Defect | null = null;
  let bestDist = Infinity;
  for (const d of defects) {
    const du = d.uv.u - u;
    const dv = angularDiff01(d.uv.v, v);
    const dist = Math.hypot(du, dv);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return bestDist <= maxDist ? best : null;
}

/**
 * Realne wgniecenia/korozja maja skale milimetrow na kadlubie dlugosci
 * dziesiatek-setek metrow - w prawdziwej skali sa wizualnie niewidoczne
 * (to wlasnie dlatego istnieje heatmapa). Do celow pogladowych "surowego"
 * widoku 3D wzmacniamy WYSWIETLANE odksztalcenie wzgledem geometrii
 * referencyjnej, zachowujac kierunek (normalna) - liczby w mm pokazywane
 * gdzie indziej w UI pozostaja rzeczywiste, tylko rysunek jest przesadzony
 * (jak "deformation scale" w narzedziach FEA).
 */
export function exaggerateAgainstBase(positions: number[], basePositions: number[], factor: number): number[] {
  if (factor === 1 || positions.length !== basePositions.length) return positions;
  const out = new Array<number>(positions.length);
  for (let i = 0; i < positions.length; i++) {
    out[i] = basePositions[i] + (positions[i] - basePositions[i]) * factor;
  }
  return out;
}

/** Jak wyzej, ale gdy odksztalcenie jest juz znane per-wierzcholek (mm) i ma
 *  byc dolozone wzdluz normalnej - uzywane tam, gdzie mamy `deviationMm`
 *  (np. wynik /api/compare) zamiast osobnej geometrii referencyjnej. */
export function exaggerateByDeviation(positions: number[], normals: number[], deviationMm: number[], factor: number): number[] {
  if (factor === 1) return positions;
  const out = new Array<number>(positions.length);
  for (let i = 0; i < deviationMm.length; i++) {
    const extraM = (deviationMm[i] / 1000) * (factor - 1);
    out[i * 3] = positions[i * 3] + normals[i * 3] * extraM;
    out[i * 3 + 1] = positions[i * 3 + 1] + normals[i * 3 + 1] * extraM;
    out[i * 3 + 2] = positions[i * 3 + 2] + normals[i * 3 + 2] * extraM;
  }
  return out;
}
