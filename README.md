# HullSight

Dual use &middot; Gaussian Splatting &middot; Ship Analysis

Aplikacja do **analizy porównawczej skanów 3D kadłubów** (Gaussian Splatting)
wykonywanych telefonem podczas przeglądów okresowych statków i jednostek
pływających. Pokazuje historię zmian kadłuba w czasie, heatmapy odkształceń,
automatyczne wykrywanie potencjalnych usterek (wgniecenia, korozja, pęknięcia,
porost biologiczny) oraz rejestr usterek z pełną historią.

To jest **moduł analityczny/wizualizacyjny**, który dokłada się do istniejącej
aplikacji bazowej (serwer generujący modele Gaussian Splatting ze zdjęć -
"GS Server"). Zobacz [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) po pełny
opis architektury, algorytmów porównania i planu integracji z prawdziwym API.

> **Stan projektu:** dane w tej wersji są w 100% syntetyczne (deterministycznie
> generowane na bazie prawdziwej geometrii kadłuba - patrz niżej), żeby można
> było rozwijać i demonstrować UI/algorytmy zanim podłączymy realne skany.
> Patrz sekcja "Dane demonstracyjne vs realne" niżej.

## Funkcje

- **Przegląd floty** - lista jednostek, stan ogólny, otwarte usterki, trend.
- **Historia jednostki** - wykresy odchylenia od geometrii projektowej w
  czasie, % powierzchni zmienionej, pełny rejestr usterek ze sparklinami.
- **Porównanie dwóch skanów**:
  - widok 3D (Three.js) z trybami: heatmapa zmian, nałożenie obu skanów
    (overlay), podgląd surowego koloru każdego skanu,
  - heatmapa regionów kadłuba (siatka dziób/rufa x burty/pokład/dno),
  - automatyczne wykrywanie skupisk zmian (connected components na różnicy
    geometrii) z sugerowanym typem usterki i dopasowaniem do rejestru.

## Struktura repo

```
packages/
  server/   API (Express + TypeScript) - dane, geometria, algorytm porównania
  web/      Frontend (React + TypeScript + Three.js)
docs/
  ARCHITECTURE.md  - architektura, algorytmy, plan integracji z GS Server
```

## Uruchomienie lokalne

Wymaga Node.js 20+.

```bash
npm install
npm run dev:server   # API na http://localhost:4000
npm run dev:web      # UI na http://localhost:5173 (proxy /api -> :4000)
```

Albo `npm run dev`, żeby odpalić oba naraz.

## Dane demonstracyjne vs realne

Backend generuje deterministyczną, syntetyczną flotę (5 jednostek, po 5-6
skanów każda, z autorskimi "historiami usterek" - narastająca korozja, nagłe
wgniecenie, rozwijające się pęknięcie, cykliczny porost biologiczny), oparte
na prawdziwej geometrii siatki kadłuba (`packages/server/assets/ships/*.obj`,
CC0 - Kenney "Watercraft Kit", zobacz `assets/ships/LICENSE.txt`) przeskalowanej
do wymiarów każdej jednostki, a nie na parametrycznej bryle. Algorytm
porównania (`packages/server/src/lib/compare.ts`) działa na tych samych
zasadach, które będą potrzebne dla prawdziwych skanów: wyszukiwanie
najbliższego sąsiada w 3D (a nie odejmowanie punkt-po-punkcie), agregacja
regionowa po współrzędnych `(u,v)` per wierzchołek, wykrywanie skupisk zmian
metodą connected-components po topologii trójkątów (nie po sztucznej siatce
(i,j)) - dokładnie to, czego potrzeba dla dowolnej, niestrukturalnej siatki
(w tym prawdziwego, zmeshowanego Gaussian Splattingu).

Moduły gotowe pod integrację z prawdziwym API generującym modele (COLMAP +
Gaussian Splatting), ale jeszcze niepodpięte pod żadną trasę:

- `packages/server/src/lib/gsClient.ts` - klient HTTP/WS do bazowego serwera GS
  (tworzenie zadań, upload zdjęć, śledzenie postępu, pobranie modelu `.ply`).
- `packages/server/src/lib/plyParser.ts` - parser plików `.ply` z modelami
  Gaussian Splatting (pozycja, kolor z SH DC, opacity).

Szczegóły przepływu w `docs/ARCHITECTURE.md`.
