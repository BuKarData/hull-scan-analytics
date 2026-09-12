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
    printReport: string;
    printFullReport: string;
    printHint: string;
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
    serviceRolloutNote: string;
    pointSize: string;
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
    economicsLink: string;
    sectionsLink: string;
  };
  hullSections: {
    back: string;
    title: string;
    subtitle: string;
    sectionWord: string;
    cardAvg: string;
    cardPeak: string;
    cardDefects: string;
    detailTitle: (label: string) => string;
    detailSubtitle: string;
    noDefects: string;
    defectsInSection: string;
  };
  defectDetail: {
    notFound: string;
    status: string;
    firstDetected: string;
    currentMagnitude: string;
    viewSection: (label: string) => string;
    locationTitle: string;
    locationSubtitle: string;
    historyTitle: string;
    historySubtitle: string;
    magnitudeSeries: string;
    observationsTitle: (n: number) => string;
    colDate: string;
    colMagnitude: string;
    colSeverity: string;
    trendGrowing: string;
    trendShrinking: string;
    trendStable: string;
    narrative: (args: { typeLabel: string; firstDate: string; trend: string; growthPct: number; statusLabel: string; lastMm: string }) => string;
  };
  economics: {
    back: string;
    title: string;
    subtitle: string;
    disclaimer: string;
    assumptionsTitle: string;
    assumptionFuelPrice: string;
    assumptionOperatingDays: string;
    assumptionSurveyCost: string;
    statFoulingPenalty: string;
    statFoulingPenaltyHint: string;
    statExtraFuelCost: string;
    statExtraFuelCostHint: string;
    statRecoverable: string;
    statRecoverableHint: string;
    statSurveyAvoided: string;
    statSurveyAvoidedHint: (n: number) => string;
    noFoulingSignal: string;
    chartTitle: string;
    chartWithout: string;
    chartWith: string;
    chartUnit: string;
    chartBaseLabel: string;
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
    printReport: "Pobierz raport PDF",
    printFullReport: "Pobierz pełny raport (technika + ekonomia)",
    printHint: "Otwiera okno drukowania przeglądarki - wybierz \"Zapisz jako PDF\" jako drukarkę",
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
    serviceRolloutNote:
      "Regularne skanowanie 3D wdrożono flotowo w 2024 r. - wcześniejsze lata eksploatacji nie mają jeszcze cyfrowej historii porównawczej.",
    pointSize: "Rozmiar punktu",
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
    economicsLink: "Wpływ ekonomiczny",
    sectionsLink: "Sekcje kadłuba",
  },
  hullSections: {
    back: "Powrót do jednostki",
    title: "Sekcje kadłuba",
    subtitle:
      "Kadłub podzielony na sekcje budowy - tak jak montowany był na pochylni. Kliknij sekcję, aby podświetlić ją na modelu i zobaczyć usterki, które w niej leżą.",
    sectionWord: "Sekcja",
    cardAvg: "Średnia",
    cardPeak: "Szczyt",
    cardDefects: "Usterki",
    detailTitle: (label: string) => `${label} - szczegóły`,
    detailSubtitle: "Punkty tej sekcji podświetlone na modelu poniżej.",
    noDefects: "Brak zarejestrowanych usterek w tej sekcji.",
    defectsInSection: "Usterki w tej sekcji",
  },
  defectDetail: {
    notFound: "Nie znaleziono usterki.",
    status: "Status",
    firstDetected: "Pierwsze wykrycie",
    currentMagnitude: "Obecne natężenie",
    viewSection: (label: string) => `Zobacz na mapie sekcji (${label})`,
    locationTitle: "Lokalizacja na kadłubie",
    locationSubtitle: "Podświetlone punkty odpowiadają lokalizacji usterki na ostatnim skanie.",
    historyTitle: "Historia natężenia",
    historySubtitle: "Zmiana natężenia usterki w kolejnych przeglądach.",
    magnitudeSeries: "Natężenie",
    observationsTitle: (n: number) => `Wszystkie obserwacje (${n})`,
    colDate: "Data",
    colMagnitude: "Natężenie",
    colSeverity: "Nasilenie",
    trendGrowing: "narasta",
    trendShrinking: "maleje",
    trendStable: "jest stabilna",
    narrative: ({ typeLabel, firstDate, trend, growthPct, statusLabel, lastMm }) =>
      `Usterka typu „${typeLabel}” została po raz pierwszy zarejestrowana ${firstDate}. Od tego czasu ${trend}${
        trend === "jest stabilna" ? "" : ` o ok. ${growthPct}%`
      }. Obecne natężenie wynosi ${lastMm}, a status w rejestrze to „${statusLabel}”.`,
  },
  economics: {
    back: "Powrót do jednostki",
    title: "Wpływ ekonomiczny",
    subtitle: "Szacunkowy model - ile porost i przeoczone usterki kosztują w paliwie i przeglądach, gdyby nie wykryć ich wcześniej.",
    disclaimer:
      "To model demonstracyjny oparty o publicznie znane zależności branżowe (zużycie paliwa wg klasy kadłuba, wpływ porostu na opór kadłuba, typowy koszt przeglądu nurkowego) - nie o zmierzoną telemetrię silnikową tej jednostki. Założenia poniżej są edytowalne i powinny zostać skalibrowane z danymi klienta przed użyciem w ofercie.",
    assumptionsTitle: "Założenia (edytowalne)",
    assumptionFuelPrice: "Cena paliwa (PLN/tonę)",
    assumptionOperatingDays: "Dni w eksploatacji / rok",
    assumptionSurveyCost: "Koszt tradycyjnego przeglądu nurkowego (PLN)",
    statFoulingPenalty: "Kara paliwowa z porostu",
    statFoulingPenaltyHint: "wg aktualnej grubości porostu wykrytej w ostatnim skanie",
    statExtraFuelCost: "Dodatkowy koszt paliwa / rok",
    statExtraFuelCostHint: "przy obecnym poziomie porostu, bez interwencji",
    statRecoverable: "Potencjalna oszczędność / rok",
    statRecoverableHint: "przy czyszczeniu po wczesnym sygnale ze skanu, zamiast po fakcie",
    statSurveyAvoided: "Uniknięty koszt przeglądów nurkowych",
    statSurveyAvoidedHint: (n: number) => `${n} skan(y) HullSight zamiast przeglądu nurkowego`,
    noFoulingSignal: "Brak sygnału porostu biologicznego na tym kadłubie w ostatnim skanie - model kary paliwowej nie ma tu zastosowania.",
    chartTitle: "Zużycie paliwa: bez monitoringu vs. z HullSight",
    chartWithout: "Bez wczesnego wykrycia",
    chartWith: "Z HullSight",
    chartUnit: "ton/rok",
    chartBaseLabel: "zużycie bazowe",
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
    regionHeatmapSubtitle: "Kolor = najgorszy punkt (szczyt) w sekcji długości x obwodu kadłuba, żeby pojedynczy defekt był widoczny nawet w szerokim regionie.",
    regionHeatmapClickHint: "Kliknij kafelek, aby podświetlić ten obszar na modelu 3D.",
    dentLoss: "wgniecenie/ubytek",
    noChange: "brak zmiany",
    bulge: "narost",
    clustersTitle: (n: number) => `Automatycznie wykryte skupiska zmian (${n})`,
    clustersEmpty: (mm: number) =>
      `Brak spójnego, przestrzennie ciągłego obszaru zmian przekraczającego próg szumu skanu (${mm} mm) między wybranymi skanami. Heatmapa regionów obok koloruje wg szczytowego odchylenia w danym regionie i może wciąż pokazywać kolor przy pojedynczym punkcie, który nie tworzy klastra.`,
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
    printReport: "Download PDF report",
    printFullReport: "Download full report (technical + economic)",
    printHint: "Opens the browser print dialog - choose \"Save as PDF\" as the printer",
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
    serviceRolloutNote:
      "Fleet-wide 3D scanning rolled out in 2024 - earlier years of service don't yet have a digital comparison history.",
    pointSize: "Point size",
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
    economicsLink: "Economic impact",
    sectionsLink: "Hull sections",
  },
  hullSections: {
    back: "Back to vessel",
    title: "Hull sections",
    subtitle:
      "The hull divided into build sections, the way it was assembled on the slipway. Click a section to highlight it on the model and see the defects located in it.",
    sectionWord: "Section",
    cardAvg: "Average",
    cardPeak: "Peak",
    cardDefects: "Defects",
    detailTitle: (label: string) => `${label} - details`,
    detailSubtitle: "This section's points highlighted on the model below.",
    noDefects: "No defects recorded in this section.",
    defectsInSection: "Defects in this section",
  },
  defectDetail: {
    notFound: "Defect not found.",
    status: "Status",
    firstDetected: "First detected",
    currentMagnitude: "Current magnitude",
    viewSection: (label: string) => `View on section map (${label})`,
    locationTitle: "Location on the hull",
    locationSubtitle: "Highlighted points correspond to the defect's location in the latest scan.",
    historyTitle: "Magnitude history",
    historySubtitle: "How the defect's magnitude changed across successive inspections.",
    magnitudeSeries: "Magnitude",
    observationsTitle: (n: number) => `All observations (${n})`,
    colDate: "Date",
    colMagnitude: "Magnitude",
    colSeverity: "Severity",
    trendGrowing: "has been growing",
    trendShrinking: "has been shrinking",
    trendStable: "has stayed stable",
    narrative: ({ typeLabel, firstDate, trend, growthPct, statusLabel, lastMm }) =>
      `A "${typeLabel}" defect was first recorded on ${firstDate}. Since then it ${trend}${
        trend === "has stayed stable" ? "" : ` by roughly ${growthPct}%`
      }. Its current magnitude is ${lastMm}, and its registry status is "${statusLabel}".`,
  },
  economics: {
    back: "Back to vessel",
    title: "Economic impact",
    subtitle: "An estimate model - what fouling and missed defects cost in fuel and surveys if left undetected.",
    disclaimer:
      "This is a demonstration model built on publicly known industry relationships (fuel burn by hull class, fouling's effect on hull resistance, typical diver-survey cost) - not measured engine telemetry for this specific vessel. The assumptions below are editable and should be calibrated with customer data before use in a proposal.",
    assumptionsTitle: "Assumptions (editable)",
    assumptionFuelPrice: "Fuel price (PLN/tonne)",
    assumptionOperatingDays: "Operating days / year",
    assumptionSurveyCost: "Traditional diver survey cost (PLN)",
    statFoulingPenalty: "Fuel penalty from fouling",
    statFoulingPenaltyHint: "based on current fouling thickness in the latest scan",
    statExtraFuelCost: "Extra fuel cost / year",
    statExtraFuelCostHint: "at the current fouling level, without intervention",
    statRecoverable: "Potential savings / year",
    statRecoverableHint: "by cleaning on an early scan signal instead of after the fact",
    statSurveyAvoided: "Diver survey cost avoided",
    statSurveyAvoidedHint: (n: number) => `${n} HullSight scan(s) instead of a diver survey`,
    noFoulingSignal: "No biofouling signal on this hull in the latest scan - the fuel-penalty model doesn't apply here.",
    chartTitle: "Fuel consumption: without monitoring vs. with HullSight",
    chartWithout: "Without early detection",
    chartWith: "With HullSight",
    chartUnit: "t/year",
    chartBaseLabel: "baseline consumption",
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
    regionHeatmapSubtitle: "Color = the worst point (peak) within that length x girth section, so a single localized defect stays visible even in a wide region.",
    regionHeatmapClickHint: "Click a tile to highlight that area on the 3D model.",
    dentLoss: "dent/loss",
    noChange: "no change",
    bulge: "bulge",
    clustersTitle: (n: number) => `Automatically detected change clusters (${n})`,
    clustersEmpty: (mm: number) =>
      `No spatially contiguous area of change above the scan noise threshold (${mm} mm) between the selected scans. The region heatmap alongside colors by peak deviation per region and can still show color for a single point that doesn't form a cluster.`,
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
