import { useEffect, useState } from "react";
import type { Severity } from "./types";

// Wartosci lustrzane wobec zmiennych CSS w index.css - potrzebne tam, gdzie
// kolor musi trafic do WebGL/Canvas (Three.js), a nie do DOM/SVG (tam uzywamy
// bezposrednio "var(--...)").
export interface ResolvedPalette {
  mode: "light" | "dark";
  surface1: string;
  gridline: string;
  textMuted: string;
  divNeutral: string;
  seqBlue: [string, string, string, string]; // jasny -> ciemny (uzywany dla dodatnich odchylen)
  divRed: [string, string, string, string]; // jasny -> ciemny (uzywany dla ujemnych odchylen)
  status: Record<Severity, string>;
  categorical: { blue: string; orange: string; aqua: string; yellow: string; magenta: string; violet: string };
}

const LIGHT: ResolvedPalette = {
  mode: "light",
  surface1: "#fcfcfb",
  gridline: "#e1e0d9",
  textMuted: "#898781",
  divNeutral: "#f0efec",
  seqBlue: ["#cde2fb", "#86b6ef", "#3987e5", "#0d366b"],
  divRed: ["#f7d9d3", "#f0a99d", "#e34948", "#7a1f1f"],
  status: { good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b" },
  categorical: { blue: "#2a78d6", orange: "#eb6834", aqua: "#1baf7a", yellow: "#eda100", magenta: "#e87ba4", violet: "#4a3aa7" },
};

const DARK: ResolvedPalette = {
  mode: "dark",
  surface1: "#1a1a19",
  gridline: "#2c2c2a",
  textMuted: "#898781",
  divNeutral: "#383835",
  seqBlue: ["#cde2fb", "#86b6ef", "#3987e5", "#104281"],
  divRed: ["#f7d9d3", "#f0a99d", "#e66767", "#7a1f1f"],
  status: { good: "#0ca30c", warning: "#c98500", serious: "#ec835a", critical: "#e66767" },
  categorical: { blue: "#3987e5", orange: "#d95926", aqua: "#199e70", yellow: "#c98500", magenta: "#d55181", violet: "#9085e9" },
};

function detectDark(): boolean {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark") return true;
  if (attr === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useResolvedPalette(): ResolvedPalette {
  const [isDark, setIsDark] = useState<boolean>(() => (typeof window === "undefined" ? false : detectDark()));

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setIsDark(detectDark());
    mq.addEventListener("change", update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      mq.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);

  return isDark ? DARK : LIGHT;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function rampColor(ramp: [string, string, string, string], t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const stops = ramp.map(hexToRgb);
  const seg = clamped * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(seg));
  const localT = seg - i;
  const a = stops[i];
  const b = stops[i + 1];
  return rgbToHex([lerp(a[0], b[0], localT), lerp(a[1], b[1], localT), lerp(a[2], b[2], localT)]);
}

// Typowe odchylenie samego szumu skanu/rekonstrukcji (patrz deformShipModel:
// gaussianRandom(0, scanNoiseMm*0.35) z domyslnym scanNoiseMm=0.6 -> odchylenie
// std. ~0.21mm). Prog ustawiony na ~3 odchylenia standardowe tego szumu, zeby
// czysto losowy szum bez zadnej realnej usterki "zapalal" kolor na mniej niz
// ~0.3% wierzcholkow (zamiast ~15% przy progu 1.4 odchylenia, co na jednostce
// bez usterek dawalo widoczny, ciagly "pas" fałszywego uszkodzenia wzdluz
// stepki - artefakt cieniowania Gouraud na waskiej, jednowierzcholkowej linii
// dna kadluba, nie realny defekt).
export const NOISE_FLOOR_MM = 0.65;

/**
 * Odchylenie -> kolor rozbiezny (diverging): niebieski = narost/wybrzuszenie
 * (dodatnie), czerwony = wgniecenie/ubytek (ujemne), szary neutralny = brak
 * zmiany (ponizej progu szumu skanu). Domena skalowana do faktycznego zakresu
 * porownania (domainMaxMm), z minimalnym progiem, zeby jeden wyraznie
 * odstajacy punkt nie "wysycal" calej skali kolorow. Krzywa gamma (t^0.55)
 * podbija nasycenie dla lagodnych, ale realnych (powyzej progu szumu)
 * odchylen - bez niej wiekszosc typowych usterek ladowala w bladej, ledwo
 * widocznej czesci rampy liniowej.
 */
export function divergingColor(valueMm: number, domainMaxMm: number, palette: ResolvedPalette): string {
  const abs = Math.abs(valueMm);
  if (abs < NOISE_FLOOR_MM) return palette.divNeutral;
  const domain = Math.max(NOISE_FLOOR_MM + 0.5, domainMaxMm);
  const tLinear = Math.min(1, (abs - NOISE_FLOOR_MM) / (domain - NOISE_FLOOR_MM));
  const t = Math.pow(tLinear, 0.55);
  const ramp = valueMm > 0 ? palette.seqBlue : palette.divRed;
  return rampColor(ramp, t);
}

export function divergingRgb01(valueMm: number, domainMaxMm: number, palette: ResolvedPalette): [number, number, number] {
  const hex = divergingColor(valueMm, domainMaxMm, palette);
  const [r, g, b] = hexToRgb(hex);
  return [r / 255, g / 255, b / 255];
}

