import type { CompareResponse, ScanDetail, VesselDetailResponse, VesselListItem } from "./types";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Blad zapytania: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  vessels: () => get<VesselListItem[]>("/vessels"),
  vessel: (id: string) => get<VesselDetailResponse>(`/vessels/${id}`),
  scan: (id: string) => get<ScanDetail>(`/scans/${id}`),
  compare: (a: string, b: string) => get<CompareResponse>(`/compare?a=${a}&b=${b}`),
};
