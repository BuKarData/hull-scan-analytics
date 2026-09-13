export type Lang = "pl" | "en";

export interface FilmCopy {
  id: string;
  n: string;
  tag: string;
  step: string;
  title: string;
  pull: string;
  desc: string;
}

export interface UseCase {
  name: string;
  what: string;
  why: string;
}

export interface Copy {
  nav: { landing: string; films: string; app: string };
  ticker: string[];
  hero: {
    kicker: string;
    h1Line1: string;
    h1Line2: string;
    sub: string;
    note: string;
    ctaPrimary: string;
    ctaSecondary: string;
    ctaTertiary: string;
  };
  watch: { kicker: string; title: string; items: string[] };
  films: { kicker: string; title: string; subtitle: string; sound: string; plays: string; list: FilmCopy[] };
  uses: { kicker: string; title: string; subtitle: string; line: string; whyLabel: string; cases: UseCase[] };
  quiz: { kicker: string; title: string; hint: string; items: string[]; empty: string; lo: string; hi: string };
  faq: { kicker: string; title: string; items: { q: string; a: string }[] };
  offer: { kicker: string; title: string; subtitle: string; primary: string; secondary: string; note: string; finaleCaption: string };
  footer: { tag: string; sub: string; colTech: string; colCtx: string; tech1: string; tech2: string; tech3: string; tech4: string; ctx1: string; ctx2: string; ctx3: string; desc: string; lang: string; back: string };
}

