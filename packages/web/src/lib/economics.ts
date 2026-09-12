import type { Defect, Vessel, VesselType } from "./types";

/**
 * Model ekonomiczny "ile realnie oszczędza HullSight" - zbudowany na publicznie
 * znanych zależnościach z branży (patrz komentarze przy stałych), NIE na
 * zmierzonej telemetrii silnikowej floty (tej nie mamy - projekt operuje na
 * skanach kadłuba, nie na danych z maszynowni). Wszystkie założenia są
 * edytowalne w UI (patrz `EconomicAssumptions`) - to model do rozmowy z
 * klientem/inwestorem, jawnie oznaczony jako szacunkowy, nie audyt finansowy.
 */

export interface EconomicAssumptions {
  fuelPricePlnPerTonne: number;
  operatingDaysPerYear: number;
  traditionalSurveyCostPln: number;
}

// Szacunkowe dobowe zużycie paliwa (tony/dzień) przy typowej prędkości
// eksploatacyjnej dla KLASY kadłuba - rząd wielkości z ogólnodostępnych danych
// o zużyciu paliwa podobnych jednostek, nie dane silnikowe tej konkretnej
// jednostki.
const DAILY_FUEL_TONNES: Record<VesselType, number> = {
  fregata: 7.5,
  holownik: 1.4,
  prom: 26,
  kontenerowiec: 32,
  "jednostka-patrolowa": 3.2,
};

export const DEFAULT_ASSUMPTIONS: EconomicAssumptions = {
  fuelPricePlnPerTonne: 2600, // rząd wielkości ceny VLSFO/MGO w PLN
  operatingDaysPerYear: 230,
  traditionalSurveyCostPln: 18000, // typowy koszt przeglądu podwodnego przez nurków wraz z logistyką
};

// Przyjęte jako grubość geometryczna odpowiadająca "ciężkiemu, wapiennemu"
// porostowi - górna granica modelu (dane demo nie idą wyżej).
const FOULING_REFERENCE_MM = 4;
// Literatura branżowa: lekki ośliz ~1-2% kary paliwowej, ciężki porost
// wapienny 15-30%+ - przyjęta konserwatywna górna granica tego zakresu.
const MAX_FOULING_FUEL_PENALTY_PCT = 20;
// Jaką część kary paliwowej da się realnie uniknąć czyszcząc kadłub po
// WCZESNYM sygnale ze skanu, zamiast czekać aż porost narośnie do pełnej
// skali wykrytej w ostatnim przeglądzie.
const EARLY_DETECTION_RECOVERY_FRACTION = 0.65;

export function currentFoulingMagnitudeMm(defects: Defect[]): number {
  const foulingDefects = defects.filter((d) => d.type === "porost-biologiczny");
  if (foulingDefects.length === 0) return 0;
  return Math.max(0, ...foulingDefects.map((d) => Math.abs(d.history[d.history.length - 1]?.magnitudeMm ?? 0)));
}

export function foulingFuelPenaltyPct(magnitudeMm: number): number {
  const t = Math.min(1, Math.max(0, magnitudeMm / FOULING_REFERENCE_MM));
  return t * MAX_FOULING_FUEL_PENALTY_PCT;
}

export interface FuelImpact {
  annualFuelTonnes: number;
  foulingMagnitudeMm: number;
  penaltyPct: number;
  extraTonnesPerYear: number;
  extraCostPerYearPln: number;
  recoverableTonnesPerYear: number;
  recoverableCostPerYearPln: number;
}

export function estimateFuelImpact(vessel: Vessel, defects: Defect[], assumptions: EconomicAssumptions): FuelImpact {
  const dailyTonnes = DAILY_FUEL_TONNES[vessel.type];
  const annualFuelTonnes = dailyTonnes * assumptions.operatingDaysPerYear;
  const foulingMagnitudeMm = currentFoulingMagnitudeMm(defects);
  const penaltyPct = foulingFuelPenaltyPct(foulingMagnitudeMm);
  const extraTonnesPerYear = annualFuelTonnes * (penaltyPct / 100);
  const extraCostPerYearPln = extraTonnesPerYear * assumptions.fuelPricePlnPerTonne;
  const recoverableTonnesPerYear = extraTonnesPerYear * EARLY_DETECTION_RECOVERY_FRACTION;
  const recoverableCostPerYearPln = recoverableTonnesPerYear * assumptions.fuelPricePlnPerTonne;
  return {
    annualFuelTonnes,
    foulingMagnitudeMm,
    penaltyPct,
    extraTonnesPerYear,
    extraCostPerYearPln,
    recoverableTonnesPerYear,
    recoverableCostPerYearPln,
  };
}

export interface SurveyImpact {
  inspectionsPerformed: number;
  avoidedCostPln: number;
}

export function estimateSurveyImpact(scanCount: number, assumptions: EconomicAssumptions): SurveyImpact {
  // scanCount = liczba realnych przeglądów po skanie bazowym (skan bazowy to
  // geometria projektowa/referencyjna, nie przegląd, który zastąpilibyśmy nurkiem).
  const inspectionsPerformed = Math.max(0, scanCount);
  return { inspectionsPerformed, avoidedCostPln: inspectionsPerformed * assumptions.traditionalSurveyCostPln };
}
