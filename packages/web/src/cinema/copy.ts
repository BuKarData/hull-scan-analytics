export type Lang = "pl" | "en";

export interface Copy {
  nav: {
    platform: string;
    dualUse: string;
    how: string;
    live: string;
    demo: string;
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
    scrollHint: string;
    toast: string;
    rec: string;
    dateStamp: string;
    qrHook: string;
  };
  problem: { kicker: string; title: string; subtitle: string; costLabel: string; costValue: string; costHint: string };
  bridge: { kicker: string; title: string; subtitle: string; head: string[]; rows: { who: string; cost: string; speed: string; access: string; depth: string; verdict: string; accent?: boolean }[]; summaryLabel: string; summaryTime: string; summaryCost: string; summaryNote: string };
  how: { kicker: string; title: string; subtitle: string; steps: { n: string; t: string; d: string }[]; tech: string[] };
  status: {
    kicker: string;
    title: string;
    subtitle: string;
    phaseLabel: string;
    hatTag: string;
    hatFlag: string;
    hatTitle: string;
    hatItems: string[];
    midTag: string;
    midFlag: string;
    midTitle: string;
    midItems: string[];
    fatTag: string;
    fatFlag: string;
    fatTitle: string;
    fatItems: string[];
    aceNote: string;
    enamorTag: string;
    enamorTitle: string;
    enamorBody: string;
    sunreefTag: string;
    sunreefTitle: string;
    sunreefBody: string;
    modelTag: string;
    modelTitle: string;
    modelBody: string;
    craTag: string;
    craTitle: string;
    craBody: string;
    craItems: string[];
    quote: string;
  };
  market: {
    kicker: string;
    title: string;
    subtitle: string;
    claim: string;
    playersTitle: string;
    players: { name: string; what: string; lens: string }[];
    diffHead: string[];
    diffRows: [string, string, string][];
    gsdKicker: string;
    gsdTitle: string;
    gsdLead: string;
    gsdHead: string[];
    gsd: [string, string, string, string][];
    gsdFormula: string;
  };
  dualuse: { kicker: string; title: string; subtitle: string; line: string; civilian: { head: string; title: string; items: string[] }; defense: { head: string; title: string; items: string[] }; yard: { head: string; title: string; items: string[] }; consumer: { head: string; title: string; items: string[] }; moneyTitle: string; moneyCaption: string; money: { big: string; label: string; note: string }[] };
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
  cta: { vision: string; kicker: string; title: string; subtitle: string; primary: string; formNote: string; note: string };
  footer: { tag: string; sub: string; colTech: string; colCtx: string; tech1: string; tech2: string; tech3: string; tech4: string; ctx1: string; ctx2: string; ctx3: string; desc: string; lang: string };
}

