export type Lang = "pl" | "en";

export interface Copy {
  nav: {
    platform: string;
    dualUse: string;
    how: string;
    live: string;
    openApp: string;
    book: string;
  };
  hero: {
    chipTop: string;
    liveBadge: string;
    h1Line1: string;
    h1Line2: string;
    sub: string;
    ctaPrimary: string;
    ctaSecondary: string;
    ctaTertiary: string;
    tags: string[];
    videoKicker: string;
    videoTitle: string;
    videoTimer: string;
    videoSub: string;
    videoCap: string;
    toast: string;
    rec: string;
    dateStamp: string;
  };
  problem: { kicker: string; title: string; subtitle: string; costLabel: string; costValue: string; costHint: string };
  bridge: { kicker: string; title: string; subtitle: string; head: string[]; rows: { who: string; cost: string; speed: string; access: string; depth: string; verdict: string; accent?: boolean }[] };
  how: { kicker: string; title: string; subtitle: string; steps: { n: string; t: string; d: string }[]; tech: string[] };
  detect: { kicker: string; title: string; subtitle: string; gridCaption: string; gridLegend: string[]; defects: { name: string; en: string; sev: string; mm: string; d: string }[] };
  dualuse: { kicker: string; title: string; subtitle: string; line: string; civilian: { head: string; title: string; items: string[] }; defense: { head: string; title: string; items: string[] } };
  proof: {
    kicker: string;
    title: string;
    subtitle: string;
    stats: { big: string; unit: string; label: string; note: string }[];
    trendTitle: string;
    trendCaption: string;
    trendLegend1: string;
    trendLegend2: string;
    fleet: string;
    toolingTitle: string;
    toolingText: string;
    note: string;
  };
  objections: { kicker: string; title: string; items: { q: string; a: string }[] };
  cta: { kicker: string; title: string; subtitle: string; primary: string; secondary: string; formLabel: string; formPlaceholder: string; formNote: string; formOk: string; note: string };
  footer: { tag: string; sub: string; colTech: string; colCtx: string; tech1: string; tech2: string; tech3: string; tech4: string; ctx1: string; ctx2: string; ctx3: string; desc: string; lang: string };
}

