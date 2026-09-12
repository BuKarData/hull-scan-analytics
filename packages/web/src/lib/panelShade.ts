// Port 1:1 tego samego wzoru co packages/server/src/data/shipModel.ts (panelSeamShade)
// - te same stale (HULL_SECTION_COUNT/HULL_STRAKE_COUNT) i ten sam hash, zeby
// "surowy" wyglad skanu i kolorowanie heatmapy pokazywaly IDENTYCZNY wzor
// plyt/szwow zamiast dwoch niespojnych tekstur. Web i server sa osobnymi
// pakietami (patrz uwaga w lib/types.ts) - stad duplikacja zamiast importu.

const HULL_SECTION_COUNT = 8;
const HULL_STRAKE_COUNT = 14;

function distToGrid01(x: number, divisions: number): number {
  const t = ((x % 1) + 1) % 1;
  const cell = t * divisions;
  const frac = cell - Math.floor(cell);
  return Math.min(frac, 1 - frac);
}

function hash01(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967295;
}

/** Mnożnik jasności (seam + per-plate tint) - patrz odpowiednik serwerowy dla
 *  pełnego uzasadnienia. Uzywany tez tam, gdzie kolor punktu pochodzi z
 *  odchylenia (heatmapa), zeby struktura plyt byla widoczna WSZĘDZIE, nie
 *  tylko na "surowym" widoku skanu - inaczej domyslny widok (ktory najczesciej
 *  jest w trybie heatmapy) i tak wygladalby jednolicie szaro. */
export function panelSeamShade(u: number, v: number): number {
  const SEAM_HALF_WIDTH = 0.01;
  const SEAM_DEPTH = 0.45;
  const dU = distToGrid01(u, HULL_SECTION_COUNT);
  const dV = distToGrid01(v, HULL_STRAKE_COUNT);
  const d = Math.min(dU, dV);
  const seam = d >= SEAM_HALF_WIDTH ? 1 : 1 - SEAM_DEPTH * (1 - d / SEAM_HALF_WIDTH);

  const uCell = Math.min(HULL_SECTION_COUNT - 1, Math.floor((((u % 1) + 1) % 1) * HULL_SECTION_COUNT));
  const vCell = Math.min(HULL_STRAKE_COUNT - 1, Math.floor((((v % 1) + 1) % 1) * HULL_STRAKE_COUNT));
  const plateTint = 0.88 + hash01(uCell, vCell) * 0.24;

  return seam * plateTint;
}
