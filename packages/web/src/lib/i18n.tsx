import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "pl" | "en";

interface Dict {
  common: {
    appName: string;
    tagline: string;
    demoData: string;
    fleet: string;
    loadingFleet: string;
    loadingVessel: string;
    loadingScan: string;
    loadingModel: string;
    loadingCompare: string;
    error: string;
    footer: string;
    themeAuto: string;
    themeLight: string;
    themeDark: string;
    themeToggleTitle: string;
    langToggleTitle: string;
    dataLanguageNote: string;
  };
  dashboard: {
    heroTitlePrefix: string;
    heroTitleSuffix: string;
    heroTitleTail: string;
    heroSubtitle: string;
    statVessels: string;
    statOpenDefects: string;
    statSeriousCritical: string;
    statSeriousCriticalDelta: (n: number) => string;
    statAvgPeak: string;
    statAvgPeakHint: string;
    openDefects: string;
    peakDeviation: string;
    trendSinceLast: string;
    scansCount: (n: number) => string;
    lastScan: string;
    viewHistory: string;
  };
  vessel: {
    back: string;
    scanA: string;
    scanB: string;
    compare: string;
    length: string;
    beam: string;
    inServiceSince: string;
    statScanCount: string;
    statOpenDefects: string;
    statLastPeak: string;
    statSurfaceChanged: string;
    statSurfaceChangedHint: string;
    deviationChartTitle: string;
    deviationChartSubtitle: string;
    avgDeviation: string;
    peakDeviation: string;
    surfaceChartTitle: string;
    surfaceChartSubtitle: string;
    surfacePct: string;
    defectRegistry: (n: number) => string;
    colType: string;
    colRegion: string;
    colStatus: string;
    colSeverity: string;
    colHistory: string;
    colDetected: string;
    scanHistory: string;
    technician: string;
    points: string;
    peak: string;
    defectsWord: string;
    timelineTitle: string;
    timelineSubtitle: string;
    play: string;
    pause: string;
    phaseBuild: string;
    phaseInspection: string;
    phaseInspectionOrRef: string;
    tabConstruction: string;
    tabService: string;
    constructionSubtitle: string;
    serviceSubtitle: string;
    pointSize: string;
    deformationScale: string;
    deformationScaleNote: (factor: number) => string;
    viewMode: string;
    viewModePoints: string;
    viewModeMesh: string;
    cameraMode: string;
    cameraModeOrbit: string;
    cameraModeFly: string;
    controlsHintOrbit: string;
    controlsHintFly: string;
    controlsHint: string;
    pointDescriptionTitle: string;
    pointDescriptionHint: string;
    section: string;
    underConstructionNoData: string;
    noDefectHere: string;
    peakDeviationShort: string;
    defectsShort: string;
  };
  compare: {
    title: string;
    model3d: string;
    modeHeatmap: string;
    modeOverlay: string;
    modeRawA: string;
    modeRawB: string;
    statAvgAbs: string;
    statPeakAbs: string;
    statSurfaceChanged: string;
    statSurfaceChangedHint: (mm: number) => string;
    statClusters: string;
    regionHeatmapTitle: string;
    regionHeatmapSubtitle: string;
    regionHeatmapClickHint: string;
    dentLoss: string;
    noChange: string;
    bulge: string;
    clustersTitle: (n: number) => string;
    clustersEmpty: (mm: number) => string;
    colSuggestedType: string;
    colNature: string;
    colPeak: string;
    colMean: string;
    colArea: string;
    colMatchedDefect: string;
    natureDent: string;
    natureBulge: string;
    noMatch: string;
  };
  region: {
    lengthBands: readonly string[];
    girthSectors: readonly string[];
    girthSectorsLower: readonly string[];
  };
  defectType: Record<"wgniecenie" | "korozja" | "peknieciecie" | "ubytek-powloki" | "porost-biologiczny", string>;
  defectStatus: Record<"nowa" | "narasta" | "stabilna" | "naprawiona", string>;
  vesselType: Record<"fregata" | "holownik" | "prom" | "kontenerowiec" | "jednostka-patrolowa", string>;
  severity: Record<"good" | "warning" | "serious" | "critical", string>;
  heatmapTable: {
    showTable: string;
    showHeatmap: string;
    colSection: string;
    colAvg: string;
    colPeak: string;
  };
}

