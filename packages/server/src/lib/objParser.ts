// Minimalny parser plikow Wavefront .obj - obsluguje dokladnie to, czego
// potrzebujemy do wczytania kadluba jako indeksowanej siatki trojkatow:
// linie "v x y z" (ignorujemy ewentualny kolor doklejony przez Blendera),
// "vn x y z" oraz trojkatne "f v/vt/vn v/vt/vn v/vt/vn". OBJ trzyma pozycje
// i normalne w osobnych przestrzeniach indeksow - "rozwijamy" je do jednej
// spojnej siatki (kazda unikalna para pozycja+normalna dostaje wlasny,
// nowy indeks), tak jak wymaga tego WebGL/three.js.

export interface ParsedMesh {
  positions: Float64Array; // x,y,z (metry w skali modelu zrodlowego)
  normals: Float64Array; // znormalizowane wektory normalnych, ten sam uklad co positions
  indices: Uint32Array; // trojki indeksow wierzcholkow (trojkaty)
}

export function parseObj(text: string): ParsedMesh {
  const rawPositions: [number, number, number][] = [];
  const rawNormals: [number, number, number][] = [];

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const dedup = new Map<string, number>();

  function vertexIndex(posIdx: number, normIdx: number): number {
    const key = `${posIdx}/${normIdx}`;
    const existing = dedup.get(key);
    if (existing !== undefined) return existing;

    const p = rawPositions[posIdx];
    const n = rawNormals[normIdx] ?? [0, 1, 0];
    const idx = positions.length / 3;
    positions.push(p[0], p[1], p[2]);
    normals.push(n[0], n[1], n[2]);
    dedup.set(key, idx);
    return idx;
  }

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("v ")) {
      const parts = line.split(/\s+/);
      rawPositions.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
    } else if (line.startsWith("vn ")) {
      const parts = line.split(/\s+/);
      rawNormals.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
    } else if (line.startsWith("f ")) {
      const parts = line.split(/\s+/).slice(1);
      if (parts.length !== 3) throw new Error(`Obslugiwane sa tylko trojkaty w .obj (linia: "${line}")`);
      const faceIdx = parts.map((p) => {
        const [vStr, , vnStr] = p.split("/");
        const vIdx = parseInt(vStr, 10) - 1; // OBJ jest 1-indeksowany
        const vnIdx = vnStr ? parseInt(vnStr, 10) - 1 : -1;
        return vertexIndex(vIdx, vnIdx);
      });
      indices.push(faceIdx[0], faceIdx[1], faceIdx[2]);
    }
  }

  return {
    positions: new Float64Array(positions),
    normals: new Float64Array(normals),
    indices: new Uint32Array(indices),
  };
}
