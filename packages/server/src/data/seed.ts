import {
  loadShipModel,
  buildConstructionSnapshot,
  deformShipModel,
  type ActiveDefect,
  type DefectSpec,
  type ShipModel,
  type ShipModelKind,
} from "./shipModel.js";
import { compareScans } from "../lib/compare.js";
import type {
  Vessel,
  ScanDetail,
  ScanSummary,
  Defect,
  DefectObservation,
  DefectStatus,
  DefectType,
  Severity,
} from "../types.js";

export function severityOf(type: DefectType, magnitudeMm: number): Severity {
  const abs = Math.abs(magnitudeMm);
  // Pekniecia traktujemy ostrzej niz plaska glebokosc sugerowalaby - kazde
  // potwierdzone pekniecie jest przynajmniej "powazne" ze wzgledow strukturalnych.
  if (type === "peknieciecie" && abs >= 0.8) {
    return abs >= 2.5 ? "critical" : "serious";
  }
  if (abs < 1.5) return "good";
  if (abs < 3.5) return "warning";
  if (abs < 6) return "serious";
  return "critical";
}

interface VesselBlueprint {
  vessel: Vessel;
  modelKind: ShipModelKind;
  scanDates: string[]; // ISO, rosnaco
  defectStories: DefectStory[];
}

interface DefectStory {
  type: DefectType;
  region: string;
  spec: DefectSpec;
  appearAt: number; // indeks skanu, od ktorego defekt jest widoczny
  pattern: "sudden-stable" | "growing" | "growing-then-repaired" | "cyclical-fouling" | "late-onset-growing";
  /** Opcjonalne nadpisanie domyslnego szczytowego natezenia dla danego typu -
   *  domyslne stale w magnitudeAt() sa dobrane tak, by wiekszosc historii
   *  ladowala w "powazne" (patrz severityOf) - do zbudowania faktycznego
   *  zroznicowania floty (jednostka w bardzo dobrym ALBO krytycznym stanie)
   *  trzeba pojedynczej historii pozwolic wyjsc poza ten domyslny zakres. */
  peakOverrideMm?: number;
}

function iso(monthsAgoFromAnchor: number, anchor: Date): string {
  const d = new Date(anchor);
  d.setMonth(d.getMonth() - monthsAgoFromAnchor);
  return d.toISOString().slice(0, 10);
}

function magnitudeAt(story: DefectStory, scanIndex: number, scanCount: number): number {
  if (scanIndex < story.appearAt) return 0;
  const t = scanIndex - story.appearAt; // "wiek" defektu w skanach
  const peakBase =
    story.peakOverrideMm ??
    (story.type === "wgniecenie" ? -5.5 :
    story.type === "peknieciecie" ? -2.2 :
    story.type === "korozja" ? -4.0 :
    story.type === "ubytek-powloki" ? -1.6 :
    3.2); // porost-biologiczny

  switch (story.pattern) {
    case "sudden-stable":
      return peakBase; // mechaniczne uszkodzenie - powstaje od razu, potem stabilne
    case "growing":
      return peakBase * Math.min(1, 0.28 + t * 0.22); // narasta z kazdym przegladem
    case "late-onset-growing":
      return peakBase * Math.min(1, 0.35 + t * 0.4);
    case "growing-then-repaired": {
      const repairAt = story.appearAt + 3;
      if (scanIndex >= repairAt) return peakBase * 0.05; // wyczyszczone/naprawione
      return peakBase * Math.min(1, 0.3 + t * 0.35);
    }
    case "cyclical-fouling": {
      const cycle = t % 4;
      return peakBase * (0.25 + cycle * 0.25); // narasta miedzy dokowaniami, potem czyszczenie
    }
    default:
      return peakBase;
  }
}

function statusAt(story: DefectStory, scanIndex: number, scanCount: number): DefectStatus {
  if (scanIndex < story.appearAt) return "nowa";
  const t = scanIndex - story.appearAt;
  if (story.pattern === "growing-then-repaired" && scanIndex >= story.appearAt + 3) return "naprawiona";
  if (story.pattern === "cyclical-fouling") return t % 4 === 0 ? "naprawiona" : t % 4 >= 2 ? "narasta" : "stabilna";
  if (t === 0) return "nowa";
  if (story.pattern === "growing" || story.pattern === "late-onset-growing" || story.pattern === "growing-then-repaired") {
    return "narasta";
  }
  return "stabilna";
}

