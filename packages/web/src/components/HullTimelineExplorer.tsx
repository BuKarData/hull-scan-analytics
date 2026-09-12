import { useEffect, useMemo, useRef, useState } from "react";
import type { ScanDetail, VesselDetailResponse } from "../lib/types";
import { useAsync } from "../hooks/useAsync";
import { api } from "../lib/api";
import { HullViewer, type PickInfo, type RenderMode, type ControlMode, type PointLayer } from "./HullViewer";
import { TimelineSlider, type TimelineItem } from "./TimelineSlider";
import { SeverityBadge } from "./SeverityBadge";
import { Sparkline } from "./Sparkline";
import { VISUAL_DEFORMATION_SCALE, exaggerateByDeviation, findNearestDefect, regionLabelFromUV, vesselDeviationDomain } from "../lib/geometry";
import { divergingRgb01, useResolvedPalette } from "../lib/theme";
import { formatDate, formatMm } from "../lib/format";
import { useLang } from "../lib/i18n";

const SEVERITY_RANK = { good: 0, warning: 1, serious: 2, critical: 3 } as const;
type PhaseTab = "budowa" | "eksploatacja";
const CROSSFADE_MS = 420;

/** Zamiast twardo podmieniac geometrie przy kazdym kroku suwaka, przez chwile
 *  renderujemy OBA skany naraz (stary znikajacy, nowy pojawiajacy sie), zeby
 *  przejscie miedzy kolejnymi stanami bylo plynne, a nie jak "przeskok". */
function useCrossfade(data: ScanDetail | null | undefined) {
  const [state, setState] = useState<{ from: ScanDetail | null; to: ScanDetail | null; t: number }>({
    from: null,
    to: data ?? null,
    t: 1,
  });
  const lastRef = useRef<ScanDetail | null | undefined>(data);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!data || lastRef.current === data) return;
    const prevTo = lastRef.current ?? null;
    const sameScan = prevTo?.id === data.id;
    lastRef.current = data;
    if (sameScan) {
      // Ten sam skan, tylko doprecyzowane dane (np. dolaczyl wynik /api/compare
      // z kolorami po tym jak surowy skan juz sie wyswietlil) - podmieniamy od
      // razu bez przenikania, zeby to nie wygladalo jak "przeskok" do samego siebie.
      setState({ from: null, to: data, t: 1 });
      return;
    }
    setState({ from: prevTo, to: data, t: prevTo ? 0 : 1 });
  }, [data]);

  useEffect(() => {
    if (!state.from) return;
    let start: number | null = null;
    function step(ts: number) {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / CROSSFADE_MS);
      setState((s) => (s.from ? { ...s, t } : s));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.to]);

  return state;
}

