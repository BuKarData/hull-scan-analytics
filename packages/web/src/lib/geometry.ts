import type { Defect } from "./types";

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