const pl: Copy = {
  nav: { platform: "Platforma", dualUse: "Dual use", how: "Jak to działa", live: "Dowody", openApp: "Otwórz demo", book: "Umów demo" },
  hero: {
    chipTop: "BALTIC DUAL USE HACKATHON · GDAŃSK 2026",
    liveBadge: "LIVE · 5 jednostek · geometria kadłuba · 1,2 mm szumu",
    h1Line1: "Statek na morzu.",
    h1Line2: "Bliźniak mierzony w milimetrach.",
    sub:
      "HullSight zamienia rutynowe nagranie telefonem w mierzalny bliźniak 3D kadłuba — a każdy kolejny skan porównuje od startu, żeby korozja, wgniecenia i pęknięcia nigdy nie stały się awarią.",
    ctaPrimary: "Otwórz demo na żywo",
    ctaSecondary: "Obejrzyj film",
    ctaTertiary: "Dlaczego teraz",
    tags: ["Gaussian Splatting", "porównanie NN · szum 1,2 mm", "analiza offline, na pokładzie"],
    videoKicker: "INSP · 2026–09–12 · DUAL USE",
    videoTitle: "Kadłub → bliźniak → pomiary",
    videoTimer: "00:17",
    videoSub: "NAGRANIE → REKONSTRUKCJA → POMIAR",
    videoCap: "finalny film demo trafi w to miejsce — produkt działa na żywo już teraz",
    toast: "Film demo jest w montażu przed pitchingiem. Tymczasem otwórz produkt na żywo.",
    rec: "INSP",
    dateStamp: "2026–09–12",
  },
  problem: {
    kicker: "Problem",
    title: "Kadłub to najdroższa część statku, której nie widać.",
    subtitle:
      "Jedna usterka kadłuba to tygodnie w doku, statek zawietrzony, roszczenie ubezpieczeniowe — albo podatność w krytycznej infrastrukturze. A między przeglądami kadłub jest praktycznie niewidoczny.",
    costLabel: "Jedno niezlapane pęknięcie",
    costValue: "≈ 1–5 mln €",
    costHint: "naprawa + przestój + ubezpieczenie + odpowiedzialność (wartość poglądowa)",
  },
  bridge: {
    kicker: "Luka rynkowa",
    title: "Narzędzia istnieją. Wąskim gardłem nigdy nie była technologia — tylko to, kto potrafi jej używać.",
    subtitle: "Opcje dostępne dziś grają jakość przeciw kosztowi. HullSight przerywa ten kompromis.",
    head: ["Metoda", "Koszt", "Czas", "Kto", "Pokrycie", "Sedno"],
    rows: [
      { who: "Nurek i przegląd ROV", cost: "8–60 tys. € / dzień", speed: "dni–tygodnie", access: "tylko specjaliści", depth: "próbki punktowe", verdict: "poza zasięgiem rutynowych kontroli" },
      { who: "Pomiary ultradźwiękowe", cost: "20–80 tys. € / seria", speed: "dni", access: "certyfikowana załoga", depth: "pojedyncze blachy", verdict: "świetne tam, gdzie wiadomo; ślepe gdzie indziej" },
      { who: "Przegląd w suchym doku", cost: "50–400 tys. € / dok", speed: "tygodnie", access: "wolny termin doku", depth: "cały kadłub, co 5 lat", verdict: "zbyt rzadko, zbyt późno" },
      { who: "HullSight", cost: "telefon + spacer", speed: "minuty", access: "każdy członek załogi", depth: "cała powierzchnia, milimetry", verdict: "Każdy kurs to przegląd.", accent: true },
    ],
  },
  how: {
    kicker: "Jak to działa",
    title: "Trzy kroki. Bez dronów, nurków i doków.",
    subtitle:
      "Pipeline jest uczciwy: rejestracja przez bazowy serwer GS (COLMAP + Gaussian Splatting), analiza na wierzchu. Ten produkt pracuje po skanie — porównanie, historia i detekcja.",
    steps: [
      { n: "01", t: "Spacer wokół kadłuba z telefonem", d: "Członek załogi filmuje kadłub — kilkaset zdjęć, kilkanaście minut marszu. Żaden specjalistyczny czujnik, pilot ani certyfikat." },
      { n: "02", t: "Model 3D powstaje w kilka minut", d: "Serwer GS odtwarza powierzchnię jako model Gaussian Splatting. HullSight wpisuje go jako najnowszy skan jednostki." },
      { n: "03", t: "Porównaj. Wykryj. Zdecyduj.", d: "HullSight dopasowuje dowolne dwa skany, nanosi odchylenie od bazy, znajduje skupiska zmian i proponuje typ usterki — z historią od startu." },
    ],
    tech: [
      "Porównanie 3D najbliższych sąsiadów",
      "Agregacja regionów (u, v)",
      "Spójne składowe na siatce",
      "Próg szumu 1,2 mm",
      "Deterministyczna flota demo na realnych kadłubach",
    ],
  },
  detect: {
    kicker: "Co widzi HullSight",
    title: "Nie obrazek — pomiary.",
    subtitle: "Ten sam pipeline, który obsłuży prawdziwe rekonstrukcje, już dziś odczytuje wielkość, znak i kształt zmian z floty demo.",
    gridCaption: "Siatka regionów kadłuba · średnie odchylenie z ostatniego porównania",
    gridLegend: ["wgniecenie", "średnia", "wybrzuszenie"],
    defects: [
      { name: "Wgniecenie", en: "Dent", sev: "Krytyczne", mm: "−5,5 mm", d: "Nagłe uderzenie, stabilne między przeglądami — typ usterki, którą mają łapać przeglądy ROV." },
      { name: "Korozja", en: "Corrosion", sev: "Poważne", mm: "−4,0 mm", d: "Narasta między przeglądami na blachach dennych. Wcześnie to łatka; późno — wymiana blachy." },
      { name: "Pęknięcie", en: "Crack", sev: "Krytyczne", mm: "−2,2 mm", d: "Liniowe, późne, zawsze traktowane jako strukturalne niezależnie od głębokości. To ono zatrzymuje statek." },
      { name: "Ubytek powłoki", en: "Coating loss", sev: "Ostrzeżenie", mm: "−1,6 mm", d: "Wczesny sygnał przed korozją — najtańsza usterka do naprawienia, jeśli ją zobaczysz." },
      { name: "Porost biologiczny", en: "Biofouling", sev: "Ostrzeżenie", mm: "+3,2 mm", d: "Cykliczny wzrost między dokowaniami; każdego dnia podnosi opory i zużycie paliwa." },
    ],
  },
  dualuse: {
    kicker: "Dwa rynki, jeden pipeline",
    title: "Cywilna wartość dziś. Obronna wartość na tej samej powierzchni.",
    subtitle: "Jeden czujnik, jeden model, jeden rejestr — dwóch odbiorców.",
    civilian: { head: "CYWILNY", title: "Żegluga, która działa taniej i bezpieczniej", items: ["Przeglądy okresowe bez doku", "Dowód stanu kadłuba dla ubezpieczeń i klasy", "Planowanie utrzymania predykcyjnego", "Monitoring kadłubów portów i terminali", "Raporty stanu przy czarterach i sprzedaży"] },
    defense: { head: "DUAL USE · OBRONNOŚĆ", title: "Świadomość uszkodzeń i infrastruktury", items: ["Szybka ocena uszkodzeń po incydencie", "Monitoring kadłubów krytycznej infrastruktury Bałtyku", "Gotowość floty u baz przy minimalnej logistyce", "Dowód na poziomie blach w roszczeniach morskich", "Cyfrowe bliźniaki szkoleniowe własnych okrętów"] },
    line: "Bałtyk jest pierwszą linią. Następny przełom będzie żył po obu stronach — cywilnej i obronnej.",
  },
  proof: {
    kicker: "Dowody",
    title: "Już czyta realną flotę.",
    subtitle: "Dane demonstracyjne są deterministyczne: ta sama architektura, te same wskaźniki, ten sam wynik — do powtórzenia w każdej chwili.",
    stats: [
      { big: "5", unit: "", label: "jednostek z pełną historią skanów", note: "flota demo" },
      { big: "27", unit: "", label: "trajektorii usterek symulowanych i wykrytych", note: "deterministycznie" },
      { big: "1,2", unit: "mm", label: "próg szumu porównania", note: "dokumentowany" },
      { big: "2", unit: "", label: "rynki z jednego pipeline'u", note: "cywilny · obronny" },
    ],
    trendTitle: "Odchylenie kadłuba w historii skanów · „M/S Neptun Bałtycki”",
    trendCaption: "średnie i szczytowe odchylenie na skan",
    trendLegend1: "szczyt (max)",
    trendLegend2: "średnia (avg)",
    fleet: "Flota demo",
    toolingTitle: "Narzędzia",
    toolingText: "Monorepo TypeScript · React + Three.js · REST API (Express) · integracja Gaussian Splatting (GS Server) czyta prawdziwe modele .ply.",
    note: "Dane demo są syntetyczne — uczciwie oznaczone, żeby mentorzy mogli pytać. Pipeline (porównanie NN, agregacja regionów, detekcja skupisk) to prawdziwa architektura, gotowa na wczytywanie .ply na żywo.",
  },
  objections: {
    kicker: "Uczciwe pytania",
    title: "Odpowiadamy, zanim zapytacie.",
    items: [
      { q: "Czy to wystarczająco dokładne do klasyfikacji?", a: "Pipeline porównania raportuje odchylenie ze znakiem, z udokumentowanym progiem szumu 1,2 mm i rejestrem usterek jako wzorcem. Wizja wspiera inspektora — raport i tak podpisuje człowiek." },
      { q: "Dwa skany same się nie dopasują.", a: "Prawda — realne nagrania wymagają rejestracji (ICP / punkty odniesienia) przed porównaniem. To największy krok integracyjny; jest już opisany w dokumentacji architektury, nie ukrywany." },
      { q: "Statki pływają bez internetu.", a: "Analiza działa lokalnie / na pokładzie. Model GS powstaje tam, gdzie nagrane są dane; HullSight porównuje offline i synchronizuje wyniki, gdy pojawi się łączność." },
      { q: "Czemu nie dron podwodny?", a: "Drony wygrywają tam, gdzie linia wodna jest niedostępna. Na powierzchni i w doku telefon przechodzi kadłub w kilka minut przy ~1% środków — a załoga już go ma." },
    ],
  },
  cta: {
    kicker: "Oferta",
    title: "Weź to na swój statek i na swoje kontrakty.",
    subtitle: "Zarezerwuj 15-minutowe demo na żywo albo otwórz produkt i przewiń skany pięciu jednostek sam.",
    primary: "Zapisz się na pilota",
    secondary: "Otwórz demo na żywo",
    formLabel: "Bądź pierwszy w pilocie",
    formPlaceholder: "służbowy e-mail",
    formNote: "Pierwsze stocznie, porty i armatorzy dostaną pilota przed zimą — kolejka rośnie.",
    formOk: "Na liście. Odezwiemy się z dostępem do pilota.",
    note: "Zbudowane w 48 godzin na Baltic Dual Use Hackathon · Biblioteka Uniwersytetu Gdańskiego, wrzesień 2026",
  },
  footer: {
    tag: "HULLSIGHT",
    sub: "DUAL USE · GAUSSIAN SPLATTING · ANALIZA STATKÓW",
    colTech: "TECHNOLOGIA",
    colCtx: "KONTEKST",
    tech1: "Gaussian Splatting",
    tech2: "Porównanie najbliższych sąsiadów",
    tech3: "Detekcja skupisk usterek",
    tech4: "PL/EN · ciemny/jasny UI (aplikacja)",
    ctx1: "Baltic Dual Use Hackathon 2026",
    ctx2: "Ścieżka: drony i robotyka / AI",
    ctx3: "Biblioteka UG, Gdańsk",
    desc: "Technologia dual use: jeden cel w życiu codziennym, drugi w obronności i reagowaniu kryzysowym — Bałtyk 2026.",
    lang: "Wersja",
  },
};