const pl: Dict = {
  common: {
    appName: "HullSight",
    tagline: "Dual use · Gaussian Splatting · Ship Analysis",
    demoData: "Dane demonstracyjne (syntetyczne)",
    fleet: "Flota",
    loadingFleet: "Wczytywanie floty...",
    loadingVessel: "Wczytywanie danych jednostki...",
    loadingScan: "Wczytywanie danych skanu...",
    loadingModel: "Wczytywanie modelu...",
    loadingCompare: "Wczytywanie porównania...",
    error: "Błąd",
    footer: "HullSight – dual use · Gaussian Splatting · analiza porównawcza kadłubów. Dane pokazowe.",
    themeAuto: "Auto",
    themeLight: "Jasny",
    themeDark: "Ciemny",
    themeToggleTitle: "Przełącz motyw (auto / jasny / ciemny)",
    langToggleTitle: "Przełącz język interfejsu",
    dataLanguageNote:
      "Dane wprowadzone przez inspektorów i stocznię (nazwy jednostek, opisy usterek, etykiety przeglądów) pozostają w języku, w którym zostały zarejestrowane - tak jak w prawdziwym systemie inspekcyjnym.",
  },
  dashboard: {
    heroTitlePrefix: "Hull",
    heroTitleSuffix: "Sight",
    heroTitleTail: " - przegląd floty",
    heroSubtitle:
      "Stan kadłubów na podstawie ostatnich skanów 3D. Wybierz jednostkę, aby zobaczyć historię budowy, przeglądy, rejestr usterek i porównanie skanów.",
    statVessels: "Jednostki we flocie",
    statOpenDefects: "Otwarte usterki (łączne)",
    statSeriousCritical: "Jednostki: stan poważny/krytyczny",
    statSeriousCriticalDelta: (n: number) => `w tym ${n} krytyczne`,
    statAvgPeak: "Średnie odchylenie szczytowe",
    statAvgPeakHint: "względem geometrii projektowej",
    openDefects: "Otwarte usterki",
    peakDeviation: "Odchylenie (szczyt)",
    trendSinceLast: "Trend od ost. przeglądu",
    scansCount: (n: number) => `${n} skanów`,
    lastScan: "ostatni",
    viewHistory: "Zobacz historię",
  },
  vessel: {
    back: "Flota",
    scanA: "Skan A (wcześniejszy)",
    scanB: "Skan B (późniejszy)",
    compare: "Porównaj",
    length: "Długość",
    beam: "Szerokość",
    inServiceSince: "w służbie od",
    statScanCount: "Liczba skanów",
    statOpenDefects: "Otwarte usterki",
    statLastPeak: "Ostatnie odchylenie szczytowe",
    statSurfaceChanged: "Powierzchnia zmieniona (ost. skan)",
    statSurfaceChangedHint: "względem geometrii projektowej",
    deviationChartTitle: "Odchylenie od geometrii projektowej",
    deviationChartSubtitle:
      "Średnie i szczytowe odchylenie kadłuba względem stanu odniesienia, w kolejnych przeglądach.",
    avgDeviation: "Średnie |odchylenie|",
    peakDeviation: "Szczytowe |odchylenie|",
    surfaceChartTitle: "Powierzchnia kadłuba objęta zmianą",
    surfaceChartSubtitle: "Odsetek powierzchni ze zmianą większą niż próg szumu skanu (1.2 mm).",
    surfacePct: "% powierzchni zmienionej",
    defectRegistry: (n: number) => `Rejestr usterek (${n})`,
    colType: "Typ",
    colRegion: "Rejon kadłuba",
    colStatus: "Status",
    colSeverity: "Aktualne nasilenie",
    colHistory: "Historia (mm)",
    colDetected: "Wykryto",
    scanHistory: "Historia skanów",
    technician: "Technik",
    points: "pkt",
    peak: "szczyt",
    defectsWord: "usterek",
    timelineTitle: "Historia w 3D",
    timelineSubtitle: "Najedź na punkt modelu, aby zobaczyć opis.",
    play: "Odtwórz historię",
    pause: "Zatrzymaj",
    phaseBuild: "Etap budowy",
    phaseInspection: "Przegląd",
    phaseInspectionOrRef: "Przegląd / stan referencyjny",
    tabConstruction: "Historia budowy",
    tabService: "Eksploatacja",
    constructionSubtitle: "Przesuń suwak, aby zobaczyć postęp budowy kadłuba na pochylni - od pierwszych sekcji do wodowania.",
    serviceSubtitle: "Przesuń suwak, aby zobaczyć kolejne przeglądy od odbioru jednostki do dziś.",
    pointSize: "Rozmiar punktu",
    deformationScale: "Wzmocnienie odkształceń",
    deformationScaleNote: (factor: number) =>
      factor <= 1
        ? "Skala rzeczywista - odkształcenia rzędu milimetrów są niewidoczne na kadłubie tej wielkości (dlatego istnieje heatmapa)."
        : `Odkształcenia na modelu wzmocnione ×${factor} dla czytelności - wartości w mm w statystykach są rzeczywiste.`,
    viewMode: "Widok",
    viewModePoints: "Chmura punktów",
    viewModeMesh: "Model (siatka)",
    cameraMode: "Kamera",
    cameraModeOrbit: "Orbita",
    cameraModeFly: "Lot",
    controlsHintOrbit: "Obróć: przeciągnij · Przybliż: scroll · Opis punktu: najedź kursorem",
    controlsHintFly: "Leć: W/S/A/D · Patrz: przeciągnij · Wznieś/opuść: Q/E · Przybliż: scroll",
    controlsHint: "Obróć: przeciągnij · Zoom: scroll · Opis punktu: najedź kursorem",
    pointDescriptionTitle: "Opis punktu pod kursorem",
    pointDescriptionHint:
      "Najedź kursorem na model, aby zobaczyć, która sekcja kadłuba jest pod kursorem i czy zarejestrowano tam usterkę.",
    section: "Sekcja",
    underConstructionNoData: "Kadłub jeszcze w budowie - brak danych eksploatacyjnych dla tego punktu.",
    noDefectHere: "Brak zarejestrowanej usterki w tym miejscu - powierzchnia w normie.",
    peakDeviationShort: "odchylenie szczyt.",
    defectsShort: "usterki",
  },
  compare: {
    title: "Porównanie skanów",
    model3d: "Model 3D",
    modeHeatmap: "Heatmapa zmian",
    modeOverlay: "Nałożenie (A+B)",
    modeRawA: "Skan A - rzeczywisty",
    modeRawB: "Skan B - rzeczywisty",
    statAvgAbs: "Średnie |odchylenie|",
    statPeakAbs: "Szczytowe |odchylenie|",
    statSurfaceChanged: "Powierzchnia zmieniona",
    statSurfaceChangedHint: (mm: number) => `próg szumu: ${mm} mm`,
    statClusters: "Wykryte skupiska zmian",
    regionHeatmapTitle: "Heatmapa regionów kadłuba",
    regionHeatmapSubtitle: "Średnie odchylenie zagregowane wg sekcji długości x obwodu kadłuba.",
    regionHeatmapClickHint: "Kliknij kafelek, aby podświetlić ten obszar na modelu 3D.",
    dentLoss: "wgniecenie/ubytek",
    noChange: "brak zmiany",
    bulge: "narost",
    clustersTitle: (n: number) => `Automatycznie wykryte skupiska zmian (${n})`,
    clustersEmpty: (mm: number) => `Brak zmian przekraczających próg szumu skanu (${mm} mm) między wybranymi skanami.`,
    colSuggestedType: "Sugerowany typ",
    colNature: "Charakter",
    colPeak: "Szczyt",
    colMean: "Średnia",
    colArea: "Powierzchnia (pkt)",
    colMatchedDefect: "Powiązana usterka w rejestrze",
    natureDent: "Wgniecenie / ubytek",
    natureBulge: "Narost / wybrzuszenie",
    noMatch: "Brak dopasowania - wymaga weryfikacji",
  },
  region: {
    lengthBands: ["Rufa", "Rufa-śródokręcie", "Śródokręcie", "Śródokręcie-dziób", "Dziób"],
    girthSectors: ["Burta prawa (WL)", "Pokład / nadburcie", "Burta lewa (WL)", "Dno / stępka"],
    girthSectorsLower: ["burta prawa (linia wodna)", "pokład / nadburcie", "burta lewa (linia wodna)", "dno / stępka"],
  },
  defectType: {
    wgniecenie: "Wgniecenie",
    korozja: "Korozja",
    peknieciecie: "Pęknięcie",
    "ubytek-powloki": "Ubytek powłoki",
    "porost-biologiczny": "Porost biologiczny",
  },
  defectStatus: {
    nowa: "Nowa",
    narasta: "Narasta",
    stabilna: "Stabilna",
    naprawiona: "Naprawiona",
  },
  vesselType: {
    fregata: "Fregata",
    holownik: "Holownik",
    prom: "Prom",
    kontenerowiec: "Kontenerowiec",
    "jednostka-patrolowa": "Jednostka patrolowa",
  },
  severity: {
    good: "W normie",
    warning: "Do obserwacji",
    serious: "Poważna",
    critical: "Krytyczna",
  },
  heatmapTable: {
    showTable: "Pokaż jako tabelę",
    showHeatmap: "Pokaż heatmapę",
    colSection: "Sekcja",
    colAvg: "Średnie odchylenie",
    colPeak: "Szczyt |odchylenia|",
  },
};

