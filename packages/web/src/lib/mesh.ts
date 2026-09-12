// Buduje bufor indeksow trojkatow dla ustrukturyzowanej siatki (u,v) kadluba,
// zeby chmure punktow dalo sie renderowac jako pelna, cieniowana powierzchnie
// ("Model") zamiast rzadkich punktow. Obwod (v) jest cykliczny (zawija sie),
// dlugosc (u) nie jest zamykana czapeczkami na koncach - przy dziobie/rufie
// (lub na urwanej krawedzi niedokonczonego kadluba w trakcie budowy) siatka
// zostaje otwarta, co i tak nie jest widoczne przy renderowaniu dwustronnym.
export function buildTriangleIndex(uSteps: number, vSteps: number, pointCount: number): Uint32Array {
  const indices: number[] = [];
  for (let i = 0; i < uSteps - 1; i++) {
    for (let j = 0; j < vSteps; j++) {
      const a = i * vSteps + j;
      const b = i * vSteps + ((j + 1) % vSteps);
      const c = (i + 1) * vSteps + j;
      const d = (i + 1) * vSteps + ((j + 1) % vSteps);
      if (a >= pointCount || b >= pointCount || c >= pointCount || d >= pointCount) continue;
      indices.push(a, c, b, b, c, d);
    }
  }
  return new Uint32Array(indices);
}
