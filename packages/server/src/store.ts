import { buildSeedDataset, type SeededVessel } from "./data/seed.js";
import type { ScanDetail } from "./types.js";

// Prosty magazyn w pamieci, budowany raz przy starcie procesu (dane sa
// deterministyczne dzieki seedowanemu PRNG). W realnej integracji ta warstwa
// zostaje zastapiona klientem HTTP do wlasciwego API aplikacji skanujacej -
// patrz docs/ARCHITECTURE.md.
class InMemoryStore {
  readonly vessels: SeededVessel[] = buildSeedDataset();
  private scanIndex = new Map<string, { scan: ScanDetail; vesselId: string }>();

  constructor() {
    for (const v of this.vessels) {
      for (const scan of v.scans) {
        this.scanIndex.set(scan.id, { scan, vesselId: v.vessel.id });
      }
      this.scanIndex.set(v.baseline.id, { scan: v.baseline, vesselId: v.vessel.id });
      for (const milestone of v.constructionMilestones) {
        this.scanIndex.set(milestone.id, { scan: milestone, vesselId: v.vessel.id });
      }
    }
  }

  getVessel(id: string) {
    return this.vessels.find((v) => v.vessel.id === id) ?? null;
  }

  getScan(id: string) {
    return this.scanIndex.get(id) ?? null;
  }
}

export const store = new InMemoryStore();
