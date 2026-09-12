// Minimalny parser plikow .ply generowanych przez potoki Gaussian Splatting
// (COLMAP + Brush / gsplat / Inria 3DGS). Obsluguje formaty "ascii" oraz
// "binary_little_endian" / "binary_big_endian", element "vertex" z typowymi
// wlasciwosciami:
//   x, y, z                    - pozycja srodka gaussianu (zawsze wymagane)
//   red, green, blue           - jawny kolor (uchar 0..255), jesli obecny
//   f_dc_0, f_dc_1, f_dc_2      - wspolczynnik DC harmonik sferycznych (kolor
//                                 posredni, standard 3D Gaussian Splatting)
//   opacity                    - nieprzepuszczalnosc gaussianu (logit, przed
//                                 sigmoidem - zgodnie z konwencja 3DGS)
//
// Nie interpretujemy scale_*/rot_*/f_rest_* (wyzsze rzedy SH) - do porownania
// geometrii kadluba wystarcza pozycja, kolor i opacity uzywane do odrzucenia
// szumu (patrz filterByOpacity nizej). Pelne wykorzystanie elipsoid gaussianow
// (zamiast punktow) to naturalny nastepny krok, opisany w docs/ARCHITECTURE.md.

const SH_C0 = 0.28209479177387814;

type PropType = "float" | "double" | "uchar" | "int" | "short" | "uint" | "ushort";

interface PropertyDef {
  name: string;
  type: PropType;
}

interface PlyHeader {
  format: "ascii" | "binary_little_endian" | "binary_big_endian";
  vertexCount: number;
  properties: PropertyDef[];
  headerLength: number; // bajty do konca "end_header\n"
}

const TYPE_ALIASES: Record<string, PropType> = {
  float: "float",
  float32: "float",
  double: "double",
  float64: "double",
  uchar: "uchar",
  uint8: "uchar",
  char: "uchar",
  int8: "uchar",
  int: "int",
  int32: "int",
  uint: "uint",
  uint32: "uint",
  short: "short",
  int16: "short",
  ushort: "ushort",
  uint16: "ushort",
};

const TYPE_SIZE: Record<PropType, number> = {
  float: 4,
  double: 8,
  uchar: 1,
  int: 4,
  short: 2,
  uint: 4,
  ushort: 2,
};

function parseHeader(buf: Buffer): PlyHeader {
  const marker = "end_header\n";
  const headerEnd = buf.indexOf(marker, 0, "ascii");
  if (headerEnd === -1) throw new Error("Nieprawidlowy plik .ply: brak end_header");
  const headerText = buf.toString("ascii", 0, headerEnd);
  const lines = headerText.split("\n").map((l) => l.trim());

  if (lines[0] !== "ply") throw new Error("Nieprawidlowy plik .ply: brak sygnatury 'ply'");

  let format: PlyHeader["format"] | null = null;
  let vertexCount = 0;
  let inVertexElement = false;
  const properties: PropertyDef[] = [];

  for (const line of lines) {
    if (line.startsWith("format ")) {
      const f = line.split(/\s+/)[1];
      if (f === "ascii" || f === "binary_little_endian" || f === "binary_big_endian") format = f;
    } else if (line.startsWith("element ")) {
      const [, name, countStr] = line.split(/\s+/);
      inVertexElement = name === "vertex";
      if (inVertexElement) vertexCount = parseInt(countStr, 10);
    } else if (line.startsWith("property ") && inVertexElement) {
      const parts = line.split(/\s+/);
      if (parts[1] === "list") continue; // pomijamy ewentualne listy w elemencie vertex
      const type = TYPE_ALIASES[parts[1]];
      if (!type) throw new Error(`Nieobslugiwany typ wlasciwosci .ply: ${parts[1]}`);
      properties.push({ name: parts[2], type });
    }
  }

  if (!format) throw new Error("Nieprawidlowy plik .ply: brak formatu");
  return { format, vertexCount, properties, headerLength: headerEnd + marker.length };
}