const pl: Copy = {
  nav: { platform: "Platforma", dualUse: "Dual use", how: "Jak to działa", live: "Dowody", demo: "Demo (filmy)", openApp: "Otwórz demo", book: "Umów demo" },
  hero: {
    chipTop: "BALTIC DUAL USE HACKATHON · GDAŃSK 2026",
    liveBadge: "LIVE · 5 jednostek · geometria kadłuba · 1,2 mm szumu",
    h1Line1: "Skan kadłuba za 100 000 zł.",
    h1Line2: "Z kamer, które już masz.",
    sub: "Telefon, monitoring, dron — zwykłe nagranie daje mierzalny bliźniak 3D kadłuba. Drogi sprzęt i specjaliści? Niepotrzebni.",
    ctaPrimary: "Otwórz demo na żywo",
    ctaSecondary: "Jak to działa",
    ctaTertiary: "Dlaczego teraz",
    tags: ["Gaussian Splatting", "porównanie NN · szum 1,2 mm", "analiza offline, na pokładzie"],
    videoKicker: "INSP · 2026-09-12 · DUAL USE",
    videoTitle: "Kadłub → bliźniak → pomiary",
    videoTimer: "00:16",
    videoSub: "NAGRANIE → REKONSTRUKCJA → POMIAR",
    videoCap: "DEMO · H.264 · 1920×1080 · render 3D kadłuba HullSight",
    scrollHint: "Przewiń",
    toast: "Film demo startuje na pełnym ekranie — wyciszony, w pętli.",
    rec: "INSP",
    dateStamp: "2026-09-12",
    qrHook: "Oszczędź 100 000 zł. Zeskanuj →",
  },
  problem: {
    kicker: "Problem",
    title: "Kadłub to najdroższa część statku, której nie widać.",
    subtitle:
      "Statek dokuje średnio raz na 5 lat. Przez ten czas najdroższa część jednostki niszczeje niewidocznie: korozja pełza, powłoka odchodzi, pęknięcia czekają. Dziś łapiesz je za późno — albo wcale.",
    costLabel: "Jedno niezłapane pęknięcie",
    costValue: "≈ 4-21 mln zł",
    costHint: "naprawa + przestój + ubezpieczenie + odpowiedzialność · średnia szkoda kadłubowa ≈ 6 mln zł (baza IUMI, ~17 tys. roszczeń)",
  },
  bridge: {
    kicker: "Cena obecnych metod",
    title: "Manualnie: fortuna i tygodnie. Automatycznie: nagranie, które już masz.",
    subtitle: "Każda dzisiejsza metoda każe wybierać między jakością a kosztem. HullSight daje jedno i drugie — sprzętem, który już masz.",
    head: ["Metoda", "Koszt", "Czas", "Kto", "Pokrycie", "Sedno"],
    rows: [
      { who: "Nurek i przegląd ROV", cost: "35-260 tys. zł / dzień", speed: "dni-tygodnie", access: "tylko specjaliści", depth: "próbki punktowe", verdict: "płacisz za wizyty, nie za obraz" },
      { who: "Pomiary ultradźwiękowe", cost: "85-350 tys. zł / seria", speed: "dni", access: "certyfikowana załoga", depth: "pojedyncze blachy", verdict: "ślepe tam, gdzie nie szukasz" },
      { who: "Przegląd w suchym doku", cost: "215 tys.-1,7 mln zł / dok", speed: "tygodnie", access: "wolny termin doku", depth: "cały kadłub, co 5 lat", verdict: "za rzadko, za późno" },
      { who: "HullSight", cost: "kamery, które już masz (albo telefon)", speed: "minuty", access: "bez zmian — nagrywa to, co już nagrywa", depth: "cała powierzchnia, milimetry", verdict: "Każdy kurs to przegląd.", accent: true },
    ],
    summaryLabel: "HULLSIGHT · UCZCIWY RACHUNEK",
    summaryTime: "~15 minut nagrania + kilka minut GPU — mierzalny bliźniak kadłuba",
    summaryCost: "kilka złotych za przetwarzanie, 0 zł za sprzęt — kamery już stoją",
    summaryNote: "Bez nurka, bez terminu w doku, bez serii pomiarów. Koszt, który możesz powtórzyć przy każdym rejsie.",
  },
  how: {
    kicker: "Jak to działa",
    title: "Ciężką robotę robi maszyna. Nie ty.",
    subtitle: "Nie mierzysz, nie kalibrujesz, nie kursujesz na nurka. Nagrywasz — dopasowanie, odchylenie i detekcję robi HullSight.",
    steps: [
      { n: "01", t: "Zwykłe nagranie — choćby z samego monitoringu", d: "Telefon załoganta, dron albo kamera, która już stoi na nabrzeżu — wystarczy każde nagranie, w którym jest kadłub. Kilkanaście minut obrazu. Zero nowego sprzętu, zero certyfikatów." },
      { n: "02", t: "Model 3D powstaje sam", d: "Gaussian Splatting odtwarza powierzchnię z nagrania i wpisuje ją jako najnowszy skan jednostki. Nikt nie klika, nic nie mierzy." },
      { n: "03", t: "HullSight porównuje. Ty decydujesz.", d: "Maszyna dopasowuje każdy skan do bazy, nanosi odchylenie od stanu wyjściowego, grupuje skupiska zmian i proponuje typ usterki — z historią od pierwszego dnia." },
    ],
    tech: [
      "Porównanie 3D najbliższych sąsiadów",
      "Agregacja regionów (u, v)",
      "Spójne składowe na siatce",
      "Próg szumu 1,2 mm",
      "Deterministyczna flota demo na realnych kadłubach",
    ],
  },
  status: {
    kicker: "Status i zaufanie",
    title: "Między HAT a FAT stocznia trzyma kadłub. Tam jesteśmy.",
    subtitle: "Statek przechodzi próby portowe (HAT) i odbiór końcowy (FAT). W fazie między nimi stocznia musi regularnie utrzymywać kadłub i za to płacić — dokładnie tam działa HullSight.",
    phaseLabel: "FAZA ŻYCIA STATKU · HAT → FAT",
    hatTag: "HAT",
    hatFlag: "PO WODOWANIU",
    hatTitle: "Harbour Acceptance Test",
    hatItems: ["Statek w porcie stoczni — pierwsze próby na wodzie", "Kadłub po raz pierwszy narażony na styki i osiadanie", "Start historii pomiarów jednostki"],
    midTag: "MIĘDZY HAT A FAT",
    midFlag: "TU DZIAŁA HULLSIGHT",
    midTitle: "Faza, w której stocznia utrzymuje kadłub",
    midItems: ["Stocznia regularnie utrzymuje kadłub — i za to płaci", "Przegląd bez nurka, doku i ekip: kamera, która już stoi", "Skany dziś → mierzalne porównanie przy FAT"],
    fatTag: "FAT",
    fatFlag: "PRZY PRZEKAZANIU",
    fatTitle: "Final Acceptance Test",
    fatItems: ["Odbiór końcowy u armatora", "Dowód stanu kadłuba ze skanów, nie z okularów", "Bliźniak 3D przekazany z dokumentacją"],
    aceNote: "HullSight przechodzi tę samą drogę u siebie: własne FAT ✓ (zaliczone) → HAT w harmonogramie.",
    enamorTag: "KONTRAKT",
    enamorTitle: "ENAMOR — wstępny kontakt nawiązany",
    enamorBody: "Zapisali się na pokaz i ustalamy termin. Ich zespół techniczny zobaczy pipeline na żywo — nie slajdy.",
    sunreefTag: "RYNEK KONSUMENCKI",
    sunreefTitle: "Sunreef Yachts — czekamy na odpowiedź",
    sunreefBody: "Wysłaliśmy zapytanie o monitoring kadłubów jachtów. Konsument to trzeci rynek z tego samego pipeline'u.",
    modelTag: "MODEL AI",
    modelTitle: "Trenujemy sami, na otwartych podstawach",
    modelBody: "Otwarta implementacja Gaussian Splatting + model trenowany na danych kadłubowych. Zero black-boxów, zero licencji za skan — audytowalne i powielalne.",
    craTag: "CRA",
    craTitle: "Zgodność z EU Cyber Resilience Act — od pierwszego dnia",
    craBody: "Projektujemy pod CRA i bezpieczeństwo danych jednostki tak, żeby być audytowalnym i bez vendor lock-in. To nie deklaracja — to architektura.",
    craItems: [
      "Analiza offline, na pokładzie — nagranie nie musi opuszczać jednostki",
      "Szyfrowanie w spoczynku i w tranzycie · role i audyt",
      "SBOM + rejestr aktualizacji — gotowość pod CRA",
      "Model open-source: audytowalny, powielalny u klienta",
    ],
    quote: "Ten hackathon to dla nas akcelerator, nie meta. Zaraz po nim wychodzimy z tym na rynek — na wodę, z pilotami ENAMOR i armatorów Bałtyku.",
  },
  market: {
    kicker: "Rynek i konkurencja",
    title: "Konkurencja wysyła coś pod wodę. My zostajemy na brzegu — z kamerą, która już stoi.",
    subtitle: "Branża myśli sprzętem: ROV-y, roboty czyszczące, sonary, nurkowie. Ale kamera nad wodą już jest — wystarczy z niej skorzystać.",
    claim: "Żeby zrobić przegląd, oni muszą wysłać na miejsce ekipę, robota i logistykę. My potrzebujemy tylko nagrania, które i tak powstało.",
    playersTitle: "JAK GRAJĄ INNI",
    players: [
      { name: "Greensea IQ · EverClean", what: "robot czyszczący kadłub + sondy ultradźwiękowe", lens: "sprzedaje wizytę robota na kadłubie" },
      { name: "Blueye Robotics", what: "drony obserwacyjne do 150 m, ~4-5 tys. $", lens: "sprzedaje oko pod wodą i operatora w ekipie" },
      { name: "Subsea Tech", what: "ROV / USV do inspekcji UWILD", lens: "sprzedaje sprzęt i operatorów za dzień roboczy" },
      { name: "Smart Hull Sight", what: "fotogrametria 3D z nurków / ROV + AI", lens: "najbliżej nas — ale ktoś musi wejść do wody" },
    ],
    diffHead: ["Kategoria", "Oni", "My"],
    diffRows: [
      ["Narzędzie przy kadłubie", "ROV / robot / nurek w wodzie", "kamera, która już nagrywa — telefon, CCTV, dron"],
      ["Koszt pojedynczego przeglądu", "35-260 tys. zł / dzień + logistyka", "minuty GPU · 0 zł nowego sprzętu"],
      ["Częstotliwość", "raz do roku, gdy się zdecydują", "każdy rejs to kolejny skan"],
      ["Skalowanie", "więcej robotów i operatorów", "wzór + GPU — dokładność rośnie z kamerą klienta"],
    ],
    gsdKicker: "DOKŁADNOŚĆ ROŚNIE Z ROZDZIELCZOŚCIĄ",
    gsdTitle: "Kamera X przy res Y daje precyzję Z.",
    gsdLead: "To nie magia, tylko geometria: im gęstszy piksel na kadłubie, tym mniejszy detal do odczytania. Poniżej rozdzielczość pomiaru rzędu GSD dla typowych scen.",
    gsdHead: ["Źródło nagrania", "Rozdzielczość", "Dystans", "Rozdzielczość pomiaru"],
    gsd: [
      ["Telefon wyższej półki (48 MP)", "48 MP", "3-4 m", "≈ 1-2 mm"],
      ["Telefon (12 MP)", "12 MP", "4-5 m", "≈ 2-4 mm"],
      ["Kamera nabrzeża 4K (8 MP)", "8 MP", "6-10 m", "≈ 4-8 mm"],
      ["Kamera CCTV (2 MP)", "2 MP", "10-15 m", "≈ 8-15 mm"],
    ],
    gsdFormula: "GSD ≈ (wielkość sensora ÷ liczba pikseli) × dystans ÷ ogniskowa. Walidacje: fotogrametria smartfonowa vs. pomiar TLS/LiDAR — dokładność rzędu mm (ISPRS Archives XLVIII-2-2023, dane 1,1-14 m). Demo HullSight: próg 1,2 mm przy 48 MP.",
  },
  dualuse: {
    kicker: "Cztery rynki, jeden pipeline",
    title: "Czterech klientów kupuje ten sam wynik.",
    subtitle: "Cywilni armatorzy, obronność Bałtyku, stocznie w okresie gwarancyjnym i luksusowe jachty — jeden czujnik, jeden model, jeden rejestr.",
    civilian: { head: "CYWILNY · ARMATORZY", title: "Żegluga taniej i bezpieczniej", items: ["Przeglądy bez doku, nurków i czekania", "Dowód stanu kadłuba dla klasy i ubezpieczeń", "Naprawa planowana, zanim usterka zaskoczy", "Monitoring kadłubów portów i terminali", "Raporty stanu przy czarterach i sprzedaży"] },
    defense: { head: "DUAL USE · OBRONNOŚĆ", title: "Świadomość uszkodzeń i infrastruktury", items: ["Szybka ocena uszkodzeń po incydencie", "Monitoring kadłubów krytycznej infrastruktury Bałtyku", "Gotowość floty u bazy bez logistyki", "Dowód na poziomie blachy w roszczeniach morskich", "Bliźniaki szkoleniowe własnych okrętów"] },
    yard: { head: "STOCZNIE · GWARANCJA", title: "Kadłub, który stocznia musi utrzymywać", items: ["Nowy statek ma ~12 mies. gwarancji — stocznia regularnie utrzymuje kadłub i za to płaci", "Stocznie same szukają tańszego i lepszego przeglądu", "Monitoring kadłuba między przeglądami jako element gwarancji", "Dowód stanu kadłuba przy przekazaniu i w roszczeniach", "Bliźniak 3D sprzedawany razem z jednostką"] },
    consumer: { head: "KONSUMENCKI · SUNREEF", title: "Luksusowe jachty — monitoring bez ekipy", items: ["Zapytanie do Sunreef złożone — czekamy na odpowiedź", "Jacht 60-120 ft: kadłub to główny środek trwały", "Przegląd przed czarterem i przy sprzedaży", "Kamery jachtu i monitoring przy dokowaniu", "Zgłoszenie szkody ubezpieczycielowi z dowodem 3D"] },
    moneyTitle: "Ile to dziś płaci rynek",
    moneyCaption: "To liczby, które już są w obiegu — nie projekcje.",
    money: [
      { big: "≈ 6 mln zł", label: "średnia szkoda kadłubowa", note: "baza IUMI · ~17 tys. roszczeń" },
      { big: "35-260 tys. zł", label: "jeden dzień przeglądu ROV / nurków", note: "tyle dziś płaci armator" },
      { big: "2,5-10 mln €", label: "jacht klasy Sunreef", note: "przegląd kadłuba to jego ułamek; szkoda to całość" },
    ],
    line: "Krytyczna infrastruktura Bałtyku stoi na kadłubach. Kto je widzi, kontroluje grę.",
  },
  proof: {
    kicker: "Dowody, nie obietnice",
    title: "Działa — deterministycznie, na pięciu jednostkach.",
    subtitle: "Pełne historie skanów, 27 trajektorii usterek, udokumentowany próg szumu. Każdy wynik odtworzysz na własnym telefonie.",
    stats: [
      { big: "5", unit: "", label: "jednostek z pełną historią skanów", note: "flota demo" },
      { big: "27", unit: "", label: "trajektorii usterek wykrytych i opisanych", note: "deterministycznie" },
      { big: "1,2", unit: "mm", label: "udokumentowany próg szumu", note: "porównanie 3D" },
      { big: "4", unit: "", label: "rynki z jednego pipeline'u", note: "armatorzy · obronność · stocznie · jachty" },
    ],
    trendTitle: "Odchylenie kadłuba w historii skanów · „M/S Neptun Bałtycki”",
    trendCaption: "średnie i szczytowe odchylenie na skan",
    trendLegend1: "szczyt (max)",
    trendLegend2: "średnia (avg)",
    fleet: "Flota demo",
    toolingTitle: "Narzędzia",
    toolingText: "Monorepo TypeScript · React + Three.js · REST API (Express) · integracja Gaussian Splatting (GS Server) czyta prawdziwe modele .ply.",
    note: "Dane demo są syntetyczne — oznaczone uczciwie. Pipeline (porównanie NN, agregacja regionów, detekcja skupisk) to prawdziwa architektura, gotowa na wczytywanie .ply na żywo.",
  },
  objections: {
    kicker: "Pytania, które usłyszycie",
    title: "Odpowiadamy, zanim zapytacie.",
    items: [
      { q: "Czy to wystarczająco dokładne do klasyfikacji?", a: "Pipeline raportuje odchylenie ze znakiem, z udokumentowanym progiem szumu 1,2 mm i rejestrem usterek jako wzorcem. Wizja wspiera inspektora — raport i tak podpisuje człowiek." },
      { q: "Dwa skany same się nie dopasują.", a: "Prawda — realne nagrania wymagają rejestracji (ICP / punkty odniesienia) przed porównaniem. To największy krok integracyjny; jest opisany w dokumentacji architektury, nie ukrywany." },
      { q: "Statki pływają bez internetu.", a: "Analiza działa lokalnie / na pokładzie. Model GS powstaje tam, gdzie nagrano dane; HullSight porównuje offline i synchronizuje wyniki, gdy pojawi się łączność." },
      { q: "Czemu nie dron podwodny?", a: "Drony wygrywają tam, gdzie linia wodna jest niedostępna. Na powierzchni i w doku zwykłe nagranie — telefonem albo kamerą, która już stoi — pokrywa kadłub w kilka minut przy ~1% środków." },
    ],
  },
  cta: {
    vision: "Wizja: koniec próbek punktowych i wizyt w doku. Każdy kadłub mierzalny — z kamer, które już stoją.",
    kicker: "Oferta",
    title: "Twój pilot startuje — zanim zrobi to konkurencja.",
    subtitle: "Otwórz demo na żywo i sam przejrzyj pięć jednostek.",
    primary: "Otwórz demo na żywo",
    formNote: "Pierwsze stocznie, porty i armatorzy dostaną pilota przed zimą — ENAMOR już ustala termin pokazu. Kolejka rośnie.",
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
  nav: { platform: "Platform", dualUse: "Dual use", how: "How it works", live: "Proof", demo: "Demo (films)", openApp: "Open demo", book: "Book demo" },
  hero: {
    chipTop: "BALTIC DUAL USE HACKATHON · GDANSK 2026",
    liveBadge: "LIVE · 5 vessels · hull geometry · 1.2 mm noise",
    h1Line1: "A €25,000 hull scan.",
    h1Line2: "From cameras you already own.",
    sub: "Phone, dock CCTV or drone footage becomes a measurable 3D hull twin. No expensive kits, no specialists.",
    ctaPrimary: "Open the live demo",
    ctaSecondary: "How it works",
    ctaTertiary: "Why now",
    tags: ["Gaussian Splatting", "nearest-neighbour compare · 1.2 mm", "onboard, offline analysis"],
    videoKicker: "INSP · 2026-09-12 · DUAL USE",
    videoTitle: "Hull → twin → measurements",
    videoTimer: "00:16",
    videoSub: "CAPTURE → RECONSTRUCTION → MEASUREMENT",
    videoCap: "DEMO · H.264 · 1920×1080 · HullSight 3D hull render",
    scrollHint: "Scroll",
    toast: "The demo film runs full-screen — muted, looping.",
    rec: "INSP",
    dateStamp: "2026-09-12",
    qrHook: "Save €25,000. Scan →",
  },
  problem: {
    kicker: "The problem",
    title: "The most expensive hull is the one you can't see.",
    subtitle:
      "A ship drydocks about once every 5 years. In between, the most expensive part of the vessel — the hull — rots invisibly: corrosion creeps, coating peels, cracks wait. Today you catch them too late, or not at all.",
    costLabel: "One hairline crack, uncaught",
    costValue: "≈ PLN 4-21M",
    costHint: "repair + downtime + insurance + liability · average hull claim ≈ PLN 6M / US$1.4M (IUMI database, ~17k claims)",
  },
  bridge: {
    kicker: "What it costs today",
    title: "Manual: a fortune and weeks. Automated: the recording you already get.",
    subtitle: "Every current method forces a choice between quality and cost. HullSight delivers both — with hardware you already own.",
    head: ["Method", "Cost", "Time", "Who", "Coverage", "Bottom line"],
    rows: [
      { who: "Diver & ROV survey", cost: "PLN 35-260k / day", speed: "days-weeks", access: "specialists only", depth: "point samples", verdict: "you pay for visits, not a picture" },
      { who: "Ultrasonic gauging", cost: "PLN 85-350k / run", speed: "days", access: "certified crew", depth: "single plates", verdict: "blind where you don't think to look" },
      { who: "Drydock inspection", cost: "PLN 215k-1.7M / haul", speed: "weeks", access: "open drydock slot", depth: "full hull, every 5 yrs", verdict: "too rare, too late" },
      { who: "HullSight", cost: "cameras you already have (or a phone)", speed: "minutes", access: "no change — it records what already records", depth: "full surface, mm-level", verdict: "Every trip is a survey.", accent: true },
    ],
    summaryLabel: "HULLSIGHT · THE HONEST BILL",
    summaryTime: "~15 minutes of footage + a few minutes of GPU — a measurable hull twin",
    summaryCost: "a few PLN of compute, PLN 0 of hardware — the cameras already stand there",
    summaryNote: "No diver, no drydock slot, no survey series. A cost you can repeat on every voyage.",
  },
  how: {
    kicker: "How it works",
    title: "The machine does the hard work. Not you.",
    subtitle: "You don't measure, calibrate or get certified. You shoot footage — registration, deviation and detection are on HullSight.",
    steps: [
      { n: "01", t: "An ordinary recording — even one CCTV already makes", d: "A crew phone, a drone, or the camera already watching the berth — any footage the hull appears in is enough. Ten minutes of footage. No new hardware, no certifications." },
      { n: "02", t: "The 3D model builds itself", d: "Gaussian Splatting reconstructs the surface and logs it as the vessel's newest scan. Nobody clicks, nothing gets measured." },
      { n: "03", t: "HullSight compares. You decide.", d: "It aligns every scan to baseline, maps deviation, clusters change regions and suggests the defect type — with full history since day one." },
    ],
    tech: [
      "Nearest-neighbour 3D comparison",
      "Region aggregation (u, v)",
      "Connected components on mesh topology",
      "Noise floor 1.2 mm",
      "Deterministic demo fleet on real hull meshes",
    ],
  },
  status: {
    kicker: "Status & trust",
    title: "Between HAT and FAT a yard holds the hull. That's where we are.",
    subtitle: "A vessel goes through harbour acceptance (HAT) and final acceptance (FAT). In the phase between, the yard must maintain the hull at its own cost — that is exactly where HullSight works.",
    phaseLabel: "VESSEL LIFECYCLE PHASE · HAT → FAT",
    hatTag: "HAT",
    hatFlag: "AFTER LAUNCH",
    hatTitle: "Harbour Acceptance Test",
    hatItems: ["Vessel in the yard's port — first trials on the water", "The hull's first exposure to contacts and settling", "The start of the vessel's measurement history"],
    midTag: "BETWEEN HAT AND FAT",
    midFlag: "HULLSIGHT APPLIES HERE",
    midTitle: "The phase where the yard looks after the hull",
    midItems: ["The yard maintains the hull — and pays for it", "Survey without a diver, drydock or crew: the camera already standing there", "Scans today → a measurable comparison at FAT"],
    fatTag: "FAT",
    fatFlag: "AT HANDOVER",
    fatTitle: "Final Acceptance Test",
    fatItems: ["Final handover to the owner", "Hull condition evidence from scans, not eyeballs", "A 3D twin handed over with the documentation"],
    aceNote: "HullSight walks the same path itself: its own FAT ✓ (done) → HAT on schedule.",
    enamorTag: "CONTRACT",
    enamorTitle: "ENAMOR — initial contact made",
    enamorBody: "They've signed up for the show. We're scheduling so their technical team sees the pipeline live — not slides.",
    sunreefTag: "CONSUMER MARKET",
    sunreefTitle: "Sunreef Yachts — awaiting their reply",
    sunreefBody: "We sent a query about hull monitoring for yachts. Consumer is the third market for the same pipeline.",
    modelTag: "AI MODEL",
    modelTitle: "We train it ourselves, on open foundations",
    modelBody: "Open Gaussian Splatting implementation + a model trained on hull data. Zero black boxes, zero per-scan licences — auditable and reproducible.",
    craTag: "CRA",
    craTitle: "EU Cyber Resilience Act ready — from day one",
    craBody: "We build for CRA and vessel data security so we stay auditable and vendor-neutral. That's architecture, not a statement.",
    craItems: [
      "Offline, onboard analysis — footage never has to leave the vessel",
      "Encryption at rest and in transit · roles and audit",
      "SBOM + update registry — CRA-ready",
      "Open-source model — auditable, re-runnable at the client",
    ],
    quote: "This hackathon is an accelerator for us, not the finish line. Right after it we take this to market — on the water, with ENAMOR and Baltic owners on pilot.",
  },
  market: {
    kicker: "Market & competition",
    title: "Competitors send something into the water. We stay ashore — with the camera that's already there.",
    subtitle: "The industry thinks in hardware: ROVs, cleaning robots, sonars, divers. But the camera above the waterline already exists — we just use it.",
    claim: "To run a survey, they must dispatch a crew, a robot and logistics. We only need the footage that was recorded anyway.",
    playersTitle: "HOW THE OTHERS PLAY",
    players: [
      { name: "Greensea IQ · EverClean", what: "hull-cleaning robot + ultrasonic probes", lens: "sells a robot visit on the hull" },
      { name: "Blueye Robotics", what: "observation drones to 150 m, ~$4-5k", lens: "sells an underwater eye and an operator on crew" },
      { name: "Subsea Tech", what: "ROV / USV for UWILD inspections", lens: "sells gear and operators by the working day" },
      { name: "Smart Hull Sight", what: "3D photogrammetry from divers / ROV + AI", lens: "closest to us — but someone still has to go into the water" },
    ],
    diffHead: ["Category", "Them", "Us"],
    diffRows: [
      ["Tool at the hull", "ROV / robot / diver in the water", "a camera that already records — phone, CCTV, drone"],
      ["Cost of one survey", "PLN 35-260k / day + logistics", "minutes of GPU · PLN 0 new hardware"],
      ["Frequency", "once a year, when they decide", "every voyage is another scan"],
      ["Scaling", "more robots and operators", "a model + GPU — accuracy grows with the client's camera"],
    ],
    gsdKicker: "ACCURACY GROWS WITH RESOLUTION",
    gsdTitle: "Camera X at res Y gives accuracy Z.",
    gsdLead: "Not magic — geometry: the denser the pixel on the hull, the smaller the detail you can read. Below, measurement resolution on the order of GSD for typical capture scenes.",
    gsdHead: ["Capture source", "Resolution", "Distance", "Measurement resolution"],
    gsd: [
      ["Premium-tier phone (48 MP)", "48 MP", "3-4 m", "≈ 1-2 mm"],
      ["Phone (12 MP)", "12 MP", "4-5 m", "≈ 2-4 mm"],
      ["Berth camera 4K (8 MP)", "8 MP", "6-10 m", "≈ 4-8 mm"],
      ["CCTV camera (2 MP)", "2 MP", "10-15 m", "≈ 8-15 mm"],
    ],
    gsdFormula: "GSD ≈ (sensor width ÷ pixels) × distance ÷ focal length. Validation: smartphone photogrammetry vs TLS/LiDAR ground truth — mm-level accuracy (ISPRS Archives XLVIII-2-2023, 1.1-14 m range). HullSight demo: 1.2 mm noise floor at 48 MP.",
  },
  dualuse: {
    kicker: "Four markets, one pipeline",
    title: "Four buyers purchase the same output.",
    subtitle: "Civilian owners, Baltic defense, shipyards in warranty and luxury yachts — one sensor, one model, one registry.",
    civilian: { head: "CIVILIAN · OWNERS", title: "Shipping that runs safer & cheaper", items: ["Inspection without drydock, divers or waiting", "Hull condition evidence for class and insurers", "Repairs scheduled before they surprise you", "Port and terminal hull monitoring", "Charter and resale condition reports"] },
    defense: { head: "DUAL USE · DEFENSE", title: "Damage and infrastructure awareness", items: ["Rapid hull damage assessment after an incident", "Monitoring Baltic critical-infrastructure hulls", "Fleet readiness at base with no logistics drag", "Plate-level evidence for naval claims", "Training twins of your own vessels"] },
    yard: { head: "SHIPYARDS · WARRANTY", title: "The hull a yard must look after", items: ["Newbuilds carry ~12 months of warranty — the yard maintains the hull at its own cost", "Yards are actively hunting for cheaper, better surveys", "Hull monitoring between surveys as a warranty element", "Hull condition evidence at delivery and in claims", "A 3D twin sold alongside the vessel"] },
    consumer: { head: "CONSUMER · SUNREEF", title: "Luxury yachts — monitoring without a crew", items: ["Sunreef query sent — awaiting their reply", "A 60-120 ft yacht's hull is its core asset", "Pre-charter and resale surveys", "Yacht cameras + berthing monitoring", "Insurance claims with a 3D evidence record"] },
    moneyTitle: "What this market already pays",
    moneyCaption: "Numbers already in circulation — not projections.",
    money: [
      { big: "≈ PLN 6M", label: "average hull claim", note: "IUMI database · ~17k claims" },
      { big: "PLN 35-260k", label: "one day of ROV / diver survey", note: "what an owner pays today" },
      { big: "€2.5-10M", label: "a Sunreef-class yacht", note: "a survey is a fraction; a claim is the whole" },
    ],
    line: "Baltic critical infrastructure sits on hulls. Whoever sees them controls the game.",
  },
  proof: {
    kicker: "Proof, not promises",
    title: "It works — deterministically, on five vessels.",
    subtitle: "Full scan histories, 27 defect trajectories, a documented noise floor. Reproduce any result on your own phone.",
    stats: [
      { big: "5", unit: "", label: "vessels with full scan histories", note: "demo fleet" },
      { big: "27", unit: "", label: "defect trajectories found & described", note: "deterministically" },
      { big: "1.2", unit: "mm", label: "documented comparison noise floor", note: "3D comparison" },
      { big: "4", unit: "", label: "markets from one pipeline", note: "owners · defense · yards · yachts" },
    ],
    trendTitle: "Hull deviation across scan history · „M/S Neptun Bałtycki”",
    trendCaption: "mean & peak deviation per scan",
    trendLegend1: "peak (max)",
    trendLegend2: "mean (avg)",
    fleet: "The demo fleet",
    toolingTitle: "Tooling",
    toolingText: "TypeScript monorepo · React + Three.js · Express REST API · Gaussian Splatting integration (GS Server) reads true .ply models.",
    note: "Demo data is synthetic — honestly labelled. The pipeline (NN comparison, region aggregation, cluster detection) is the real architecture, ready for live .ply ingest.",
  },
  objections: {
    kicker: "Questions you'll hear",
    title: "Answered before you ask.",
    items: [
      { q: "Is it accurate enough for classification?", a: "The pipeline reports signed deviation with a documented 1.2 mm noise floor and a curated defect registry as ground truth. Vision aids inspection; an inspector still signs the report." },
      { q: "Two scans don't align on their own.", a: "True — real captures need registration (ICP / reference points) before comparison. It is the largest integration step and is already scoped in our architecture doc, not hidden." },
      { q: "Ships operate with no internet.", a: "Analysis runs on-premise / aboard. The GS model is built where footage is captured; HullSight compares locally and syncs findings when a link exists." },
      { q: "Why not an underwater drone?", a: "Drones win where the waterline is inaccessible. On the surface and in drydock, an ordinary recording — by phone or a camera that already stands there — covers the hull in minutes at ~1% of the capex." },
    ],
  },
  cta: {
    vision: "The vision: the end of point samples and drydock visits. Every hull measurable — from the cameras already there.",
    kicker: "The offer",
    title: "Your pilot slot is now — before competitors take it.",
    subtitle: "Open the live demo and scrub through five vessels.",
    primary: "Open the live demo",
    formNote: "The first yards, ports and owners get pilot access before winter — ENAMOR is already scheduling a show. The list grows daily.",
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