const en: Dict = {
  common: {
    appName: "HullSight",
    tagline: "Dual use · Gaussian Splatting · Ship Analysis",
    demoData: "Demo data (synthetic)",
    fleet: "Fleet",
    loadingFleet: "Loading fleet...",
    loadingVessel: "Loading vessel data...",
    loadingScan: "Loading scan data...",
    loadingModel: "Loading model...",
    loadingCompare: "Loading comparison...",
    error: "Error",
    footer: "HullSight – dual use · Gaussian Splatting · hull comparison analytics. Demo data.",
    themeAuto: "Auto",
    themeLight: "Light",
    themeDark: "Dark",
    themeToggleTitle: "Switch theme (auto / light / dark)",
    langToggleTitle: "Switch interface language",
    dataLanguageNote:
      "Data entered by inspectors and the shipyard (vessel names, defect descriptions, inspection labels) stays in the language it was recorded in - just like in a real inspection system.",
  },
  dashboard: {
    heroTitlePrefix: "Hull",
    heroTitleSuffix: "Sight",
    heroTitleTail: " - fleet overview",
    heroSubtitle:
      "Hull condition based on the latest 3D scans. Select a vessel to see its build history, inspections, defect registry and scan comparisons.",
    statVessels: "Vessels in fleet",
    statOpenDefects: "Open defects (total)",
    statSeriousCritical: "Vessels: serious/critical condition",
    statSeriousCriticalDelta: (n: number) => `incl. ${n} critical`,
    statAvgPeak: "Average peak deviation",
    statAvgPeakHint: "relative to design geometry",
    openDefects: "Open defects",
    peakDeviation: "Peak deviation",
    trendSinceLast: "Trend since last inspection",
    scansCount: (n: number) => `${n} scans`,
    lastScan: "last",
    viewHistory: "View history",
  },
  vessel: {
    back: "Fleet",
    scanA: "Scan A (earlier)",
    scanB: "Scan B (later)",
    compare: "Compare",
    length: "Length",
    beam: "Beam",
    inServiceSince: "in service since",
    statScanCount: "Number of scans",
    statOpenDefects: "Open defects",
    statLastPeak: "Latest peak deviation",
    statSurfaceChanged: "Surface changed (latest scan)",
    statSurfaceChangedHint: "relative to design geometry",
    deviationChartTitle: "Deviation from design geometry",
    deviationChartSubtitle: "Average and peak hull deviation from the reference state, across successive inspections.",
    avgDeviation: "Average |deviation|",
    peakDeviation: "Peak |deviation|",
    surfaceChartTitle: "Hull surface affected by change",
    surfaceChartSubtitle: "Share of surface with change above the scan noise threshold (1.2 mm).",
    surfacePct: "% surface changed",
    defectRegistry: (n: number) => `Defect registry (${n})`,
    colType: "Type",
    colRegion: "Hull region",
    colStatus: "Status",
    colSeverity: "Current severity",
    colHistory: "History (mm)",
    colDetected: "Detected",
    scanHistory: "Scan history",
    technician: "Technician",
    points: "pts",
    peak: "peak",
    defectsWord: "defects",
    timelineTitle: "3D history",
    timelineSubtitle: "Hover over the model to see a description.",
    play: "Play history",
    pause: "Pause",
    phaseBuild: "Construction stage",
    phaseInspection: "Inspection",
    phaseInspectionOrRef: "Inspection / reference state",
    tabConstruction: "Construction history",
    tabService: "Service",
    constructionSubtitle: "Drag the slider to see the hull build progress on the slipway - from the first sections to launch.",
    serviceSubtitle: "Drag the slider to see successive inspections from delivery to today.",
    pointSize: "Point size",
    deformationScale: "Deformation scale",
    deformationScaleNote: (factor: number) =>
      factor <= 1
        ? "True scale - millimetre-scale deformation is invisible on a hull this size (that's exactly why the heatmap exists)."
        : `Hull deformation shown ×${factor} exaggerated for visibility - the mm values in the stats are the real, unscaled measurements.`,
    viewMode: "View",
    viewModePoints: "Point cloud",
    viewModeMesh: "Model (mesh)",
    cameraMode: "Camera",
    cameraModeOrbit: "Orbit",
    cameraModeFly: "Fly",
    controlsHintOrbit: "Rotate: drag · Zoom: scroll · Point description: hover",
    controlsHintFly: "Fly: W/S/A/D · Look: drag · Up/down: Q/E · Zoom: scroll",
    controlsHint: "Rotate: drag · Zoom: scroll · Point description: hover",
    pointDescriptionTitle: "Description of point under cursor",
    pointDescriptionHint: "Hover over the model to see which hull section is under the cursor and whether a defect is recorded there.",
    section: "Section",
    underConstructionNoData: "Hull still under construction - no service data for this point.",
    noDefectHere: "No defect recorded here - surface within normal range.",
    peakDeviationShort: "peak deviation",
    defectsShort: "defects",
  },
  compare: {
    title: "Scan comparison",
    model3d: "3D model",
    modeHeatmap: "Change heatmap",
    modeOverlay: "Overlay (A+B)",
    modeRawA: "Scan A - as scanned",
    modeRawB: "Scan B - as scanned",
    statAvgAbs: "Average |deviation|",
    statPeakAbs: "Peak |deviation|",
    statSurfaceChanged: "Surface changed",
    statSurfaceChangedHint: (mm: number) => `noise threshold: ${mm} mm`,
    statClusters: "Detected change clusters",
    regionHeatmapTitle: "Hull region heatmap",
    regionHeatmapSubtitle: "Average deviation aggregated by length x girth section.",
    regionHeatmapClickHint: "Click a tile to highlight that area on the 3D model.",
    dentLoss: "dent/loss",
    noChange: "no change",
    bulge: "bulge",
    clustersTitle: (n: number) => `Automatically detected change clusters (${n})`,
    clustersEmpty: (mm: number) => `No changes above the scan noise threshold (${mm} mm) between the selected scans.`,
    colSuggestedType: "Suggested type",
    colNature: "Nature",
    colPeak: "Peak",
    colMean: "Mean",
    colArea: "Area (pts)",
    colMatchedDefect: "Matched registry defect",
    natureDent: "Dent / loss",
    natureBulge: "Bulge / growth",
    noMatch: "No match - needs verification",
  },
  region: {
    lengthBands: ["Stern", "Stern-midship", "Midship", "Midship-bow", "Bow"],
    girthSectors: ["Starboard (WL)", "Deck / topsides", "Port (WL)", "Bottom / keel"],
    girthSectorsLower: ["starboard side (waterline)", "deck / topsides", "port side (waterline)", "bottom / keel"],
  },
  defectType: {
    wgniecenie: "Dent",
    korozja: "Corrosion",
    peknieciecie: "Crack",
    "ubytek-powloki": "Coating loss",
    "porost-biologiczny": "Biofouling",
  },
  defectStatus: {
    nowa: "New",
    narasta: "Growing",
    stabilna: "Stable",
    naprawiona: "Repaired",
  },
  vesselType: {
    fregata: "Frigate",
    holownik: "Tug",
    prom: "Ferry",
    kontenerowiec: "Container ship",
    "jednostka-patrolowa": "Patrol vessel",
  },
  severity: {
    good: "Normal",
    warning: "Watch",
    serious: "Serious",
    critical: "Critical",
  },
  heatmapTable: {
    showTable: "Show as table",
    showHeatmap: "Show heatmap",
    colSection: "Section",
    colAvg: "Average deviation",
    colPeak: "Peak |deviation|",
  },
};

const DICTS: Record<Lang, Dict> = { pl, en };

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("hullsight-lang") as Lang | null) ?? "pl");

  useEffect(() => {
    localStorage.setItem("hullsight-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<LangContextValue>(() => ({ lang, setLang, t: DICTS[lang] }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}

export function dateLocale(lang: Lang): string {
  return lang === "pl" ? "pl-PL" : "en-GB";
}