function buildBlueprints(): VesselBlueprint[] {
  const anchor = new Date("2026-09-12");
  const scanDates6 = [22, 17, 13, 9, 5, 1].map((m) => iso(m, anchor));
  const scanDates5 = [16, 12, 8, 4, 0.5].map((m) => iso(m, anchor));

  return [
    {
      vessel: {
        id: "orp-wicher-ii",
        name: "ORP Wicher II",
        type: "fregata",
        shipyard: "Stocznia Marynarki Wojennej, Gdynia",
        homePort: "Gdynia",
        imo: "SIM-0001",
        commissioned: "2019-05-14",
        lengthM: 108,
        beamM: 14,
      },
      modelKind: "frigate",
      scanDates: scanDates6,
      defectStories: [
        {
          type: "wgniecenie",
          region: "Burta lewa, sekcja dziobowa",
          spec: { kind: "radial", u: 0.78, v: 0.52, sigmaU: 0.03, sigmaV: 0.045 },
          appearAt: 2,
          pattern: "sudden-stable",
        },
        {
          type: "korozja",
          region: "Dno kadłuba, śródokręcie",
          spec: { kind: "radial", u: 0.48, v: 0.74, sigmaU: 0.09, sigmaV: 0.08, colorTint: [0.18, -0.06, -0.1] },
          appearAt: 0,
          pattern: "growing",
        },
        {
          type: "peknieciecie",
          region: "Burta prawa, przy stępce, rufa",
          spec: { kind: "linear", u: 0.14, v: 0.68, angleRad: 0.9, lengthUV: 0.05, sigma: 0.008 },
          appearAt: 4,
          pattern: "late-onset-growing",
        },
        {
          type: "porost-biologiczny",
          region: "Dno kadłuba, rufa",
          spec: { kind: "radial", u: 0.2, v: 0.7, sigmaU: 0.12, sigmaV: 0.1, colorTint: [-0.1, 0.08, -0.05] },
          appearAt: 0,
          pattern: "cyclical-fouling",
        },
      ],
    },
    {
      vessel: {
        id: "holownik-gryf",
        name: "Holownik Gryf",
        type: "holownik",
        shipyard: "Stocznia Remontowa Nauta, Gdynia",
        homePort: "Gdynia",
        imo: "SIM-0002",
        commissioned: "2011-03-01",
        lengthM: 32,
        beamM: 9.5,
      },
      modelKind: "tug",
      scanDates: scanDates5,
      defectStories: [
        {
          type: "wgniecenie",
          region: "Dziób, linia zderzakowa",
          spec: { kind: "radial", u: 0.92, v: 0.5, sigmaU: 0.025, sigmaV: 0.05 },
          appearAt: 1,
          pattern: "sudden-stable",
        },
        {
          type: "ubytek-powloki",
          region: "Burta prawa, linia wodna",
          spec: { kind: "radial", u: 0.55, v: 0.03, sigmaU: 0.1, sigmaV: 0.06, colorTint: [0.12, -0.04, -0.08] },
          appearAt: 0,
          pattern: "growing-then-repaired",
        },
      ],
    },
    {
      vessel: {
        id: "prom-wolin",
        name: "Prom Wolin",
        type: "prom",
        shipyard: "Remontowa Shipbuilding, Gdańsk",
        homePort: "Świnoujście",
        imo: "SIM-0003",
        commissioned: "2015-06-20",
        lengthM: 145,
        beamM: 24,
      },
      modelKind: "ferry",
      scanDates: scanDates6,
      defectStories: [
        {
          type: "korozja",
          region: "Dno kadłuba, komora dziobowa",
          spec: { kind: "radial", u: 0.85, v: 0.72, sigmaU: 0.06, sigmaV: 0.09, colorTint: [0.16, -0.05, -0.09] },
          appearAt: 1,
          pattern: "growing",
        },
        {
          type: "porost-biologiczny",
          region: "Dno kadłuba, cała długość",
          spec: { kind: "radial", u: 0.5, v: 0.72, sigmaU: 0.35, sigmaV: 0.12, colorTint: [-0.08, 0.07, -0.04] },
          appearAt: 0,
          pattern: "cyclical-fouling",
        },
        {
          type: "wgniecenie",
          region: "Burta lewa, rejon rampy",
          spec: { kind: "radial", u: 0.32, v: 0.48, sigmaU: 0.02, sigmaV: 0.03 },
          appearAt: 5,
          pattern: "sudden-stable",
        },
      ],
    },
    {
      vessel: {
        id: "orp-kaszubia",
        name: "ORP Kaszubia",
        type: "jednostka-patrolowa",
        shipyard: "Stocznia Crist, Świnoujście",
        homePort: "Gdańsk",
        imo: "SIM-0004",
        commissioned: "2021-09-10",
        lengthM: 62,
        beamM: 10,
      },
      // Najmlodsza jednostka floty (2021) i celowo najlepiej utrzymana - kontrast
      // wobec reszty floty na dashboardzie: same drobne, kosmetyczne sygnaly,
      // zaden nie przekracza progu "dobra" (patrz severityOf) - pokazuje, ze
      // narzedzie faktycznie rozroznia stan jednostek, a nie kazdej pokazuje to samo.
      modelKind: "patrol",
      scanDates: scanDates5,
      defectStories: [
        {
          type: "porost-biologiczny",
          region: "Dno kadłuba, śródokręcie",
          spec: { kind: "radial", u: 0.5, v: 0.72, sigmaU: 0.15, sigmaV: 0.1, colorTint: [-0.06, 0.05, -0.03] },
          appearAt: 0,
          pattern: "cyclical-fouling",
          peakOverrideMm: 1.0,
        },
        {
          type: "ubytek-powloki",
          region: "Dziób, strefa kotwiczna",
          spec: { kind: "radial", u: 0.88, v: 0.55, sigmaU: 0.04, sigmaV: 0.05, colorTint: [0.1, -0.03, -0.06] },
          appearAt: 0,
          pattern: "growing",
          peakOverrideMm: -1.0,
        },
      ],
    },
    {
      vessel: {
        id: "ms-neptun-baltic",
        name: "MS Neptun Baltic",
        type: "kontenerowiec",
        shipyard: "Stocznia Gdańsk",
        homePort: "Gdańsk",
        imo: "SIM-0005",
        commissioned: "2013-11-02",
        lengthM: 210,
        beamM: 30,
      },
      // Najstarsza jednostka handlowa floty i celowo najgorzej utrzymana -
      // niepowlekana/zaniedbana korozja zbiornika balastowego eskalujaca do
      // stanu "krytycznego" (patrz severityOf) w ostatnich przegladach, zgodnie
      // z realnymi tempami korozji wgniebieniowej (pitting) na niepowlekanym
      // dnie zbiornika balastowego (rzedu kilku mm/rok w skrajnych przypadkach).
      modelKind: "container",
      scanDates: scanDates6,
      defectStories: [
        {
          type: "korozja",
          region: "Dno kadłuba, zbiornik balastowy nr 3",
          spec: { kind: "radial", u: 0.4, v: 0.7, sigmaU: 0.07, sigmaV: 0.09, colorTint: [0.17, -0.06, -0.1] },
          appearAt: 0,
          pattern: "growing",
          peakOverrideMm: -6.8,
        },
        {
          type: "wgniecenie",
          region: "Burta prawa, przy nadburciu",
          spec: { kind: "radial", u: 0.15, v: 0.22, sigmaU: 0.03, sigmaV: 0.04 },
          appearAt: 3,
          pattern: "sudden-stable",
        },
        {
          type: "peknieciecie",
          region: "Pokład główny, węzeł konstrukcyjny",
          spec: { kind: "linear", u: 0.5, v: 0.24, angleRad: 0.4, lengthUV: 0.07, sigma: 0.009 },
          appearAt: 5,
          pattern: "late-onset-growing",
        },
      ],
    },
  ];
}

