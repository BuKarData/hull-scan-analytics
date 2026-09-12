// Prosty indeks przestrzenny (uniform grid hashing) do wyszukiwania najblizszego
// sasiada miedzy dwiema chmurami punktow. Realne skany Gaussian Splatting nie maja
// odpowiadajacych sobie indeksow punktow (rozne rekonstrukcje = rozna liczba i
// kolejnosc gaussianow), wiec porownanie wymaga wyszukiwania NN w przestrzeni 3D,
// a nie prostego odejmowania "punkt po punkcie". Dla duzych chmur (setki tysiecy
// gaussianow) produkcyjna wersja powinna uzyc k-d drzewa / octree i wczesniejszego
// voxel-downsamplingu; ten uniform grid wystarcza dla skali demo i jest O(n) sr.

export class UniformGridIndex {
  private cellSize: number;
  private buckets = new Map<string, number[]>();
  private positions: Float64Array;

  constructor(positions: Float64Array, cellSize: number) {
    this.positions = positions;
    this.cellSize = cellSize;
    const n = positions.length / 3;
    for (let i = 0; i < n; i++) {
      const key = this.cellKey(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      const arr = this.buckets.get(key);
      if (arr) arr.push(i);
      else this.buckets.set(key, [i]);
    }
  }

  private cellKey(x: number, y: number, z: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx}|${cy}|${cz}`;
  }

  nearest(x: number, y: number, z: number): { index: number; distSq: number } {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);

    let best = -1;
    let bestDistSq = Infinity;

    // Rozszerzamy promien wyszukiwania w pierscieniach (zaczynajac od wlasnej
    // komorki, radius=0), dopoki nie znajdziemy kandydata i nie mamy pewnosci,
    // ze dalsze pierscienie nie daloby blizszego punktu.
    for (let radius = 0; radius <= 6; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dz = -radius; dz <= radius; dz++) {
            if (Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) !== radius) continue;
            const key = `${cx + dx}|${cy + dy}|${cz + dz}`;
            const bucket = this.buckets.get(key);
            if (!bucket) continue;
            for (const idx of bucket) {
              const px = this.positions[idx * 3];
              const py = this.positions[idx * 3 + 1];
              const pz = this.positions[idx * 3 + 2];
              const dSq = (px - x) ** 2 + (py - y) ** 2 + (pz - z) ** 2;
              if (dSq < bestDistSq) {
                bestDistSq = dSq;
                best = idx;
              }
            }
          }
        }
      }
      if (best !== -1 && bestDistSq <= (radius * this.cellSize) ** 2) break;
    }

    if (best === -1) {
      // Awaryjnie: brute-force (bardzo rzadka sciezka dla rzadkich/brzegowych chmur).
      const n = this.positions.length / 3;
      for (let i = 0; i < n; i++) {
        const dSq =
          (this.positions[i * 3] - x) ** 2 +
          (this.positions[i * 3 + 1] - y) ** 2 +
          (this.positions[i * 3 + 2] - z) ** 2;
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          best = i;
        }
      }
    }

    return { index: best, distSq: bestDistSq };
  }
}