const pl: Copy = {
  nav: { landing: "Strona główna", films: "Filmy", app: "Otwórz demo na żywo" },
  ticker: [
    "DWA SKANY + CZAS = DECYZJA",
    "TELEFON ZAMIAST DOKU",
    "POMIAR, NIE GRAFIKA",
    "ZOBACZ ZMIANĘ, ZANIM STANIE SIĘ AWARIĄ",
    "PORT: KAMERA + PIPELINE = SENSOR",
    "KADŁUB = KLAWIATURA · USTERKA = KEYCAP",
  ],
  hero: {
    kicker: "HULLSIGHT · DEMO PIPELINE'U",
    h1Line1: "Dwa skany. Jedna różnica.",
    h1Line2: "Kółko na ekranie mówi resztę.",
    sub: "Trzy filmy pokazują, jak naprawdę działa nasz pipeline: telefon → model 3D → porównanie → znacznik na ekranie. Bez statku na scenie, bez retuszu. Każdy punkt to wynik algorytmu, nie prezentera.",
    note: "3 FILMY · ~4 MINUTY · WYSTARCZY TWÓJ TELEFON",
    ctaPrimary: "Odpal filmy",
    ctaSecondary: "Otwórz demo na żywo",
    ctaTertiary: "Czy to Twój przypadek?",
  },
  watch: {
    kicker: "Zero konfiguracji",
    title: "Przewiń i oglądaj. Resztę robimy my.",
    items: [
      "Film startuje sam, gdy wejdzie w kadr — niczego nie klikasz.",
      "Startuje wyciszony i w pętli. Kliknięcie w film przełącza dźwięk.",
      "Żadnych logo, linków i okienek. Sam obraz i wynik.",
    ],
  },
  films: {
    kicker: "Filmy = pipeline",
    title: "Trzy kroki. Jeden telefon. Jedna decyzja.",
    subtitle: "To nie film o statku. To trzy realne demonstracje tego, co już działa — i co wkrótce pojedzie na Twoje aktywa.",
    sound: "Kliknij → dźwięk",
    plays: "startuje sam",
    list: [
      {
        id: "5n4iwuHCuAw",
        n: "01",
        tag: "KROK 01",
        step: "NAGRANIE → MODEL 3D",
        title: "Nagranie telefonem. Model 3D buduje się na żywo.",
        pull: "Zanim cokolwiek porównasz, musisz mieć model.",
        desc: "Surowe nagranie obiektu — kamera przechodzi dookoła, a rekonstrukcja 3D rośnie na ekranie. To jest krok pierwszy u każdego, kto mierzy cokolwiek: najpierw cyfrowy bliźniak, potem wnioski. Twój telefon wystarczy.",
      },
      {
        id: "WPPjMJByCIY",
        n: "02",
        tag: "KROK 02",
        step: "DWA SKANY → RÓŻNICA",
        title: "Dwa skany. Jedna różnica. Kółko na ekranie.",
        pull: "Klawiatura to kadłub. Keycap to usterka.",
        desc: "Najpierw klawiatura bez keycapa, nad nią warstwa chmury punktów, potem drugi skan, w którym keycap wrócił. System filtruje obie warstwy i zaznacza na ekranie dokładnie to, co się zmieniło. Ten moment — dwa skany w czasie, jedna pokazana różnica — to jest to, co kupujesz.",
      },
      {
        id: "bC57r_pGK9o",
        n: "03",
        tag: "KROK 03",
        step: "KAMERA → MONITORING",
        title: "Kamera widzi. Pipeline mierzy. Ciągle.",
        pull: "Raz widziane — mierzone za każdym razem.",
        desc: "Wirtualna kamera obserwuje cyfrową scenę, a obiekt — kółko na ekranie — porusza się w modelu 3D, który ta kamera widzi. Ta sama zasada co portowa kamera na Twoim obiekcie: kolejne obserwacje spinane w jedną mapę zmian. Kamera może mrugnąć — pierścień nie.",
      },
    ],
  },
  uses: {
    kicker: "Nie tylko kadłuby",
    title: "Nie sprzedajemy statków. Sprzedajemy zasadę: cokolwiek sfotografujesz, zmierzysz.",
    subtitle: "Gaussian Splatting nie wie, co filmujesz — wie, jak odtworzyć powierzchnię w milimetrach. My dodajemy porównanie skanów i rejestr zmian. Reszta to Twój przypadek.",
    line: "Jeśli obiekt da się obejść z telefonem albo postawić przed nim kamerę — da się go porównywać i monitorować, zanim zmiana przestanie być tania.",
    whyLabel: "Dlaczego się opłaca:",
    cases: [
      { name: "Żurawie i dźwigi", what: "Stałe odkształcenia wysięgników, ramion i podwozi", why: "Przegląd z ziemi telefonem — zamiast platform, podnośników i przestoju" },
      { name: "Zbiorniki i ładownie", what: "Stan blach, spoiny, wgniecenia, ubytki powłoki", why: "Inspekcja bez opróżniania, czyszczenia i prac na wysokości" },
      { name: "Mosty i wiadukty", what: "Rysy, przemieszczenia, ubytki betonu", why: "Mapowanie całego obiektu w godzinę kosztem spaceru" },
      { name: "Maszyny budowlane i kopalniane", what: "Odkształcenia ramion, osprzętu i osłon", why: "Twardy dowód stanu przy wynajmie, transporcie i roszczeniach" },
      { name: "Wieże, pylony i wiatraki", what: "Geometria fundamentu, stan powłok", why: "Regularny monitoring bez wstrzymywania instalacji" },
      { name: "Strefa i aktywa portowe", what: "Kamera już tam jest — dołóż do niej pomiar", why: "Wykorzystaj istniejący monitoring CCTV jako sensor liczbowy" },
    ],
  },
  quiz: {
    kicker: "Czy to Twój przypadek?",
    title: "Wszystkie sześć kiedyś Cię ugryzło. Wskaż te, które pamiętasz.",
    hint: "Nic nie wysyłasz. Klikasz te, które bolą — my tylko liczymy.",
    items: [
      "Ktoś inny uszkodził coś Twojego i mówi: „to było wcześniej”. Nie masz pomiaru sprzed — więc płacisz Ty.",
      "Kupiłeś używane, a po odbiorze wgniecenie, którego nie ma na ogłoszeniu. „Nie u mnie” — i nie masz czym tego zbić.",
      "Po gradzie albo kolizji rzeczoznawca pyta „jak to wyglądało wcześniej”, a Ty pokazujesz zdjęcie z komórki. To mu nie wystarcza.",
      "Gwarancja skończyła się tydzień przed awarią. Bez zapisu stanu sprzed — „wina eksploatacja” — płacisz sam.",
      "Coś Ci się od lat ugina, pęka albo schodzi i sprawdzasz „na oko”, bo nikt tego nie mierzy. I nadal jest Twoje.",
      "Zapłaciłeś za naprawę, a ubytek wrócił. „Zawsze tak było” — bez pomiaru przed i po jesteś bezradny.",
    ],
    empty: "Nic nie pasuje? Wybierz ostatnią — jest dla każdego, kto tak mówi.",
    lo: "Widzisz wzór: płacisz za czyjeś „było” i „po”. Weź telefon i sfilmuj coś — następnym razem Ty pokażesz liczbę.",
    hi: "Sparzyłeś się na serio — i to kilka razy. Otwórz demo, sfilmuj telefonem przedmiot, o którym teraz myślisz, i zobacz, co pipeline z niego wyciąga.",
  },
  faq: {
    kicker: "Uczciwe pytania",
    title: "Odpowiadamy, zanim zapytasz.",
    items: [
      { q: "Gdzie jest statek? Widzę tylko klawiaturę i wirtualne sceny.", a: "Celowo nie ma statku — na hackathonie nie mamy doku. Pokazujemy pipeline, nie rekwizyty. W filmie 02 keycap to usterka, klawiatura to kadłub: dwa skany w czasie, różnica wskazana na ekranie. Mechanizm na kadłubie jest identyczny." },
      { q: "Czy to dokładność, czy ładna grafika?", a: "Określona liczba: próg porównania to dokumentowany poziom szumu 1,2 mm. Kółko na różnicy to wynik algorytmu porównania sąsiedztwa warstw 3D — nie ręczna adnotacja." },
      { q: "Autostart? Zaraz coś zagra mi z głośników?", a: "Nie. Wszystkie filmy startują wyciszone i w pętli. Dźwięk przełączasz kliknięciem na film." },
      { q: "Kiedy zobaczę to na prawdziwym skanie kadłuba?", a: "Pipeline czyta te same struktury, co realny model Gaussian Splatting (.ply z GS Server). Dane demo są uczciwie oznaczone; produkcja to podpięcie realnego API — krok opisany w dokumentacji, nie ukrywany." },
    ],
  },
  offer: {
    kicker: "Oferta",
    title: "Narzędzie, które zarabia, gdy wszystko inne stoi.",
    subtitle: "Otwórz demo na żywo i sam przeskanuj pięć jednostek. Albo przewiń te filmy jeszcze raz. Zero formularzy, zero kalendarza, zero przymusu.",
    primary: "Otwórz demo na żywo",
    secondary: "Zobacz filmy jeszcze raz",
    note: "HULLSIGHT · BALTIC DUAL USE HACKATHON 2026 · GDAŃSK · ZBUDOWANE W 48 GODZIN NA REALNYCH GEOMETRIACH",
    finaleCaption: "Kadłub od środka, dokładnie tak jak widzi go HullSight",
  },
  footer: {
    tag: "HULLSIGHT",
    sub: "DUAL USE · GAUSSIAN SPLATTING · PORÓWNANIE POWIERZCHNI",
    colTech: "TECHNOLOGIA",
    colCtx: "KONTEKST",
    tech1: "Gaussian Splatting",
    tech2: "Porównanie skanów w czasie",
    tech3: "Indykacja różnic (kółko na ekranie)",
    tech4: "PL/EN",
    ctx1: "Baltic Dual Use Hackathon 2026",
    ctx2: "Ścieżka: drony i robotyka / AI",
    ctx3: "Biblioteka UG, Gdańsk",
    desc: "Dwa nagrania telefonem → model 3D → różnica wskazana na ekranie. Pomiar, decyzja, zero wymówek.",
    lang: "Wersja",
    back: "Wróć na stronę główną",
  },
};