export function HullTimelineExplorer({ vessel }: { vessel: VesselDetailResponse }) {
  const { lang, t } = useLang();
  const palette = useResolvedPalette();

  const constructionItems: TimelineItem[] = useMemo(
    () =>
      vessel.constructionMilestones.map((m) => ({
        id: m.id,
        timestamp: m.timestamp,
        label: m.label,
        phase: m.phase,
      })),
    [vessel]
  );

  const serviceItems: TimelineItem[] = useMemo(() => {
    const baselineItem: TimelineItem = {
      id: vessel.baseline.id,
      timestamp: vessel.baseline.timestamp,
      label: vessel.baseline.label,
      phase: vessel.baseline.phase,
    };
    const fromScans: TimelineItem[] = vessel.scans.map((s) => {
      let worst: keyof typeof SEVERITY_RANK = "good";
      for (const d of vessel.defects) {
        const obs = d.history.find((h) => h.scanId === s.id);
        if (obs && SEVERITY_RANK[obs.severity] > SEVERITY_RANK[worst]) worst = obs.severity;
      }
      return { id: s.id, timestamp: s.timestamp, label: s.label, phase: s.phase, severity: worst };
    });
    return [baselineItem, ...fromScans].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [vessel]);

  // Staly (nie per-skan) zakres kolorow dla calej jednostki - dzieki temu
  // intensywnosc koloru realnie rosnie z kolejnymi przegladami zamiast za
  // kazdym razem rozciagac sie od nowa do pelnej skali.
  const domain = useMemo(() => vesselDeviationDomain(vessel.scans), [vessel.scans]);

  const [tab, setTab] = useState<PhaseTab>("eksploatacja");
  const items = tab === "budowa" ? constructionItems : serviceItems;

  const [index, setIndex] = useState(serviceItems.length - 1);
  const [sizeScale, setSizeScale] = useState(1);
  const [renderMode, setRenderMode] = useState<RenderMode>("mesh");
  const [controlMode, setControlMode] = useState<ControlMode>("orbit");
  const [pick, setPick] = useState<{ u: number; v: number } | null>(null);

  // Przy przelaczeniu zakladki wracamy do ostatniego (najnowszego) elementu tej zakladki.
  useEffect(() => {
    setIndex(items.length - 1);
    setPick(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Clamp defensywnie - po przelaczeniu zakladki `index` moze przez jeden
  // render wskazywac poza zakres nowej (krotszej) listy, zanim zadziala
  // powyzszy efekt.
  const safeIndex = Math.min(index, items.length - 1);
  const current = items[safeIndex];
  const scanQ = useAsync(() => api.scan(current.id), [current.id]);
  const milestoneMeta = vessel.constructionMilestones.find((m) => m.id === current.id);

  // Dla kazdego przegladu (poza samym stanem referencyjnym) doliczamy realne
  // odchylenie wzgledem geometrii projektowej - dokladnie tym samym
  // mechanizmem co strona "Porownaj" (ten sam endpoint, ta sama funkcja
  // koloru), zeby oba widoki pokazywaly uszkodzenia w ten sam sposob.
  const needsCompare = current.phase === "eksploatacja" && current.id !== vessel.baseline.id;
  const compareQ = useAsync(
    () => (needsCompare ? api.compare(vessel.baseline.id, current.id) : Promise.resolve(null)),
    [needsCompare, vessel.baseline.id, current.id]
  );

  const displayScan: ScanDetail | null = useMemo(() => {
    if (!scanQ.data) return null;
    if (!needsCompare || !compareQ.data) return scanQ.data;
    const dev = compareQ.data.deviationMm;
    const colors = new Array<number>(dev.length * 3);
    for (let i = 0; i < dev.length; i++) {
      const [r, g, b] = divergingRgb01(dev[i], domain, palette);
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }
    const positions = exaggerateByDeviation(scanQ.data.pointCloud.positions, scanQ.data.pointCloud.normals, dev, VISUAL_DEFORMATION_SCALE);
    return { ...scanQ.data, pointCloud: { ...scanQ.data.pointCloud, positions, baseColor: colors } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanQ.data, needsCompare, compareQ.data, domain, palette.mode]);

  const fade = useCrossfade(displayScan);

  const nearestDefect = useMemo(() => {
    if (!pick || current.phase !== "eksploatacja") return null;
    return findNearestDefect(pick.u, pick.v, vessel.defects);
  }, [pick, current.phase, vessel.defects]);

  function handlePickEvent(info: PickInfo | null) {
    if (!info || !fade.to) {
      setPick(null);
      return;
    }
    const uv = fade.to.pointCloud.uv;
    setPick({ u: uv[info.index * 2], v: uv[info.index * 2 + 1] });
  }

  const layers: PointLayer[] = useMemo(() => {
    const arr: PointLayer[] = [];
    if (fade.from && fade.t < 1) {
      arr.push({
        key: `xfade-from-${fade.from.id}`,
        positions: fade.from.pointCloud.positions,
        colors: fade.from.pointCloud.baseColor,
        normals: fade.from.pointCloud.normals,
        indices: fade.from.pointCloud.indices,
        size: 1,
        opacity: 1 - fade.t,
        pickable: false,
      });
    }
    if (fade.to) {
      arr.push({
        key: `xfade-to-${fade.to.id}`,
        positions: fade.to.pointCloud.positions,
        colors: fade.to.pointCloud.baseColor,
        normals: fade.to.pointCloud.normals,
        indices: fade.to.pointCloud.indices,
        size: 1,
        opacity: fade.from ? fade.t : 1,
        pickable: true,
      });
    }
    return arr;
  }, [fade]);

  return (
    <div className="rounded-xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {t.vessel.timelineTitle}
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {tab === "budowa" ? t.vessel.constructionSubtitle : t.vessel.serviceSubtitle} {t.vessel.timelineSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full p-1 shrink-0" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          {(
            [
              ["budowa", t.vessel.tabConstruction],
              ["eksploatacja", t.vessel.tabService],
            ] as [PhaseTab, string][]
          ).map(([tb, label]) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className="text-xs font-medium rounded-full px-3 py-1.5"
              style={{
                background: tab === tb ? "var(--brand)" : "transparent",
                color: tab === tb ? "white" : "var(--text-secondary)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "eksploatacja" && (
        <p className="text-xs -mt-2 mb-3" style={{ color: "var(--text-muted)" }}>
          {t.vessel.serviceRolloutNote}
        </p>
      )}

      <div className="w-full max-w-xl">
        <TimelineSlider
          items={items}
          index={safeIndex}
          onChange={(i) => {
            setIndex(i);
            setPick(null);
          }}
        />
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 mt-4">
        <div>
          {!fade.to ? (
            <div className="h-[380px] flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
              {t.common.loadingModel}
            </div>
          ) : (
            <HullViewer
              height={380}
              sizeScale={sizeScale}
              renderMode={renderMode}
              controlMode={controlMode}
              resetViewKey={`${vessel.vessel.id}-${tab}`}
              layers={layers}
              onHover={handlePickEvent}
              onPick={handlePickEvent}
            />
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap text-xs" style={{ color: "var(--text-secondary)" }}>
            <div className="flex items-center gap-1 rounded-full p-1" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              {(
                [
                  ["points", t.vessel.viewModePoints],
                  ["mesh", t.vessel.viewModeMesh],
                ] as [RenderMode, string][]
              ).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setRenderMode(m)}
                  className="text-xs font-medium rounded-full px-2.5 py-1"
                  style={{
                    background: renderMode === m ? "var(--brand)" : "transparent",
                    color: renderMode === m ? "white" : "var(--text-secondary)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-full p-1" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              {(
                [
                  ["orbit", t.vessel.cameraModeOrbit],
                  ["fly", t.vessel.cameraModeFly],
                ] as [ControlMode, string][]
              ).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setControlMode(m)}
                  className="text-xs font-medium rounded-full px-2.5 py-1"
                  style={{
                    background: controlMode === m ? "var(--brand)" : "transparent",
                    color: controlMode === m ? "white" : "var(--text-secondary)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {renderMode === "points" && (
              <label className="flex items-center gap-2">
                {t.vessel.pointSize}
                <input
                  type="range"
                  className="slim-range"
                  min={0.3}
                  max={3}
                  step={0.02}
                  value={sizeScale}
                  onChange={(e) => setSizeScale(Number(e.target.value))}
                />
              </label>
            )}
            <span style={{ color: "var(--text-muted)" }}>{controlMode === "orbit" ? t.vessel.controlsHintOrbit : t.vessel.controlsHintFly}</span>
          </div>
          {needsCompare && (
            <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
              {t.vessel.deformationScaleNote(VISUAL_DEFORMATION_SCALE)}
            </p>
          )}
        </div>

        <div className="rounded-lg p-3 text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <div className="mb-3">
            <div className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              {current.phase === "budowa" ? t.vessel.phaseBuild : t.vessel.phaseInspectionOrRef}
            </div>
            <div className="font-medium" style={{ color: "var(--text-primary)" }}>
              {current.label}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {formatDate(current.timestamp, lang)}
              {fade.to?.technician && fade.to.technician !== "-" ? ` · ${t.vessel.technician.toLowerCase()}: ${fade.to.technician}` : ""}
            </div>
            {milestoneMeta?.description && (
              <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
                {milestoneMeta.description}
              </p>
            )}
            {fade.to && current.phase === "eksploatacja" && current.id !== vessel.baseline.id && (
              <div className="flex gap-3 mt-2 text-xs tabular-nums" style={{ color: "var(--text-secondary)" }}>
                <span>
                  {t.vessel.peakDeviationShort}: {formatMm(fade.to.maxDeviationMm, 1)}
                </span>
                <span>
                  {t.vessel.defectsShort}: {fade.to.openDefectCount}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="text-xs uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>
              {t.vessel.pointDescriptionTitle}
            </div>
            {!pick && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t.vessel.pointDescriptionHint}
              </p>
            )}
            {pick && (
              <div className="flex flex-col gap-2">
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {t.vessel.section}:{" "}
                  <span style={{ color: "var(--text-primary)" }}>
                    {regionLabelFromUV(pick.u, pick.v, t.region.lengthBands, t.region.girthSectorsLower)}
                  </span>
                </div>
                {current.phase === "budowa" ? (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t.vessel.underConstructionNoData}
                  </p>
                ) : nearestDefect ? (
                  <div className="rounded-md p-2" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-xs" style={{ color: "var(--text-primary)" }}>
                        {t.defectType[nearestDefect.type]}
                      </span>
                      <SeverityBadge severity={nearestDefect.history[nearestDefect.history.length - 1].severity} />
                    </div>
                    <div className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                      {nearestDefect.region} &middot; {t.vessel.colStatus.toLowerCase()}: {t.defectStatus[nearestDefect.status]}
                    </div>
                    <Sparkline values={nearestDefect.history.map((h) => h.magnitudeMm)} width={140} height={30} />
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t.vessel.noDefectHere}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