const en: Copy = {
  nav: { platform: "Platform", dualUse: "Dual use", how: "How it works", live: "Proof", openApp: "Open demo", book: "Book demo" },
  hero: {
    chipTop: "BALTIC DUAL USE HACKATHON · GDANSK 2026",
    liveBadge: "LIVE · 5 vessels · hull geometry · 1.2 mm noise",
    h1Line1: "A ship at sea.",
    h1Line2: "A twin measured in millimetres.",
    sub:
      "HullSight turns routine phone footage into a measurable 3D twin of a hull — and compares every scan since launch, so corrosion, dents and cracks are caught before they become a casualty.",
    ctaPrimary: "Open the live demo",
    ctaSecondary: "Watch the film",
    ctaTertiary: "Why now",
    tags: ["Gaussian Splatting", "nearest-neighbour compare · 1.2 mm", "onboard, offline analysis"],
    videoKicker: "INSP · 2026–09–12 · DUAL USE",
    videoTitle: "Hull → twin → measurements",
    videoTimer: "00:17",
    videoSub: "CAPTURE → RECONSTRUCTION → MEASUREMENT",
    videoCap: "final demo film lands in this slot — the product works live meanwhile",
    toast: "The demo film is being cut before the pitch. Open the live product meanwhile.",
    rec: "INSP",
    dateStamp: "2026–09–12",
  },
  problem: {
    kicker: "The problem",
    title: "Hulls are the most expensive part you can't see.",
    subtitle:
      "A single hull defect can mean weeks in drydock, a grounded ship, an insurance claim — or a vulnerability in critical infrastructure. Yet between inspections, a hull is effectively invisible.",
    costLabel: "One bad crack, uncaught",
    costValue: "≈ €1–5M",
    costHint: "repair + downtime + insurance + liability (illustrative)",
  },
  bridge: {
    kicker: "The gap",
    title: "The tools exist. The bottleneck was never technology — it was who can use it.",
    subtitle: "Today's options trade capability against cost. HullSight breaks the tradeoff.",
    head: ["Method", "Cost", "Time", "Who", "Coverage", "Bottom line"],
    rows: [
      { who: "Diver & ROV survey", cost: "€8–60k / day", speed: "days–weeks", access: "specialists only", depth: "point samples", verdict: "out of reach for routine checks" },
      { who: "Ultrasonic gauging", cost: "€20–80k / run", speed: "days", access: "certified crew", depth: "single plates", verdict: "great where you know, blind elsewhere" },
      { who: "Drydock inspection", cost: "€50–400k / haul", speed: "weeks", access: "drydock slot", depth: "full hull, every 5 yrs", verdict: "too rare, too late" },
      { who: "HullSight", cost: "a phone + a walk", speed: "minutes", access: "any crew member", depth: "full surface, mm-level", verdict: "Every trip is a survey.", accent: true },
    ],
  },
  how: {
    kicker: "How it works",
    title: "Three steps. No drones. No divers. No drydock.",
    subtitle:
      "The pipeline is honest: capture via the base GS server (COLMAP + Gaussian Splatting), analysis on top. This product owns what happens after the scan — comparison, history and detection.",
    steps: [
      { n: "01", t: "Walk the hull with a phone", d: "A crew member shoots the hull — a few hundred photos, minutes of walking. No special sensor, no pilot, no certification." },
      { n: "02", t: "A 3D model is built in minutes", d: "The GS Server reconstructs the surface as a Gaussian Splatting model. HullSight registers it as the vessel's newest scan." },
      { n: "03", t: "Compare. Detect. Decide.", d: "HullSight aligns any two scans, maps deviation from baseline, finds change clusters and proposes the defect type — with history since launch." },
    ],
    tech: [
      "Nearest-neighbour 3D comparison",
      "Region aggregation (u, v)",
      "Connected components on mesh topology",
      "Noise floor 1.2 mm",
      "Deterministic demo fleet on real hull meshes",
    ],
  },
  detect: {
    kicker: "What HullSight sees",
    title: "Not just a picture — measurements.",
    subtitle: "The same pipeline that will run on real reconstructions already reads change magnitude, sign and shape from the demo fleet.",
    gridCaption: "Hull region grid · mean deviation from the latest comparison",
    gridLegend: ["dent", "mean", "bulge"],
    defects: [
      { name: "Wgniecenie", en: "Dent", sev: "Critical", mm: "−5.5 mm", d: "Sudden impact damage, stable between inspections — the kind ROV surveys are designed to find." },
      { name: "Korozja", en: "Corrosion", sev: "Serious", mm: "−4.0 mm", d: "Growing across inspections on bottom plates. Caught early, it's a patch job. Late, it's a plate replacement." },
      { name: "Pęknięcie", en: "Crack", sev: "Critical", mm: "−2.2 mm", d: "Linear, late-onset, flagged as structural regardless of depth. This is the one that grounds a ship." },
      { name: "Ubytek powłoki", en: "Coating loss", sev: "Warning", mm: "−1.6 mm", d: "Early warning before corrosion takes hold — the cheapest defect to fix, when you see it." },
      { name: "Porost biologiczny", en: "Biofouling", sev: "Warning", mm: "+3.2 mm", d: "Cyclical growth between dockings; raises drag and fuel burn for every extra day it stays." },
    ],
  },
  dualuse: {
    kicker: "Two markets, one pipeline",
    title: "Civilian value today. Defense value on the same surface.",
    subtitle: "One sensor, one model, one registry — two buyers.",
    civilian: { head: "CIVILIAN", title: "Shipping that runs safer & cheaper", items: ["Periodic inspection without drydock", "Ship condition evidence for insurance & class", "Predictive maintenance scheduling", "Port & terminal hull monitoring", "Charter & resale condition reports"] },
    defense: { head: "DUAL USE · DEFENSE", title: "Battle-damage & infrastructure awareness", items: ["Rapid hull damage assessment after incident", "Critical Baltic infrastructure hull monitoring", "Fleet readiness at base with minimal logistics", "Plate-level evidence for naval claims", "Training digital twins of own vessels"] },
    line: "The Baltic is the frontline. The next breakthrough will live on both sides — civilian and defense.",
  },
  proof: {
    kicker: "Proof over promises",
    title: "Already reading a real fleet.",
    subtitle: "The demo data is deterministic: the same architecture, the same metrics, the same result — reproducible at any time.",
    stats: [
      { big: "5", unit: "", label: "vessels with full scan histories", note: "demo fleet" },
      { big: "27", unit: "", label: "defect trajectories simulated & detected", note: "deterministically" },
      { big: "1.2", unit: "mm", label: "comparison noise floor", note: "documented" },
      { big: "2", unit: "", label: "markets from one pipeline", note: "civilian · defense" },
    ],
    trendTitle: "Hull deviation across scan history · „M/S Neptun Bałtycki”",
    trendCaption: "mean & peak deviation per scan",
    trendLegend1: "peak (max)",
    trendLegend2: "mean (avg)",
    fleet: "The demo fleet",
    toolingTitle: "Tooling",
    toolingText: "TypeScript monorepo · React + Three.js · Express REST API · Gaussian Splatting integration (GS Server) reads true .ply models.",
    note: "Demo data is synthetic — honestly labelled, so mentors can ask. The pipeline (NN comparison, region aggregation, cluster detection) is the real architecture, ready for live .ply ingest.",
  },
  objections: {
    kicker: "Fair questions",
    title: "Answered before you ask.",
    items: [
      { q: "Is it accurate enough for classification?", a: "The comparison pipeline reports signed deviation with a documented 1.2 mm noise floor and a curated defect registry as ground truth. Vision aids inspection; an inspector still signs the report." },
      { q: "Two scans don't align on their own.", a: "True — real captures need registration (ICP / reference points) before comparison. It is the single largest integration step and is already scoped in our architecture doc, not hidden." },
      { q: "Ships operate with no internet.", a: "Analysis runs on-premise / aboard. The GS model is trained where data is captured; HullSight compares locally and syncs findings when a link exists." },
      { q: "Why not an underwater drone?", a: "Drones win where waterline inspection is impossible. On the surface and in drydock, a phone walks the hull in minutes at ~1% of the capex — and your crew already has one." },
    ],
  },
  cta: {
    kicker: "The offer",
    title: "Put it on your hulls — and on your books.",
    subtitle: "Book a 15-minute live demo, or open the product and scrub through five vessels yourself.",
    primary: "Get pilot access",
    secondary: "Open the live product",
    formLabel: "Get early pilot access",
    formPlaceholder: "work email",
    formNote: "The first yards, ports and owners get pilot access before winter — the list grows daily.",
    formOk: "You're on the list. We'll reach out with pilot access.",
    note: "Built in 48 hours at the Baltic Dual Use Hackathon · University of Gdansk library, Sept 2026",
  },
  footer: {
    tag: "HULLSIGHT",
    sub: "DUAL USE · GAUSSIAN SPLATTING · SHIP ANALYSIS",
    colTech: "TECH",
    colCtx: "CONTEXT",
    tech1: "Gaussian Splatting",
    tech2: "Nearest-neighbour comparison",
    tech3: "Defect clustering",
    tech4: "PL/EN · light/dark UI (app)",
    ctx1: "Baltic Dual Use Hackathon 2026",
    ctx2: "Track: Drones & Robotics / AI",
    ctx3: "University of Gdansk library",
    desc: "Dual-use technology: one purpose in everyday life, another in defense and crisis response — Baltic 2026.",
    lang: "Language",
  },
};

export const DICTS: Record<Lang, Copy> = { pl, en };