export interface ParsedPly {
  count: number;
  positions: Float64Array; // xyz, metry (jednostki takie, w jakich wyeksportowano model)
  colors: Float64Array; // rgb 0..1
  opacity: Float64Array; // 0..1
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function parsePly(buf: Buffer): ParsedPly {
  const header = parseHeader(buf);
  const { properties, vertexCount, format } = header;

  const idx = (name: string) => properties.findIndex((p) => p.name === name);
  const xi = idx("x"), yi = idx("y"), zi = idx("z");
  if (xi === -1 || yi === -1 || zi === -1) throw new Error("Plik .ply nie zawiera wspolrzednych x/y/z");

  const ri = idx("red"), gi = idx("green"), bi = idx("blue");
  const dc0 = idx("f_dc_0"), dc1 = idx("f_dc_1"), dc2 = idx("f_dc_2");
  const oi = idx("opacity");

  const positions = new Float64Array(vertexCount * 3);
  const colors = new Float64Array(vertexCount * 3).fill(0.6);
  const opacity = new Float64Array(vertexCount).fill(1);

  if (format === "ascii") {
    const body = buf.toString("ascii", header.headerLength);
    const lines = body.split("\n").filter((l) => l.trim().length > 0);
    for (let v = 0; v < vertexCount; v++) {
      const values = lines[v].trim().split(/\s+/).map(Number);
      positions[v * 3] = values[xi];
      positions[v * 3 + 1] = values[yi];
      positions[v * 3 + 2] = values[zi];
      applyColorAndOpacity(v, values, { ri, gi, bi, dc0, dc1, dc2, oi }, colors, opacity);
    }
    return { count: vertexCount, positions, colors, opacity };
  }

  const little = format === "binary_little_endian";
  const stride = properties.reduce((sum, p) => sum + TYPE_SIZE[p.type], 0);
  const view = new DataView(buf.buffer, buf.byteOffset + header.headerLength, vertexCount * stride);

  const readers: ((offset: number) => number)[] = properties.map((p) => {
    switch (p.type) {
      case "float":
        return (o) => view.getFloat32(o, little);
      case "double":
        return (o) => view.getFloat64(o, little);
      case "uchar":
        return (o) => view.getUint8(o);
      case "int":
        return (o) => view.getInt32(o, little);
      case "uint":
        return (o) => view.getUint32(o, little);
      case "short":
        return (o) => view.getInt16(o, little);
      case "ushort":
        return (o) => view.getUint16(o, little);
    }
  });
  const offsets: number[] = [];
  {
    let acc = 0;
    for (const p of properties) {
      offsets.push(acc);
      acc += TYPE_SIZE[p.type];
    }
  }

  const values = new Array<number>(properties.length);
  for (let v = 0; v < vertexCount; v++) {
    const base = v * stride;
    for (let p = 0; p < properties.length; p++) values[p] = readers[p](base + offsets[p]);
    positions[v * 3] = values[xi];
    positions[v * 3 + 1] = values[yi];
    positions[v * 3 + 2] = values[zi];
    applyColorAndOpacity(v, values, { ri, gi, bi, dc0, dc1, dc2, oi }, colors, opacity);
  }

  return { count: vertexCount, positions, colors, opacity };
}

function applyColorAndOpacity(
  v: number,
  values: number[],
  idx: { ri: number; gi: number; bi: number; dc0: number; dc1: number; dc2: number; oi: number },
  colors: Float64Array,
  opacity: Float64Array
) {
  if (idx.ri !== -1 && idx.gi !== -1 && idx.bi !== -1) {
    colors[v * 3] = values[idx.ri] / 255;
    colors[v * 3 + 1] = values[idx.gi] / 255;
    colors[v * 3 + 2] = values[idx.bi] / 255;
  } else if (idx.dc0 !== -1 && idx.dc1 !== -1 && idx.dc2 !== -1) {
    colors[v * 3] = Math.min(1, Math.max(0, 0.5 + SH_C0 * values[idx.dc0]));
    colors[v * 3 + 1] = Math.min(1, Math.max(0, 0.5 + SH_C0 * values[idx.dc1]));
    colors[v * 3 + 2] = Math.min(1, Math.max(0, 0.5 + SH_C0 * values[idx.dc2]));
  }
  if (idx.oi !== -1) opacity[v] = sigmoid(values[idx.oi]);
}

/** Odrzuca gaussiany o niskiej nieprzepuszczalnosci - typowo szum rekonstrukcji,
 *  ktory zaburzalby wyszukiwanie najblizszego sasiada przy porownywaniu skanow. */
export function filterByOpacity(ply: ParsedPly, minOpacity = 0.15): ParsedPly {
  const keep: number[] = [];
  for (let i = 0; i < ply.count; i++) if (ply.opacity[i] >= minOpacity) keep.push(i);

  const positions = new Float64Array(keep.length * 3);
  const colors = new Float64Array(keep.length * 3);
  const opacity = new Float64Array(keep.length);
  keep.forEach((srcIdx, dstIdx) => {
    positions.set(ply.positions.subarray(srcIdx * 3, srcIdx * 3 + 3), dstIdx * 3);
    colors.set(ply.colors.subarray(srcIdx * 3, srcIdx * 3 + 3), dstIdx * 3);
    opacity[dstIdx] = ply.opacity[srcIdx];
  });
  return { count: keep.length, positions, colors, opacity };
}