const en: Copy = {
  nav: { landing: "Home", films: "Films", app: "Open the live demo" },
  ticker: [
    "TWO SCANS + TIME = DECISION",
    "A PHONE INSTEAD OF A DRYDOCK",
    "MEASUREMENT, NOT GRAPHICS",
    "SEE THE CHANGE BEFORE IT BECOMES A CASUALTY",
    "PORT: CAMERA + PIPELINE = SENSOR",
    "HULL = KEYBOARD · DEFECT = KEYCAP",
  ],
  hero: {
    kicker: "HULLSIGHT · PIPELINE DEMO",
    h1Line1: "Two scans. One difference.",
    h1Line2: "Let the circle on screen say the rest.",
    sub: "Three films show how our pipeline actually works: phone → 3D model → comparison → a marker on screen. No ship on stage, no retouching. Every point is an algorithm output, not a presenter.",
    note: "3 FILMS · ~4 MINUTES · YOUR PHONE IS ENOUGH",
    ctaPrimary: "Play the films",
    ctaSecondary: "Open the live demo",
    ctaTertiary: "Is this your case?",
  },
  watch: {
    kicker: "Zero setup",
    title: "Scroll and watch. We do the rest.",
    items: [
      "The film starts on its own the moment it enters the screen — you click nothing.",
      "It starts muted and looping. Click a film to toggle sound.",
      "No logos, no links, no popups. Just the image and the result.",
    ],
  },
  films: {
    kicker: "Films = pipeline",
    title: "Three steps. One phone. One decision.",
    subtitle: "This isn't a ship film. It's three live demos of what already works — and what will soon run on your assets.",
    sound: "Click → sound",
    plays: "starts on its own",
    list: [
      {
        id: "5n4iwuHCuAw",
        n: "01",
        tag: "STEP 01",
        step: "CAPTURE → 3D MODEL",
        title: "Phone footage. The 3D model builds in real time.",
        pull: "Before you compare anything, you need a model.",
        desc: "Raw footage of an object — the camera walks around and the 3D reconstruction grows on screen. This is step one for anyone who measures anything: first a digital twin, then conclusions. Your phone is enough.",
      },
      {
        id: "WPPjMJByCIY",
        n: "02",
        tag: "STEP 02",
        step: "TWO SCANS → DIFFERENCE",
        title: "Two scans. One difference. A circle on screen.",
        pull: "The keyboard is the hull. The keycap is the defect.",
        desc: "First a keyboard missing its keycap, then a point-cloud layer, then a second scan where the keycap is back. The pipeline filters both layers and marks exactly what changed. That moment — two scans in time, one highlighted difference — is what you're buying.",
      },
      {
        id: "bC57r_pGK9o",
        n: "03",
        tag: "STEP 03",
        step: "CAMERA → MONITORING",
        title: "A camera sees. The pipeline measures. Continuously.",
        pull: "Seen once — measured every time.",
        desc: "A virtual camera watches a digital scene while an object — the circle on screen — moves inside the 3D model the camera sees. The same principle as a port camera on your asset: successive observations woven into one map of change. The camera may blink. The ring doesn't.",
      },
    ],
  },
  uses: {
    kicker: "Not just hulls",
    title: "We're not selling ships. We're selling a principle: anything you photograph, you can measure.",
    subtitle: "Gaussian Splatting doesn't know what you film — it knows how to reconstruct a surface to the millimetre. We add scan comparison and a change registry. The rest is your case.",
    line: "If an asset can be walked with a phone or watched by a camera, it can be compared and monitored before the change stops being cheap.",
    whyLabel: "Why it pays off:",
    cases: [
      { name: "Cranes and hoists", what: "Permanent deformation of booms, arms and chassis", why: "Ground-level phone inspection — no platforms, no downtime" },
      { name: "Tanks and holds", what: "Plate condition, welds, dents, coating loss", why: "Inspection without emptying, cleaning or working at height" },
      { name: "Bridges and viaducts", what: "Cracks, displacements, concrete spalling", why: "Whole-structure mapping in an hour, at the cost of a walk" },
      { name: "Construction & mining machinery", what: "Deformation of arms, attachments and guards", why: "Hard condition evidence for rental, transport and claims" },
      { name: "Towers, pylons and wind assets", what: "Foundation geometry, coating condition", why: "Regular monitoring without stopping the installation" },
      { name: "Ports and supervised assets", what: "The camera is already there — add measurement", why: "Turn existing CCTV into a numeric sensor for free" },
    ],
  },
  quiz: {
    kicker: "Is this your case?",
    title: "All six have bitten you before. Tick the ones you remember.",
    hint: "You submit nothing. Tick what hurt — we just count.",
    items: [
      "Someone else damaged your stuff and says “it was like that before”. You have no prior measurement — so you pay.",
      "You bought used; after pickup there's a dent the listing didn't show. “Not mine” — and you can't counter it.",
      "After hail or a crash the assessor asks “what did it look like before?” — you show a phone photo. It doesn't count.",
      "The warranty expired a week before the failure. No record of the prior state — “normal wear” — you pay it yourself.",
      "Something of yours bends, cracks or wears for years and you check it by eye, because nobody measures it. And it's still yours.",
      "You paid for a repair and the defect came back. “It was always like that” — without a before/after measurement you're helpless.",
    ],
    empty: "Nothing fits? Pick the last one — it's for everyone who says that.",
    lo: "See the pattern: you pay for someone else's “was” and “is”. Take your phone and film something — next time you show the number.",
    hi: "You've been burned for real — more than once. Open the demo, film that object you're thinking of right now, and see what the pipeline pulls out of it.",
  },
  faq: {
    kicker: "Fair questions",
    title: "Answered before you ask.",
    items: [
      { q: "Where's the ship? I see a keyboard and virtual scenes.", a: "On purpose, there's no ship — at a hackathon we don't have a drydock. We show the pipeline, not props. In film 02 the keycap is the defect, the keyboard is the hull: two scans in time, one difference on screen. The mechanism on a hull is identical." },
      { q: "Is this accuracy, or just pretty graphics?", a: "A documented number: the comparison threshold is a 1.2 mm noise floor. The circle on the difference is the output of a 3D nearest-neighbour comparison algorithm — not a hand-drawn annotation." },
      { q: "Autoplay? Will it blast out of my speakers?", a: "No. All films start muted and looping. You toggle sound by clicking the film." },
      { q: "When do I see this on a real hull scan?", a: "The pipeline reads the same structures as a real Gaussian Splatting model (.ply from the GS Server). Demo data is honestly labelled; production means wiring up the real API — an integration step our docs scope, not hide." },
    ],
  },
  offer: {
    kicker: "The offer",
    title: "A tool that earns while everything else stands still.",
    subtitle: "Open the live demo and scan five vessels yourself. Or scroll these films once more. Zero forms, zero calendar, zero pressure.",
    primary: "Open the live demo",
    secondary: "Watch the films again",
    note: "HULLSIGHT · BALTIC DUAL USE HACKATHON 2026 · GDANSK · BUILT IN 48 HOURS ON REAL GEOMETRIES",
    finaleCaption: "The hull from the inside, exactly as HullSight sees it",
  },
  footer: {
    tag: "HULLSIGHT",
    sub: "DUAL USE · GAUSSIAN SPLATTING · SURFACE COMPARISON",
    colTech: "TECH",
    colCtx: "CONTEXT",
    tech1: "Gaussian Splatting",
    tech2: "Time-series scan comparison",
    tech3: "Difference markers (the circle on screen)",
    tech4: "PL/EN",
    ctx1: "Baltic Dual Use Hackathon 2026",
    ctx2: "Track: Drones & Robotics / AI",
    ctx3: "University of Gdansk library",
    desc: "Two phone captures → a 3D model → one highlighted difference. Measurement, decision, zero excuses.",
    lang: "Language",
    back: "Back to the landing page",
  },
};

export const DICTS: Record<Lang, Copy> = { pl, en };