export interface SeededVessel {
  vessel: Vessel;
  model: ShipModel;
  scans: ScanDetail[];
  baseline: ScanDetail;
  constructionMilestones: ScanDetail[];
  defects: Defect[];
}

const CONSTRUCTION_MILESTONES: { monthsBeforeCommissioning: number; progress: number; label: string; description: string }[] = [
  {
    monthsBeforeCommissioning: 15,
    progress: 0.38,
    label: "Montaż sekcji dennych i rufowych",
    description:
      "Pierwsze sekcje kadłuba połączone na pochylni. Skanowanie na tym etapie służy do weryfikacji zgodności geometrii z projektem przed dalszym montażem.",
  },
  {
    monthsBeforeCommissioning: 9,
    progress: 0.72,
    label: "Montaż sekcji śródokręciowych i nadbudówki",
    description: "Kadłub wydłużony o sekcje środkowe. Widoczna rosnąca zgodność z docelową sylwetką jednostki.",
  },
  {
    monthsBeforeCommissioning: 4,
    progress: 1,
    label: "Zamknięcie kadłuba - gotowość do wodowania",
    description: "Kadłub kompletny geometrycznie, przed malowaniem i wyposażeniem końcowym. Ostatni skan przed wodowaniem.",
  },
];

export function buildSeedDataset(): SeededVessel[] {
  const blueprints = buildBlueprints();
  const result: SeededVessel[] = [];

  for (const bp of blueprints) {
    const model = loadShipModel(bp.modelKind, bp.vessel.lengthM, bp.vessel.beamM);
    const flatUV = (m: ShipModel) => {
      const uv = new Array<number>(m.vertexCount * 2);
      for (let i = 0; i < m.vertexCount; i++) {
        uv[i * 2] = m.u[i];
        uv[i * 2 + 1] = m.v[i];
      }
      return uv;
    };
    const modelIndices = Array.from(model.indices);
    const modelUV = flatUV(model);

    const scanCount = bp.scanDates.length;
    const rawScans: { id: string; timestamp: string; label: string; technician: string; deformed: ReturnType<typeof deformShipModel> }[] = [];

    const technicians = ["A. Nowicka", "M. Kowalczyk", "P. Jaworski", "K. Lis", "R. Baran", "T. Wozniak"];

    for (let s = 0; s < scanCount; s++) {
      const active: ActiveDefect[] = bp.defectStories
        .map((story) => ({ spec: story.spec, magnitudeMm: magnitudeAt(story, s, scanCount) }))
        .filter((d) => Math.abs(d.magnitudeMm) > 0.05);

      const id = `${bp.vessel.id}-scan-${s + 1}`;
      const deformed = deformShipModel(model, active, id);
      rawScans.push({
        id,
        timestamp: bp.scanDates[s],
        label: s === 0 ? "Skan bazowy (wodowanie / pierwszy przegląd)" : `Przegląd okresowy #${s + 1}`,
        technician: technicians[s % technicians.length],
        deformed,
      });
    }

    // Skan "zero" - idealna geometria projektowa, uzywana jako punkt odniesienia
    // do policzenia bezwzglednych statystyk pierwszego realnego skanu.
    const idealScan: ScanDetail = {
      id: `${bp.vessel.id}-baseline`,
      vesselId: bp.vessel.id,
      timestamp: bp.vessel.commissioned,
      label: "Geometria projektowa (referencja)",
      phase: "eksploatacja",
      technician: "-",
      pointCount: model.vertexCount,
      avgDeviationMm: 0,
      maxDeviationMm: 0,
      openDefectCount: 0,
      surfaceChangedPct: 0,
      pointCloud: {
        positions: Array.from(model.positions),
        normals: Array.from(model.normals),
        baseColor: Array.from({ length: model.vertexCount * 3 }, (_, i) => (i % 3 === 0 ? 0.55 : i % 3 === 1 ? 0.58 : 0.61)),
        indices: modelIndices,
        uv: modelUV,
      },
    };

    // Etapy budowy - skany "przed eksploatacją", pokazujące postęp montażu
    // kadłuba na pochylni (skrócona chmura punktów - odcinek jeszcze
    // niezbudowany po prostu nie istnieje). Nie wchodzą do listy `scans` (nie
    // mają usterek/statystyk odchylenia) - służą wyłącznie do wizualizacji
    // historii budowy w podglądzie 3D.
    const commissionedDate = new Date(bp.vessel.commissioned);
    const constructionMilestones: ScanDetail[] = CONSTRUCTION_MILESTONES.map((m, i) => {
      const snapshot = buildConstructionSnapshot(model, m.progress);
      const uv = new Array<number>(snapshot.pointCount * 2);
      {
        let k = 0;
        for (let vi = 0; vi < model.vertexCount; vi++) {
          if (model.u[vi] > m.progress) continue;
          uv[k * 2] = model.u[vi];
          uv[k * 2 + 1] = model.v[vi];
          k++;
        }
      }
      return {
        id: `${bp.vessel.id}-build-${i + 1}`,
        vesselId: bp.vessel.id,
        timestamp: iso(m.monthsBeforeCommissioning, commissionedDate),
        label: m.label,
        description: m.description,
        phase: "budowa" as const,
        technician: "-",
        pointCount: snapshot.pointCount,
        avgDeviationMm: 0,
        maxDeviationMm: 0,
        openDefectCount: 0,
        surfaceChangedPct: 0,
        pointCloud: {
          positions: Array.from(snapshot.positions),
          normals: Array.from(snapshot.normals),
          baseColor: Array.from(snapshot.baseColor),
          indices: Array.from(snapshot.indices),
          uv,
        },
      };
    });

    const scans: ScanDetail[] = [];

    for (let s = 0; s < scanCount; s++) {
      const raw = rawScans[s];
      const pointCloud = {
        positions: Array.from(raw.deformed.positions),
        normals: Array.from(model.normals),
        baseColor: Array.from(raw.deformed.baseColor),
        indices: modelIndices,
        uv: modelUV,
      };

      const openDefectCount = bp.defectStories.filter(
        (story) => Math.abs(magnitudeAt(story, s, scanCount)) >= 1.2 && statusAt(story, s, scanCount) !== "naprawiona"
      ).length;

      const draft: ScanDetail = {
        id: raw.id,
        vesselId: bp.vessel.id,
        timestamp: raw.timestamp,
        label: raw.label,
        phase: "eksploatacja",
        technician: raw.technician,
        pointCount: model.vertexCount,
        avgDeviationMm: 0,
        maxDeviationMm: 0,
        openDefectCount,
        surfaceChangedPct: 0,
        pointCloud,
      };

      // Statystyki naglowkowe skanu = odchylenie skumulowane wzgledem geometrii
      // projektowej (nie wzgledem poprzedniego przegladu) - to one odpowiadaja na
      // pytanie "jaki jest aktualny stan kadluba", niezalezne od tego kiedy byl
      // poprzedni przeglad. Zmiane miedzy dwoma wybranymi przegladami liczy
      // endpoint /api/compare na zadanie.
      const cmp = compareScans(model, idealScan, draft, []);
      draft.avgDeviationMm = cmp.stats.avgAbsDeviationMm;
      draft.maxDeviationMm = cmp.stats.maxAbsDeviationMm;
      draft.surfaceChangedPct = cmp.stats.surfaceChangedPct;

      scans.push(draft);
    }

    const defects: Defect[] = bp.defectStories.map((story, i) => {
      const history: DefectObservation[] = scans.map((scan, s) => ({
        scanId: scan.id,
        timestamp: scan.timestamp,
        magnitudeMm: Math.round(magnitudeAt(story, s, scanCount) * 100) / 100,
        severity: severityOf(story.type, magnitudeAt(story, s, scanCount)),
      }));
      return {
        id: `${bp.vessel.id}-defect-${i + 1}`,
        vesselId: bp.vessel.id,
        type: story.type,
        region: story.region,
        uv: { u: story.spec.u, v: story.spec.v },
        firstDetectedScanId: scans[story.appearAt]?.id ?? scans[0].id,
        status: statusAt(story, scanCount - 1, scanCount),
        history,
      };
    });

    result.push({ vessel: bp.vessel, model, scans, baseline: idealScan, constructionMilestones, defects });
  }

  return result;
}

export function toScanSummary(scan: ScanDetail): ScanSummary {
  const { pointCloud, ...rest } = scan;
  void pointCloud;
  return rest;
}
