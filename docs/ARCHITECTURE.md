# Architektura

## 1. Kontekst

Aplikacja bazowa ("GS Server") przyjmuje zdjęcia z telefonu, uruchamia
COLMAP + trening Gaussian Splatting (Brush) i zwraca model jako plik `.ply`
(chmura gaussianów: pozycja, kolor/SH, opacity, skala, rotacja). Kontrakt tego
API (tryb `colmap_images` / `pointcloud_only` / `hybrid_colmap_pointcloud`,
`POST /jobs`, `POST /jobs/{id}/upload`, `POST /jobs/{id}/upload/complete`,
`GET /jobs/{id}/progress`, WebSocket `/jobs/{id}/ws`, `GET /jobs/{id}/model`)
jest odzwierciedlony w `packages/server/src/lib/gsClient.ts`.

Ta aplikacja (Hull Scan Analytics) siada **jedną warstwę wyżej**: nie zajmuje
się przechwytywaniem zdjęć ani treningiem modelu, tylko tym, co dzieje się po
otrzymaniu gotowego modelu `.ply` dla danego przeglądu:

1. zarejestrowanie modelu jako kolejnego "skanu" danej jednostki,
2. porównanie go z wcześniejszymi skanami tej samej jednostki,
3. wizualizacja różnic (heatmapy, historia, trendy),
4. utrzymanie rejestru usterek w czasie.

## 2. Docelowy przepływ danych (integracja z GS Server)

```
Telefon (skan przeglądowy)
   -> GS Server: POST /jobs (training_mode: colmap_images)
   -> GS Server: POST /jobs/{id}/upload (zdjecia)
   -> GS Server: POST /jobs/{id}/upload/complete
   -> GS Server: WS /jobs/{id}/ws  (postep treningu, tu: pasek postepu w UI)
   -> GS Server: GET /jobs/{id}/model  ->  model.ply
   -> Hull Scan Analytics: POST /api/vessels/:id/scans/ingest { plyBuffer, meta }
        1. plyParser.parsePly()          -> pozycje, kolor, opacity gaussianow
        2. filterByOpacity()             -> odrzucenie szumu rekonstrukcji
        3. rejestracja (patrz sekcja 4)  -> wspolny uklad wspolrzednych
        4. zapis jako nowy ScanDetail dla danej jednostki
   -> od teraz dostepny w /api/compare wzgledem dowolnego wczesniejszego skanu
```

Krok "ingest" nie jest jeszcze podpięty pod żadną trasę HTTP w tym repo -
`gsClient.ts` i `plyParser.ts` to gotowe cegiełki, czekające na decyzję biznesową
o tym, czy przechwytywanie zdjęć dzieje się w tej samej aplikacji, czy zostaje
w aplikacji mobilnej, a tu trafia już tylko gotowy `job_id`/`.ply`.

## 3. Dlaczego dane demo używają prawdziwej geometrii siatki, a nie realnych skanów

Bez dostępu do rzeczywistych `.ply` z wielu przeglądów tej samej jednostki nie
dało się zbudować wiarygodnej historii zmian. Zamiast tego
`packages/server/src/data/shipModel.ts` wczytuje prawdziwą siatkę trójkątów
kadłuba z pliku `.obj` (`packages/server/assets/ships/*.obj` - CC0, Kenney
"Watercraft Kit", zobacz `assets/ships/LICENSE.txt`), przeskalowuje ją do
rzeczywistych wymiarów danej jednostki i przypisuje każdemu wierzchołkowi
współrzędne `(u,v)` w tej samej konwencji, co poprzednia wersja z siatką
parametryczną (u: rufa→dziób po osi najdłuższego wymiaru modelu, v: kąt wokół
przekroju - burta prawa=0, pokład=0.25, burta lewa=0.5, dno=0.75, liczony
elipsoidalnie względem szerokości/wysokości kadłuba). Na tej bazie
`data/seed.ts` nakłada autorskie "historie usterek" (narastanie, nagłe
wystąpienie, naprawę, cykliczność) w kolejnych skanach tej samej jednostki.

Kluczowa różnica względem wcześniejszej siatki parametrycznej: prawdziwy model
`.obj` **nie ma struktury (i,j)** - to zwykła, nieregularna siatka trójkątów,
dokładnie taka, z jaką trzeba by się zmierzyć przy imporcie prawdziwego
zmeshowanego Gaussian Splattingu. Dlatego cały pipeline (agregacja regionowa,
wykrywanie skupisk) operuje na topologii trójkątów (`model.adjacency`) i
współrzędnych `(u,v)` per wierzchołek, a nie na indeksach siatki - patrz
sekcja 4.

Dzięki temu:

- każdy skan ma pełną, spójną chmurę punktów **i siatkę** (pozycja + normalna +
  kolor + trójkąty) w tym samym formacie, jakiego oczekuje frontend
  (renderowanie jako "Model" - cieniowana powierzchnia - albo jako "Chmura
  punktów"),
- historia usterek jest deterministyczna i sensowna narracyjnie (do demo/testów
  UI), zamiast losowego szumu,
- kadłub jest **rozpoznawalny jako statek** (a nie parametryczna bryła), co
  ma znaczenie przy prezentacji.

To jest świadomie **wymienialna warstwa**: prawdziwa integracja podmienia
`data/seed.ts` na wynik `plyParser.parsePly()` + rejestrację (patrz sekcja 2),
nie ruszając API ani frontendu - obie ścieżki kończą się tym samym kształtem
`PointCloud` (`positions`, `normals`, `baseColor`, `indices`, `uv`).

## 4. Algorytm porównania (`lib/compare.ts`)

Realne, niezależne rekonstrukcje Gaussian Splatting **nie mają odpowiadających
sobie indeksów punktów** - inna liczba gaussianów, inna kolejność, często inny
lokalny układ współrzędnych. Dlatego porównanie nie może być prostym
odejmowaniem `pozycja[i] - pozycja[i]`. Zaimplementowany pipeline:

1. **Wyszukiwanie najbliższego sąsiada (NN) w 3D** (`lib/spatialHash.ts`) -
   dla każdego punktu skanu B szukamy najbliższego punktu w skanie A (uniform
   grid hashing; dla setek tysięcy gaussianów w produkcji potrzebne byłoby
   k-d drzewo / octree i wcześniejszy voxel-downsampling).
2. **Odchylenie ze znakiem** - rzut wektora `(B - najbliższy_A)` na lokalną
   normalną powierzchni bazowej: dodatnie = narost/wybrzuszenie, ujemne =
   wgniecenie/ubytek.
3. **Agregacja regionowa** - każdy wierzchołek jest bucketowany wg swojego
   `(u,v)` do siatki 5 (dziób<->rufa) x 4 (burta P / pokład / burta L / dno),
   do heatmapy i szybkiego skanowania "co się zmieniło, gdzie". Działa
   niezależnie od tego, czy źródłowa siatka ma jakąkolwiek regularną
   strukturę.
4. **Wykrywanie skupisk (connected components)** - BFS po **topologii
   trójkątów** (`model.adjacency`, zbudowanej raz z listy trójkątów pliku
   `.obj`), nie po sztucznej siatce (i,j). Próg szumu skanu (domyślnie
   1.2 mm), klasyfikacja heurystyczna typu usterki (kształt wydłużony +
   ujemny znak -> pęknięcie; duży, płytki, ujemny obszar -> korozja/ubytek
   powłoki; zwarty, głęboki, ujemny -> wgniecenie; dodatni -> narost
   biologiczny) korzysta z realnego rozpiętości `u` klastra zamiast z
   przybliżenia przez indeksy wierszy siatki.
5. **Dopasowanie do rejestru usterek** po odległości w przestrzeni (u,v), żeby
   połączyć automatycznie wykryte skupisko z wcześniej potwierdzoną usterką
   (albo oznaczyć jako nowy, niezweryfikowany sygnał).

### Znane ograniczenia (celowo udokumentowane, nie ukrywane)

- **Rejestracja modeli**: zakładamy, że oba skany są już we wspólnym układzie
  współrzędnych. W praktyce różne przebiegi COLMAP dają różną skalę/orientację
  - potrzebna byłaby rejestracja (ICP na chmurze punktów albo dopasowanie po
    wspólnych punktach referencyjnych na kadłubie) *przed* krokiem porównania.
  - To jest najważniejszy brakujący element do podłączenia realnych danych.
- **Cienkie/rzadkie defekty** (np. włoskowate pęknięcia) mogą nie osiągnąć
  progu minimalnej liczby punktów w klastrze przy rzadkiej siatce próbkowania
  - stąd rejestr usterek jako oddzielne, kuratorowane źródło prawdy (może
    pochodzić z potwierdzenia przez inspektora), niezależne od automatycznej
    detekcji geometrycznej.
- **Gaussiany jako punkty, nie elipsoidy**: obecny pipeline (i demo-geometria)
  traktuje środek każdego gaussianu jako punkt. Pełne wykorzystanie kowariancji
  gaussianu (skala + rotacja) pozwoliłoby na dokładniejsze porównanie
  powierzchni, kosztem złożoności - naturalny kolejny krok.

## 5. Warstwa API

`packages/server` udostępnia:

- `GET /api/vessels` - lista jednostek + status skrócony (dashboard),
- `GET /api/vessels/:id` - jednostka + historia skanów + rejestr usterek,
- `GET /api/scans/:id` - pełny skan (metadane + chmura punktów),
- `GET /api/compare?a=<scanId>&b=<scanId>` - pełny wynik porównania dwóch
  skanów tej samej jednostki (statystyki, heatmapa regionowa, klastry).

Kontrakt jest celowo prosty i bezstanowy (REST, JSON), żeby dało się go łatwo
zastąpić / rozszerzyć o prawdziwe źródło danych bez zmian we frontendzie.

## 6. Frontend

React + TypeScript + Three.js (`@react-three/fiber`). Warstwa wizualna
(kolory heatmap, legendy, tabele-fallback, dostępność) zbudowana wg metodyki
opisanej w skillu `dataviz` używanym przy tworzeniu tego repo: kolor
sekwencyjny/rozbieżny liczony z tej samej domeny co dane, legenda zawsze
obecna przy >= 2 seriach, widok tabelaryczny jako alternatywa dla heatmapy,
motyw jasny/ciemny jako w pełni odrębne, zwalidowane warianty (nie automatyczny
filtr).

Kamera w widoku 3D (`components/HullViewer.tsx`) dopasowuje się automatycznie
do rozmiaru aktualnie wyświetlanego kadłuba (bounding sphere), bo flota
obejmuje jednostki od 32 m (holownik) do 210 m (kontenerowiec).
